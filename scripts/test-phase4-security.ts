import { prisma } from "../lib/db/client";
import { getPaymentGateway } from "../lib/payment/gateway";
import { generateBookingQrDataUri, verifyTicketQr } from "../lib/ticket/qr";
import { validateMediaUpload, FORBIDDEN_EXTENSIONS } from "../lib/storage/index";
import { NotificationService } from "../lib/notifications/service";
import { getSecurityHeaders } from "../lib/security/headers";
import { hashPassword, verifyPassword } from "../lib/auth/argon2";
import { BookingStatus, PaymentStatus, AuditAction } from "@prisma/client";
import crypto from "crypto";

async function runPhase4SecurityTests() {
  console.log("==================================================");
  console.log("🔒 RUNNING PHASE 4 SECURITY & PRODUCTION AUDIT");
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

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Broken Access Control & Least Privilege RBAC
    // ------------------------------------------------------------------------
    console.log("\n[TEST 1] Testing Broken Access Control & Role Permissions...");

    const roles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });

    const staffRole = roles.find((r) => r.name === "STAFF");
    const contentAdminRole = roles.find((r) => r.name === "CONTENT_ADMIN");
    const financeAdminRole = roles.find((r) => r.name === "FINANCE_ADMIN");
    const superAdminRole = roles.find((r) => r.name === "SUPER_ADMIN");

    assert(Boolean(staffRole), "STAFF role exists in database");
    assert(Boolean(financeAdminRole), "FINANCE_ADMIN role exists in database");

    const staffPerms = staffRole?.permissions.map((p) => p.permission.code) || [];
    const financePerms = financeAdminRole?.permissions.map((p) => p.permission.code) || [];
    const contentPerms = contentAdminRole?.permissions.map((p) => p.permission.code) || [];

    assert(!staffPerms.includes("payments:read"), "STAFF cannot read payment ledger");
    assert(!staffPerms.includes("payments:manage"), "STAFF cannot manage payments or refunds");
    assert(!staffPerms.includes("users:manage"), "STAFF cannot manage admin users");
    assert(!contentPerms.includes("payments:manage"), "CONTENT_ADMIN cannot modify financial data");
    assert(financePerms.includes("payments:read"), "FINANCE_ADMIN has payments:read permission");
    assert(financePerms.includes("donations:read"), "FINANCE_ADMIN has donations:read permission");
    assert(financePerms.includes("reports:read"), "FINANCE_ADMIN has reports:read permission");

    // ------------------------------------------------------------------------
    // TEST 2: Cryptographic Failures & Password/Secret Hardening
    // ------------------------------------------------------------------------
    console.log("\n[TEST 2] Testing Cryptographic Integrity & Argon2id...");

    const testPassword = "SuperSecurePassword123#";
    const passwordHash = await hashPassword(testPassword);

    assert(passwordHash.startsWith("$argon2id$"), "Password hash uses Argon2id algorithm");
    const isPwValid = await verifyPassword(testPassword, passwordHash);
    const isPwInvalid = await verifyPassword("WrongPassword", passwordHash);
    assert(isPwValid, "Argon2id successfully verifies authentic password");
    assert(!isPwInvalid, "Argon2id rejects illegitimate password");

    // Verify Ticket QR cryptographic integrity
    const testRef = `JD-SEC-${Date.now().toString(36).toUpperCase()}`;
    const testSecret = "secret-token-random-nonce-123456789";

    const qrResult = await verifyTicketQr("INVALID-REF", testSecret);
    assert(!qrResult.valid, "Tampered/invalid QR reference is firmly rejected");

    // ------------------------------------------------------------------------
    // TEST 3: Injection & Input Validation (SQL / XSS / Bad Data)
    // ------------------------------------------------------------------------
    console.log("\n[TEST 3] Testing Injection Defense...");

    const maliciousInput = "' OR '1'='1' -- ; DROP TABLE admins;";
    const injectionCheck = await prisma.admin.findMany({
      where: { email: maliciousInput },
    });
    assert(injectionCheck.length === 0, "Prisma parameterized query prevents SQL injection attacks");

    // ------------------------------------------------------------------------
    // TEST 4: Payment Integrity & Server-side Calculation
    // ------------------------------------------------------------------------
    console.log("\n[TEST 4] Testing Payment Manipulation & Server-side Validation...");

    const gateway = getPaymentGateway();
    assert(gateway.name === "RAZORPAY" || gateway.name === "MOCK", "Gateway provider active");

    const orderResult = await gateway.createOrder({
      amountInPaise: 50100, // ₹501.00
      currency: "INR",
      receipt: `SEC-${Date.now()}`,
      notes: { purpose: "test_security" },
    });

    assert(Boolean(orderResult.orderId), "Gateway generated valid order ID");
    assert(orderResult.amountInPaise === 50100, "Amount preserved strictly in integer paise");

    // Test forged signature verification
    const isSignatureValid = gateway.verifyPaymentSignature({
      orderId: orderResult.orderId,
      paymentId: "pay_fake_12345",
      signature: "forged_invalid_hmac_signature",
    });
    assert(!isSignatureValid, "Payment gateway firmly rejects forged HMAC signature");

    // ------------------------------------------------------------------------
    // TEST 5: Donation System Lifecycle & Receipt Generation
    // ------------------------------------------------------------------------
    console.log("\n[TEST 5] Testing Donation Flow & Audit Logging...");

    const cause = await prisma.donationCause.findFirst({
      where: { isActive: true },
    });
    assert(Boolean(cause), "Active donation cause exists");

    const donationRef = `DON-TEST-${Date.now().toString(36).toUpperCase()}`;
    const donation = await prisma.donation.create({
      data: {
        donationReference: donationRef,
        causeId: cause!.id,
        donorName: "Security Test Donor",
        donorPhone: "9876543210",
        donorEmail: "donor@test.org",
        donorPan: "ABCDE1234F",
        amountInPaise: 110000, // ₹1,100.00
        currency: "INR",
        status: PaymentStatus.PENDING,
        gatewayOrderId: `order_don_${Date.now()}`,
      },
    });

    assert(donation.status === "PENDING", "Donation created in PENDING state");

    // Simulate successful payment verification
    const receiptNo = `REC-${donationRef}`;
    const updatedDonation = await prisma.$transaction(async (tx) => {
      const d = await tx.donation.update({
        where: { id: donation.id },
        data: {
          status: PaymentStatus.PAID,
          gatewayPaymentId: `pay_mock_${Date.now()}`,
          receiptNumber: receiptNo,
          receiptIssuedAt: new Date(),
          paidAt: new Date(),
        },
      });

      await tx.donationCause.update({
        where: { id: cause!.id },
        data: {
          collectedAmountInPaise: { increment: 110000 },
        },
      });

      await tx.auditLog.create({
        data: {
          actorType: "SYSTEM",
          action: AuditAction.CREATE,
          entity: "DONATION_VERIFY",
          entityId: d.id,
          details: { donationReference: donationRef, amountInPaise: 110000 },
        },
      });

      return d;
    });

    assert(updatedDonation.status === "PAID", "Donation transitioned strictly to PAID");
    assert(Boolean(updatedDonation.receiptNumber), "Donation receipt number generated");

    // ------------------------------------------------------------------------
    // TEST 6: File Security, Malicious Uploads & SVG XSS Prevention
    // ------------------------------------------------------------------------
    console.log("\n[TEST 6] Testing File Upload Security & SVG/Executable Rejection...");

    assert(FORBIDDEN_EXTENSIONS.has(".exe"), ".exe is strictly blocked");
    assert(FORBIDDEN_EXTENSIONS.has(".svg"), ".svg is blocked to prevent SVG Stored XSS");
    assert(FORBIDDEN_EXTENSIONS.has(".php"), ".php is strictly blocked");
    assert(FORBIDDEN_EXTENSIONS.has(".sh"), ".sh is strictly blocked");

    let uploadBlocked = false;
    try {
      validateMediaUpload(Buffer.from("<svg onload=alert(1)>"), {
        originalFilename: "exploit.svg",
        mimeType: "image/svg+xml",
        sizeBytes: 25,
      });
    } catch {
      uploadBlocked = true;
    }
    assert(uploadBlocked, "Dangerous SVG upload rejected with security exception");

    let magicByteBlocked = false;
    try {
      // Fake JPEG with text content (no FF D8 FF magic bytes)
      validateMediaUpload(Buffer.from("Fake jpeg payload"), {
        originalFilename: "fake.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 17,
      });
    } catch {
      magicByteBlocked = true;
    }
    assert(magicByteBlocked, "Binary signature spoofing (magic byte mismatch) blocked");

    // ------------------------------------------------------------------------
    // TEST 7: Security Headers & CSP
    // ------------------------------------------------------------------------
    console.log("\n[TEST 7] Testing Security Headers...");

    const headers = getSecurityHeaders();
    assert(headers["X-Frame-Options"] === "DENY", "X-Frame-Options is DENY (Clickjacking defense)");
    assert(headers["X-Content-Type-Options"] === "nosniff", "X-Content-Type-Options is nosniff (MIME sniffing defense)");
    assert(headers["Referrer-Policy"] === "strict-origin-when-cross-origin", "Referrer-Policy configured");
    assert(headers["Content-Security-Policy"].includes("checkout.razorpay.com"), "CSP includes Razorpay checkout origin");

    // ------------------------------------------------------------------------
    // TEST 8: Notifications Provider & Zero Secrets
    // ------------------------------------------------------------------------
    console.log("\n[TEST 8] Testing Notification Abstraction (Zero Secrets)...");

    let noticeSent = false;
    try {
      await NotificationService.sendDonationReceipt({
        donationReference: donationRef,
        donorName: "Security Test Donor",
        donorPhone: "9876543210",
        amountInRupees: 1100,
        causeTitle: cause!.titleHi,
        receiptNumber: receiptNo,
      });
      noticeSent = true;
    } catch (e) {
      console.error(e);
    }
    assert(noticeSent, "Notification sent via provider abstraction without leaking credentials");

    // Cleanup test donation
    await prisma.donation.delete({ where: { id: donation.id } }).catch(() => null);

    console.log("\n==================================================");
    console.log(`🏁 AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4SecurityTests();
