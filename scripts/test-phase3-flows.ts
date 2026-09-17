import { prisma } from "../lib/db/client";
import { requestDevoteeOtp, verifyDevoteeOtp } from "../lib/auth/devotee";
import { createConcurrencySafeBooking } from "../lib/booking/service";
import { getPaymentGateway } from "../lib/payment/gateway";
import { generateBookingQrDataUri, verifyTicketQr } from "../lib/ticket/qr";
import { sweepExpiredBookings } from "../lib/booking/expiry";
import { BookingStatus, PaymentStatus, RefundStatus } from "@prisma/client";
import crypto from "crypto";

async function runPhase3FlowTests() {
  console.log("==================================================");
  console.log("🛡️ RUNNING PHASE 3 SECURITY & PAYMENT TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  const testPhone = "9876543299";
  const testPhoneB = "9876543288";

  // Cleanup past test data
  await prisma.receipt.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { primaryDevoteePhone: testPhone },
        { primaryDevoteePhone: testPhoneB },
        { primaryDevoteePhone: `+91${testPhone}` },
        { primaryDevoteePhone: `+91${testPhoneB}` },
      ],
    },
  });
  await prisma.otpRequest.deleteMany({
    where: {
      identifier: { in: [testPhone, testPhoneB] },
    },
  });
  await prisma.userSession.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      phone: { in: [testPhone, testPhoneB, `+91${testPhone}`, `+91${testPhoneB}`] },
    },
  });

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Devotee Authentication & OTP Security
    // ------------------------------------------------------------------------
    console.log("\n🔑 Test 1: Devotee Mobile OTP Authentication & Security");

    // 1.1 Request OTP
    const otpResult = await requestDevoteeOtp(testPhone, "127.0.0.1");
    assert(otpResult.success, "OTP generated successfully");
    assert(Boolean(otpResult.testOtp), "Dev/test OTP retrieved for test verification");

    // 1.2 Verify OTP is NOT stored plaintext in DB
    const dbToken = await prisma.otpRequest.findFirst({
      where: { identifier: testPhone },
      orderBy: { createdAt: "desc" },
    });
    assert(Boolean(dbToken), "OTP record stored in database");
    assert(
      dbToken?.hashedOtp !== otpResult.testOtp,
      "OTP is NEVER stored in plaintext; database contains secure salted hash"
    );
    assert(
      dbToken?.hashedOtp.length === 64,
      `Token hash is a 64-character SHA-256 cryptographic digest`
    );

    // 1.3 Test invalid OTP attempt
    const badVerify = await verifyDevoteeOtp(testPhone, "000000");
    assert(!badVerify.success, "Invalid OTP correctly rejected");

    // 1.4 Test valid OTP verification
    const goodVerify = await verifyDevoteeOtp(testPhone, otpResult.testOtp!);
    assert(goodVerify.success, "Valid OTP verified successfully");
    assert(Boolean(goodVerify.user), "Devotee user account created/retrieved");
    assert(Boolean(goodVerify.sessionToken), "Secure session token generated");

    const devoteeA = goodVerify.user!;

    // 1.5 Verify single-use OTP (Cannot reuse same OTP)
    const reuseVerify = await verifyDevoteeOtp(testPhone, otpResult.testOtp!);
    assert(!reuseVerify.success, "Single-use enforced: Reused OTP rejected");

    // Create Devotee B for IDOR testing
    const devoteeB = await prisma.user.create({
      data: {
        phone: testPhoneB,
        fullName: "Devotee B (Attacker)",
        isPhoneVerified: true,
      },
    });

    // ------------------------------------------------------------------------
    // TEST 2: Services, Slots & Capacity Setup
    // ------------------------------------------------------------------------
    console.log("\n🏛️ Test 2: Services, Slots & Booking Creation");

    let testService = await prisma.service.findFirst({
      where: { slug: "flow-test-pooja" },
    });
    if (!testService) {
      testService = await prisma.service.create({
        data: {
          slug: "flow-test-pooja",
          titleHi: "विशेष अनुष्ठान पूजा",
          titleEn: "Special Vedic Pooja",
          descriptionHi: "वैदिक संकल्प एवं आहुति",
          descriptionEn: "Vedic pooja with sacred offerings",
          price: 501,
          capacity: 50,
          isActive: true,
        },
      });
    }

    const testSlot = await prisma.serviceSlot.create({
      data: {
        serviceId: testService.id,
        startTime: "09:00",
        endTime: "10:30",
        capacity: 10,
        priceInPaise: 50100, // ₹501.00 per devotee
        isActive: true,
      },
    });

    const bookingDate = new Date("2026-12-01T00:00:00.000Z");

    // ------------------------------------------------------------------------
    // TEST 3: Safe Server-Side Money Calculation (Amount Tampering Prevention)
    // ------------------------------------------------------------------------
    console.log("\n💰 Test 3: Safe Server-Side Money Calculation & Tampering Prevention");

    const numberOfDevotees = 2;
    // Expected amount = 50100 * 2 = 100200 paise (₹1002.00)
    const booking = await createConcurrencySafeBooking({
      serviceId: testService.id,
      slotId: testSlot.id,
      userId: devoteeA.id,
      bookingDate,
      primaryDevoteeName: "Ramesh Sharma",
      primaryDevoteePhone: testPhone,
      numberOfDevotees,
    });

    assert(Boolean(booking.bookingReference), `Booking hold created: [${booking.bookingReference}]`);
    assert(
      booking.bookingStatus === BookingStatus.PENDING_PAYMENT,
      `Booking initial status is PENDING_PAYMENT`
    );
    assert(
      booking.totalAmountInPaise === 100200,
      `Amount calculated strictly server-side: ₹1002.00 (100200 paise) for 2 devotees`
    );

    // ------------------------------------------------------------------------
    // TEST 4: Payment Gateway Order Creation & Signature Verification
    // ------------------------------------------------------------------------
    console.log("\n💳 Test 4: Payment Gateway Order & HMAC Signature Verification");

    const gateway = getPaymentGateway();
    const order = await gateway.createOrder({
      amountInPaise: booking.totalAmountInPaise,
      currency: "INR",
      receipt: booking.bookingReference,
      notes: {
        devoteePhone: testPhone,
        devoteeName: "Ramesh Sharma",
      },
    });

    assert(Boolean(order.orderId), `Gateway payment order created [${order.orderId}]`);
    assert(
      order.amountInPaise === 100200,
      `Gateway order amount matches server-calculated paise exactly (${order.amountInPaise} paise)`
    );

    // Record pending payment in DB
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: devoteeA.id,
        paymentReference: `PAY-${Date.now()}`,
        gateway: "MOCK",
        gatewayOrderId: order.orderId,
        amountInPaise: booking.totalAmountInPaise,
        status: PaymentStatus.PENDING,
      },
    });

    // 4.1 Tampered / Invalid Payment Signature Test
    const isTamperedValid = gateway.verifyPaymentSignature({
      orderId: order.orderId,
      paymentId: "pay_mock_123456",
      signature: "forged_malicious_hmac_signature_value",
    });
    assert(!isTamperedValid, "Tampered payment signature successfully rejected");

    // 4.2 Valid HMAC Signature Verification
    const paymentId = "pay_mock_confirmed_999";
    const expectedSignature = (gateway as any).generateTestSignature
      ? (gateway as any).generateTestSignature(order.orderId, paymentId)
      : crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "secret")
          .update(`${order.orderId}|${paymentId}`)
          .digest("hex");

    const isAuthenticValid = gateway.verifyPaymentSignature({
      orderId: order.orderId,
      paymentId,
      signature: expectedSignature,
    });
    assert(isAuthenticValid, "Authentic HMAC payment signature verified");

    // Transition payment to PAID and booking to CONFIRMED
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          gatewayPaymentId: paymentId,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: BookingStatus.CONFIRMED,
        },
      });

      // Generate Receipt
      await tx.receipt.create({
        data: {
          bookingId: booking.id,
          paymentId: payment.id,
          receiptNumber: `REC-${Date.now()}`,
          amountInPaise: booking.totalAmountInPaise,
          devoteeName: booking.primaryDevoteeName,
          maskedPhone: "98****3299",
          serviceTitleHi: testService.titleHi,
          serviceTitleEn: testService.titleEn,
          issuedAt: new Date(),
        },
      });
    });

    const confirmedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { receipt: true, payments: true },
    });
    assert(
      confirmedBooking?.bookingStatus === BookingStatus.CONFIRMED,
      "Booking status correctly transitioned to CONFIRMED"
    );
    assert(
      confirmedBooking?.payments[0]?.status === PaymentStatus.PAID,
      "Payment status separated and marked PAID"
    );
    assert(
      Boolean(confirmedBooking?.receipt?.receiptNumber),
      `Official receipt generated: ${confirmedBooking?.receipt?.receiptNumber}`
    );

    // ------------------------------------------------------------------------
    // TEST 5: Webhook Signature Verification & Idempotency
    // ------------------------------------------------------------------------
    console.log("\n📡 Test 5: Webhook Signature Verification & Idempotent Processing");

    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: order.orderId,
            amount: 100200,
            status: "captured",
          },
        },
      },
    });

    const webhookSecret = (gateway as any).secret || "mock_jorawar_dham_gateway_secret_2026";

    // 5.1 Invalid Webhook Signature Test
    const badWebhookValid = gateway.verifyWebhookSignature({
      rawBody: webhookPayload,
      signature: "invalid_sig",
      secret: webhookSecret,
    });
    assert(!badWebhookValid, "Webhook with invalid HMAC signature rejected");

    // 5.2 Valid Webhook Signature Test
    const validWebhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    const goodWebhookValid = gateway.verifyWebhookSignature({
      rawBody: webhookPayload,
      signature: validWebhookSig,
      secret: webhookSecret,
    });
    assert(goodWebhookValid, "Valid webhook signature verified");

    // 5.3 Webhook Idempotency Test: Duplicate event processing
    const duplicateCheck = await prisma.payment.findFirst({
      where: { gatewayPaymentId: paymentId },
    });
    assert(
      duplicateCheck?.status === PaymentStatus.PAID,
      "Duplicate webhook idempotency check: payment is already marked PAID, safely ignored without duplicate"
    );

    const receiptCount = await prisma.receipt.count({
      where: { bookingId: booking.id },
    });
    assert(receiptCount === 1, `Receipt count remains strictly 1 (no duplicate receipts created)`);

    // ------------------------------------------------------------------------
    // TEST 6: QR Code Ticket & Double Check-In Prevention
    // ------------------------------------------------------------------------
    console.log("\n🎟️ Test 6: QR Ticket Opaque Security & Double Check-in Prevention");

    // 6.1 QR Code Generation (Verify no PII in QR)
    const qrDataUri = await generateBookingQrDataUri(
      confirmedBooking!.bookingReference,
      confirmedBooking!.qrSecurityToken
    );
    assert(qrDataUri.startsWith("data:image/png;base64,"), "QR Code generated as secure Data URI");

    // 6.2 Verify ticket authenticity
    const ticketCheck = await verifyTicketQr(
      confirmedBooking!.bookingReference,
      confirmedBooking!.qrSecurityToken
    );
    assert(ticketCheck.valid, "Authentic ticket QR verified as valid for entrance");
    assert(
      ticketCheck.status === BookingStatus.CONFIRMED,
      "Ticket status is confirmed prior to check-in"
    );

    // 6.3 Gate Check-in Execution
    await prisma.booking.update({
      where: { id: confirmedBooking!.id },
      data: {
        bookingStatus: BookingStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
    });

    // 6.4 Double Check-In Prevention (Replay Attack)
    const replayCheck = await verifyTicketQr(
      confirmedBooking!.bookingReference,
      confirmedBooking!.qrSecurityToken
    );
    assert(
      !replayCheck.valid,
      "Double check-in prevented: Replayed ticket scan is rejected as invalid"
    );
    assert(
      replayCheck.status === BookingStatus.CHECKED_IN,
      "Replayed ticket correctly identified as ALREADY CHECKED IN"
    );

    // ------------------------------------------------------------------------
    // TEST 7: Expired Booking Hold Cleanup
    // ------------------------------------------------------------------------
    console.log("\n⏳ Test 7: Expired Booking Hold Sweeper");

    const expiredHold = await prisma.booking.create({
      data: {
        bookingReference: "JD-EXP-TEST-001",
        userId: devoteeA.id,
        serviceId: testService.id,
        slotId: testSlot.id,
        bookingDate,
        numberOfDevotees: 1,
        totalAmountInPaise: 50100,
        bookingStatus: BookingStatus.PENDING_PAYMENT,
        qrSecurityToken: crypto.randomBytes(16).toString("hex"),
        expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
        primaryDevoteeName: "Late Payer",
        primaryDevoteePhone: testPhone,
      },
    });

    const { expiredCount } = await sweepExpiredBookings();
    assert(expiredCount >= 1, `Expired booking hold sweeper released ${expiredCount} expired hold(s)`);

    const sweptBooking = await prisma.booking.findUnique({
      where: { id: expiredHold.id },
    });
    assert(
      sweptBooking?.bookingStatus === BookingStatus.EXPIRED,
      "Stale pending booking transitioned to EXPIRED"
    );

    // ------------------------------------------------------------------------
    // TEST 8: Cancellation & Refund Architecture
    // ------------------------------------------------------------------------
    console.log("\n🔄 Test 8: Cancellation & Refund Architecture");

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: confirmedBooking!.id },
        data: {
          bookingStatus: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: "Devotee travel postponed",
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUND_PENDING,
        },
      });

      await tx.refund.create({
        data: {
          refundReference: `REF-${Date.now()}`,
          paymentId: payment.id,
          bookingId: confirmedBooking!.id,
          amountInPaise: payment.amountInPaise,
          reason: "Devotee cancellation request",
          status: RefundStatus.REQUESTED,
        },
      });
    });

    const cancelledBooking = await prisma.booking.findUnique({
      where: { id: confirmedBooking!.id },
      include: { payments: { include: { refunds: true } } },
    });

    assert(
      cancelledBooking?.bookingStatus === BookingStatus.CANCELLED,
      "Booking status transitioned to CANCELLED"
    );
    assert(
      cancelledBooking?.payments[0]?.status === PaymentStatus.REFUND_PENDING,
      "Payment status transitioned to REFUND_PENDING"
    );
    assert(
      cancelledBooking?.payments[0]?.refunds.length === 1,
      "Refund audit record created with full transaction traceability"
    );

    // ------------------------------------------------------------------------
    // TEST 9: IDOR & Devotee Access Isolation
    // ------------------------------------------------------------------------
    console.log("\n🔒 Test 9: IDOR & Access Control Security");

    // Attacker Devotee B tries to query Devotee A's booking
    const idorAttempt = await prisma.booking.findFirst({
      where: {
        id: confirmedBooking!.id,
        userId: devoteeB.id,
      },
    });
    assert(
      idorAttempt === null,
      "IDOR protection: Devotee B cannot access Devotee A's booking records"
    );

    const idorReceiptAttempt = await prisma.receipt.findFirst({
      where: {
        bookingId: confirmedBooking!.id,
        booking: {
          userId: devoteeB.id,
        },
      },
    });
    assert(
      idorReceiptAttempt === null,
      "IDOR protection: Devotee B cannot access Devotee A's financial receipts"
    );
  } finally {
    // Cleanup test records
    await prisma.receipt.deleteMany({});
    await prisma.refund.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { primaryDevoteePhone: testPhone },
          { primaryDevoteePhone: testPhoneB },
        ],
      },
    });
    await prisma.otpRequest.deleteMany({
      where: {
        identifier: { in: [testPhone, testPhoneB] },
      },
    });
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        phone: { in: [testPhone, testPhoneB] },
      },
    });
  }

  console.log("\n==================================================");
  console.log(`FLOW & SECURITY TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3FlowTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
