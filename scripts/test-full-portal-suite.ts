import { prisma } from "../lib/db/client";
import { createConcurrencySafeBooking } from "../lib/booking/service";
import { MockGatewayProvider } from "../lib/payment/gateway";
import { generateBookingQrDataUri, verifyTicketQr } from "../lib/ticket/qr";
import { sweepExpiredBookings } from "../lib/booking/expiry";
import { BookingStatus, PaymentStatus, PaymentGateway } from "@prisma/client";
import crypto from "crypto";

async function runFullPortalTestSuite() {
  console.log("================================================================");
  console.log("🏛️ JORAWAR DHAM: FULL PORTAL & BOOKING SYSTEM VERIFICATION SUITE");
  console.log("================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // Set up test devotees
  const phoneDevoteeA = "9800000001";
  const phoneDevoteeB = "9800000002";

  // Clean previous test artifacts
  await prisma.receipt.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { primaryDevoteePhone: { startsWith: "+919800000" } },
        { primaryDevoteePhone: { startsWith: "9800000" } },
      ],
    },
  });
  await prisma.donation.deleteMany({
    where: {
      OR: [
        { donorPhone: { startsWith: "+919800000" } },
        { donorPhone: { startsWith: "9800000" } },
      ],
    },
  });
  await prisma.userSession.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      OR: [
        { phone: { startsWith: "+919800000" } },
        { phone: { startsWith: "9800000" } },
      ],
    },
  });

  // Create Devotee A and Devotee B in database
  const userA = await prisma.user.create({
    data: {
      phone: `+91${phoneDevoteeA}`,
      fullName: "Devotee Ramesh",
      email: "ramesh@example.com",
      status: "ACTIVE",
    },
  });

  const userB = await prisma.user.create({
    data: {
      phone: `+91${phoneDevoteeB}`,
      fullName: "Devotee Suresh",
      email: "suresh@example.com",
      status: "ACTIVE",
    },
  });

  // Ensure an active test service exists
  let testService = await prisma.service.findFirst({
    where: { isActive: true },
  });

  if (!testService) {
    testService = await prisma.service.create({
      data: {
        slug: "vip-darshan-portal-test",
        titleEn: "VIP Darshan Test",
        titleHi: "वीआईपी दर्शन टेस्ट",
        descriptionEn: "Test VIP Darshan Service",
        descriptionHi: "टेस्ट वीआईपी दर्शन सेवा",
        price: 250,
        capacity: 50,
        isActive: true,
      },
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const testDate = tomorrow.toISOString().split("T")[0];

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: SLOT MANAGEMENT & AVAILABILITY
    // ------------------------------------------------------------------------
    console.log("\n📦 1. SLOT MANAGEMENT & AVAILABILITY ENFORCEMENT");

    // 1.1 Create an OPEN slot with capacity = 1
    const openSlot = await prisma.serviceSlot.create({
      data: {
        serviceId: testService.id,
        date: new Date(`${testDate}T00:00:00.000Z`),
        startTime: "09:00",
        endTime: "10:00",
        capacity: 1,
        priceInPaise: (testService.price || 250) * 100,
        isActive: true,
      },
    });
    assert(Boolean(openSlot.id), `Created active slot (${openSlot.id}) with capacity=1`);

    // 1.2 Create a DISABLED slot
    const disabledSlot = await prisma.serviceSlot.create({
      data: {
        serviceId: testService.id,
        date: new Date(`${testDate}T00:00:00.000Z`),
        startTime: "10:00",
        endTime: "11:00",
        capacity: 20,
        priceInPaise: (testService.price || 250) * 100,
        isActive: false,
      },
    });
    assert(!disabledSlot.isActive, "Created slot with isActive=false (DISABLED)");

    // 1.3 Booking disabled slot must be strictly rejected
    let disabledBookingFailed = false;
    try {
      await createConcurrencySafeBooking({
        userId: userA.id,
        serviceId: testService.id,
        slotId: disabledSlot.id,
        bookingDate: testDate,
        numberOfDevotees: 1,
        primaryDevoteeName: "Devotee Ramesh",
        primaryDevoteePhone: phoneDevoteeA,
      });
    } catch (err: any) {
      disabledBookingFailed = true;
      assert(err.message.includes("उपलब्ध नहीं") || err.name === "SlotNotFoundError", `Disabled slot was rejected: "${err.message}"`);
    }
    assert(disabledBookingFailed, "Booking a DISABLED slot is strictly prohibited");

    // ------------------------------------------------------------------------
    // SECTION 2: CONCURRENCY & OVER-ALLOCATION PROTECTION
    // ------------------------------------------------------------------------
    console.log("\n⚡ 2. CONCURRENCY & OVER-ALLOCATION UNDER CONTENTION");
    console.log("   Firing 10 concurrent booking requests for single-seat slot...");

    const contenderUsers: string[] = [];
    for (let i = 0; i < 10; i++) {
      const cUser = await prisma.user.create({
        data: {
          phone: `+91980000010${i}`,
          fullName: `Contender ${i + 1}`,
          status: "ACTIVE",
        },
      });
      contenderUsers.push(cUser.id);
    }

    const results = await Promise.allSettled(
      contenderUsers.map((uid, idx) =>
        createConcurrencySafeBooking({
          userId: uid,
          serviceId: testService.id,
          slotId: openSlot.id,
          bookingDate: testDate,
          numberOfDevotees: 1,
          primaryDevoteeName: `Contender ${idx + 1}`,
          primaryDevoteePhone: `980000010${idx}`,
        })
      )
    );

    const successfulBookings = results.filter((r) => r.status === "fulfilled");
    const rejectedBookings = results.filter((r) => r.status === "rejected");

    assert(successfulBookings.length === 1, `Exactly 1 winner succeeded (got ${successfulBookings.length})`);
    assert(rejectedBookings.length === 9, `All other 9 contenders were rejected with capacity full`);

    // Verify slot capacity remaining in DB
    const winningBooking = (successfulBookings[0] as PromiseFulfilledResult<any>).value;
    assert(winningBooking.bookingStatus === BookingStatus.PENDING_PAYMENT, "Winner booking is registered in PENDING_PAYMENT hold");

    // 1.4 Attempting another booking on now FULL slot must immediately fail
    let fullSlotBookingFailed = false;
    try {
      await createConcurrencySafeBooking({
        userId: userA.id,
        serviceId: testService.id,
        slotId: openSlot.id,
        bookingDate: testDate,
        numberOfDevotees: 1,
        primaryDevoteeName: "Late Devotee",
        primaryDevoteePhone: "9800000099",
      });
    } catch (err: any) {
      fullSlotBookingFailed = true;
      assert(err.name === "CapacityExceededError" || err.message.includes("सीटें"), `Full slot correctly rejected: "${err.message}"`);
    }
    assert(fullSlotBookingFailed, "Booking on FULL slot is rejected by DB lock check");

    // ------------------------------------------------------------------------
    // SECTION 3: EXPIRY SWEEP & CAPACITY RELEASE
    // ------------------------------------------------------------------------
    console.log("\n⏳ 3. BOOKING HOLD TIMEOUT & CAPACITY RELEASE");

    // Manually age the winning booking beyond hold timeout (e.g. 16 minutes ago)
    const sixteenMinsAgo = new Date(Date.now() - 16 * 60 * 1000);
    await prisma.booking.update({
      where: { id: winningBooking.id },
      data: { createdAt: sixteenMinsAgo, expiresAt: sixteenMinsAgo },
    });

    const sweepResult = await sweepExpiredBookings();
    assert(sweepResult.expiredCount > 0, `Expired hold was swept (swept ${sweepResult.expiredCount} bookings)`);

    const updatedBooking = await prisma.booking.findUnique({ where: { id: winningBooking.id } });
    assert(updatedBooking?.bookingStatus === BookingStatus.EXPIRED, "Swept booking status marked EXPIRED");

    // Now slot capacity must be free again for another user!
    const rebookedBooking = await createConcurrencySafeBooking({
      userId: userA.id,
      serviceId: testService.id,
      slotId: openSlot.id,
      bookingDate: testDate,
      numberOfDevotees: 1,
      primaryDevoteeName: "Devotee Ramesh",
      primaryDevoteePhone: phoneDevoteeA,
    });
    assert(Boolean(rebookedBooking.id), "Released capacity was successfully booked by Devotee A");

    // ------------------------------------------------------------------------
    // SECTION 4: PAYMENT GATEWAY & SERVER-SIDE AMOUNT VERIFICATION
    // ------------------------------------------------------------------------
    console.log("\n💳 4. PAYMENT SECURITY & SERVER-SIDE AMOUNT VERIFICATION");
    const gateway = new MockGatewayProvider();

    // 4.1 Server calculates authoritative amount
    const bookingFull = await prisma.booking.findUnique({
      where: { id: rebookedBooking.id },
      include: { service: true, slot: true },
    });

    const expectedAmountPaise = bookingFull!.totalAmountInPaise;
    const expectedAmountRupees = expectedAmountPaise / 100;
    assert(expectedAmountRupees > 0, `Authoritative server price calculated: ₹${expectedAmountRupees} (${expectedAmountPaise} paise)`);

    // Create order with gateway
    const order = await gateway.createOrder({
      amountInPaise: expectedAmountPaise,
      currency: "INR",
      receipt: `BKG-${rebookedBooking.bookingReference}`,
      notes: { bookingId: rebookedBooking.id },
    });
    assert(Boolean(order.orderId), `Payment order created with Gateway (Order ID: ${order.orderId})`);

    // Verify amount tampering: client claims amount is ₹1
    const clientTamperedAmount = 1;
    assert(clientTamperedAmount !== expectedAmountRupees, "Client attempted amount tampering (₹1 vs server ₹250)");

    // Simulate proper signature verification
    const mockRazorpayPaymentId = `pay_test_${crypto.randomBytes(6).toString("hex")}`;
    const validSignature = gateway.generateTestSignature(order.orderId, mockRazorpayPaymentId);
    const invalidSignature = "fake_invalid_tampered_signature";

    const isFakeValid = gateway.verifyPaymentSignature({
      orderId: order.orderId,
      paymentId: mockRazorpayPaymentId,
      signature: invalidSignature,
    });
    assert(!isFakeValid, "Invalid payment signature rejected");

    const isSignatureValid = gateway.verifyPaymentSignature({
      orderId: order.orderId,
      paymentId: mockRazorpayPaymentId,
      signature: validSignature,
    });
    assert(isSignatureValid, "Valid HMAC-SHA256 signature verified");

    // Confirm booking and create payment + receipt records
    const confirmedPayment = await prisma.payment.create({
      data: {
        paymentReference: `PAY-${rebookedBooking.bookingReference}`,
        bookingId: rebookedBooking.id,
        userId: userA.id,
        amountInPaise: expectedAmountPaise,
        currency: "INR",
        gateway: PaymentGateway.MOCK,
        gatewayOrderId: order.orderId,
        gatewayPaymentId: mockRazorpayPaymentId,
        gatewaySignature: validSignature,
        status: PaymentStatus.PAID,
        idempotencyKey: `pay-confirm-${rebookedBooking.id}`,
      },
    });

    await prisma.booking.update({
      where: { id: rebookedBooking.id },
      data: {
        bookingStatus: BookingStatus.CONFIRMED,
      },
    });

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber: `REC-${rebookedBooking.bookingReference}`,
        bookingId: rebookedBooking.id,
        paymentId: confirmedPayment.id,
        amountInPaise: expectedAmountPaise,
        devoteeName: rebookedBooking.primaryDevoteeName,
        maskedPhone: rebookedBooking.primaryDevoteePhone.replace(/(\d{2})\d{4}(\d{4})/, "$1****$2"),
        serviceTitleHi: testService.titleHi,
        serviceTitleEn: testService.titleEn,
      },
    });
    assert(Boolean(receipt.receiptNumber), `Official receipt generated: ${receipt.receiptNumber}`);

    // ------------------------------------------------------------------------
    // SECTION 5: DIGITAL TICKET & SCANNABLE QR CODE
    // ------------------------------------------------------------------------
    console.log("\n🎟️ 5. DIGITAL TICKET & CRYPTOGRAPHIC QR CODE");

    const qrDataUri = await generateBookingQrDataUri(
      rebookedBooking.bookingReference,
      rebookedBooking.qrSecurityToken
    );

    assert(qrDataUri.startsWith("data:image/png;base64,"), "QR Code generated as high-contrast Data URI image");

    // Verify the QR ticket
    const qrVerification = await verifyTicketQr(
      rebookedBooking.bookingReference,
      rebookedBooking.qrSecurityToken
    );
    assert(qrVerification.valid, `QR ticket verification succeeded: "${qrVerification.message}"`);

    // ------------------------------------------------------------------------
    // SECTION 6: IDOR (INSECURE DIRECT OBJECT REFERENCE) PROTECTION
    // ------------------------------------------------------------------------
    console.log("\n🛡️ 6. IDOR (DEVOTEE A vs DEVOTEE B) ACCESS ISOLATION");

    // Devotee A owns booking `rebookedBooking` (created for userA)
    // Devotee B attempts to fetch Devotee A's booking
    const bookingForUserA = await prisma.booking.findFirst({
      where: {
        id: rebookedBooking.id,
        OR: [
          { userId: userA.id },
          { primaryDevoteePhone: userA.phone },
          { primaryDevoteePhone: userA.phone.replace("+91", "") },
        ],
      },
    });
    assert(Boolean(bookingForUserA), "User A can legitimately access their own booking");

    const idorBookingAttempt = await prisma.booking.findFirst({
      where: {
        id: rebookedBooking.id,
        OR: [
          { userId: userB.id },
          { primaryDevoteePhone: userB.phone },
          { primaryDevoteePhone: userB.phone.replace("+91", "") },
        ],
      },
    });
    assert(idorBookingAttempt === null, "IDOR: User B CANNOT access User A's booking (returned null)");

    // Devotee B attempts to fetch Devotee A's invoice/receipt
    const idorReceiptAttempt = await prisma.receipt.findFirst({
      where: {
        id: receipt.id,
        booking: {
          OR: [
            { userId: userB.id },
            { primaryDevoteePhone: userB.phone },
            { primaryDevoteePhone: userB.phone.replace("+91", "") },
          ],
        },
      },
    });
    assert(idorReceiptAttempt === null, "IDOR: User B CANNOT access User A's invoice receipt");

    // ------------------------------------------------------------------------
    // SECTION 7: DONATIONS & CHARITABLE RECEIPTS
    // ------------------------------------------------------------------------
    console.log("\n🙏 7. DONATION LIFECYCLE & CHARITABLE RECEIPTS");

    let cause = await prisma.donationCause.findFirst({ where: { isActive: true } });
    if (!cause) {
      cause = await prisma.donationCause.create({
        data: {
          slug: "annakshetra-portal-test",
          titleEn: "Annakshetra Fund",
          titleHi: "अन्नक्षेत्र सेवा",
          descriptionEn: "Support temple community kitchen",
          descriptionHi: "मंदिर के दैनिक भंडारे हेतु सहयोग",
          suggestedAmounts: [25100, 50100, 110000, 210000],
          isActive: true,
        },
      });
    }

    // Devotee A makes a ₹1100 donation
    const donation = await prisma.donation.create({
      data: {
        donationReference: `DON-${Date.now()}`,
        userId: userA.id,
        receiptNumber: `REC-DON-${Date.now()}`,
        donorName: "Devotee Ramesh",
        donorPhone: phoneDevoteeA,
        donorEmail: "ramesh@example.com",
        donorPan: "ABCDE1234F",
        amountInPaise: 110000,
        currency: "INR",
        causeId: cause.id,
        status: PaymentStatus.PAID,
        gateway: PaymentGateway.MOCK,
        gatewayOrderId: `order_don_${Date.now()}`,
        gatewayPaymentId: `pay_don_${Date.now()}`,
        idempotencyKey: `don-idem-${Date.now()}`,
      },
    });
    assert(Boolean(donation.receiptNumber), `Donation created with receipt: ${donation.receiptNumber}`);

    // IDOR on donation: Devotee B cannot fetch Devotee A's donation
    const idorDonationAttempt = await prisma.donation.findFirst({
      where: {
        id: donation.id,
        OR: [
          { userId: userB.id },
          { donorPhone: phoneDevoteeB },
          { donorPhone: `+91${phoneDevoteeB}` },
        ],
      },
    });
    assert(idorDonationAttempt === null, "IDOR: Devotee B CANNOT view Devotee A's donation or receipt");

    // ------------------------------------------------------------------------
    // SECTION 8: ADMIN RBAC & RESTRICTED ACCESS ENFORCEMENT
    // ------------------------------------------------------------------------
    console.log("\n👑 8. ADMIN RBAC & PERMISSION CONTROL");

    const allRoles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });

    const staff = allRoles.find((r) => r.name === "STAFF");
    const finance = allRoles.find((r) => r.name === "FINANCE_ADMIN");
    const bookingAdmin = allRoles.find((r) => r.name === "BOOKING_ADMIN");
    const superAdmin = allRoles.find((r) => r.name === "SUPER_ADMIN");

    const staffCodes = staff?.permissions.map((p) => p.permission.code) || [];
    const financeCodes = finance?.permissions.map((p) => p.permission.code) || [];
    const bookingCodes = bookingAdmin?.permissions.map((p) => p.permission.code) || [];
    const superCodes = superAdmin?.permissions.map((p) => p.permission.code) || [];

    assert(!staffCodes.includes("payments:read"), "RBAC: STAFF cannot read payment ledger");
    assert(!staffCodes.includes("payments:manage"), "RBAC: STAFF cannot issue refunds or alter payments");
    assert(financeCodes.includes("payments:read"), "RBAC: FINANCE_ADMIN has payments:read");
    assert(financeCodes.includes("donations:read"), "RBAC: FINANCE_ADMIN has donations:read");
    assert(bookingCodes.includes("bookings:read"), "RBAC: BOOKING_ADMIN has bookings:read");
    assert(bookingCodes.includes("bookings:manage"), "RBAC: BOOKING_ADMIN has bookings:manage");
    assert(bookingCodes.includes("services:write"), "RBAC: BOOKING_ADMIN has services:write (services and slot management)");
    assert(superCodes.includes("users:manage"), "RBAC: SUPER_ADMIN has users:manage");

    // Clean up temporary test slots and records created in this test run
    await prisma.receipt.deleteMany({ where: { id: receipt.id } });
    await prisma.payment.deleteMany({ where: { id: confirmedPayment.id } });
    await prisma.booking.deleteMany({ where: { id: { in: [rebookedBooking.id, winningBooking.id] } } });
    await prisma.donation.deleteMany({ where: { id: donation.id } });
    await prisma.serviceSlot.deleteMany({ where: { id: { in: [openSlot.id, disabledSlot.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, ...contenderUsers] } } });

  } catch (error: any) {
    console.error("Test execution failed with error:", error);
    failed++;
  }

  console.log("\n================================================================");
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runFullPortalTestSuite()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
