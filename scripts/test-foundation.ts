import { prisma } from "../lib/db/client";
import { hashPassword, verifyPassword } from "../lib/auth/argon2";
import { storage } from "../lib/storage/local";
import { checkRateLimit } from "../lib/security/rate-limit";
import { sanitizeError, AppError } from "../lib/utils/errors";
import { getDictionary, localize, formatLocalizedDate } from "../lib/utils/i18n";
import { ZodError } from "zod";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING JORAWAR DHAM FOUNDATION VERIFICATION");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Database Connection & Seed Validation
  try {
    const adminCount = await prisma.admin.count();
    const roleCount = await prisma.role.count();
    const serviceCount = await prisma.service.count();
    const noticeCount = await prisma.notice.count();
    const eventCount = await prisma.event.count();

    assert(adminCount >= 1, `PostgreSQL contains seeded admin (found: ${adminCount})`);
    assert(roleCount === 6, `PostgreSQL contains 6 discrete RBAC roles (found: ${roleCount})`);
    assert(serviceCount >= 5, `PostgreSQL contains darshan/aarti services (found: ${serviceCount})`);
    assert(noticeCount >= 1, `PostgreSQL contains initial notices (found: ${noticeCount})`);
    assert(eventCount >= 1, `PostgreSQL contains initial festival events (found: ${eventCount})`);
  } catch (err) {
    assert(false, `Database query failed: ${err}`);
  }

  // TEST 2: Argon2id Cryptographic Verification
  try {
    const testPassword = "DhamDevotion2026@Rajasthan#Sec";
    const hashed = await hashPassword(testPassword);
    assert(hashed.startsWith("$argon2id$"), "Argon2id produces valid RFC 9106 formatted hash");

    const match = await verifyPassword(testPassword, hashed);
    assert(match === true, "Argon2id verifies valid password correctly");

    const mismatch = await verifyPassword("WrongPassword123!", hashed);
    assert(mismatch === false, "Argon2id rejects invalid candidate password");
  } catch (err) {
    assert(false, `Argon2id test failed: ${err}`);
  }

  // TEST 3: StorageService - Magic Bytes & Whitelist Security
  try {
    // A. Valid PNG Buffer with real magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
    ]);

    const uploadRes = await storage.upload(validPngBuffer, {
      originalFilename: "sanctum-deity.png",
      mimeType: "image/png",
      sizeBytes: validPngBuffer.length,
    });

    assert(uploadRes.fileKey.endsWith(".png"), "Storage saves file with safe extension");
    assert(uploadRes.fileKey !== "sanctum-deity.png", "Storage discards client filename and randomizes key with UUID");
    assert(uploadRes.fileUrl.startsWith("/api/media/"), "Storage provides safe proxied URL");

    // Clean up valid test file
    await storage.delete(uploadRes.fileKey);

    // B. Rejection of forbidden executable
    let executableBlocked = false;
    try {
      await storage.upload(Buffer.from("malicious shell script"), {
        originalFilename: "exploit.sh",
        mimeType: "application/x-sh",
        sizeBytes: 20,
      });
    } catch {
      executableBlocked = true;
    }
    assert(executableBlocked, "StorageService rejects executable extensions (.sh, .exe, .php)");

    // C. Rejection of spoofed extension (JPEG extension on arbitrary text buffer)
    let spoofBlocked = false;
    try {
      await storage.upload(Buffer.from("fake image content without jpeg headers"), {
        originalFilename: "fake.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 40,
      });
    } catch {
      spoofBlocked = true;
    }
    assert(spoofBlocked, "StorageService rejects binary signature mismatch (spoofed magic bytes)");
  } catch (err) {
    assert(false, `StorageService test failed: ${err}`);
  }

  // TEST 4: Rate Limiter Sliding Window Logic
  try {
    const testKey = "test_client_rate_ip_1";
    let allowedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 7; i++) {
      const res = checkRateLimit(testKey, { windowMs: 10000, maxRequests: 5 });
      if (res.allowed) allowedCount++;
      else blockedCount++;
    }

    assert(allowedCount === 5, "Rate limiter permits requests within threshold (5 requests)");
    assert(blockedCount === 2, "Rate limiter blocks requests exceeding threshold");
  } catch (err) {
    assert(false, `Rate limiter test failed: ${err}`);
  }

  // TEST 5: Information Disclosure & Error Sanitization
  try {
    // Simulated internal database error with confidential connection string
    const sensitiveDbError = new Error("FATAL: connection to postgresql://postgres:SecretPass@127.0.0.1:5432 failed");
    const sanitized = sanitizeError(sensitiveDbError, "test_context");

    assert(sanitized.status === 500, "Internal error maps to status 500");
    assert(!sanitized.response.error.includes("SecretPass"), "Sanitized error does NOT leak internal password");
    assert(!sanitized.response.error.includes("postgresql://"), "Sanitized error does NOT leak database protocol or host");
    assert(sanitized.response.code === "INTERNAL_SERVER_ERROR", "Sanitized error provides generic safe error code");
  } catch (err) {
    assert(false, `Error sanitization test failed: ${err}`);
  }

  // TEST 6: Multilingual System & Typography
  try {
    const hiDict = getDictionary("hi");
    const enDict = getDictionary("en");

    assert(hiDict.site.name === "श्री जोरावर धाम", "Hindi dictionary returns Devanagari site title");
    assert(enDict.site.name === "Shri Jorawar Dham", "English dictionary returns Latin site title");

    // Dynamic field localizer with fallback
    const mockNotice = {
      titleHi: "वार्षिक मेला",
      titleEn: "Annual Mela",
      bodyHi: "विस्तृत विवरण",
      bodyEn: "", // Empty English body should fallback to Hindi or vice versa
    };

    const hiTitle = localize(mockNotice, "hi", "title");
    const enTitle = localize(mockNotice, "en", "title");
    const fallbackBody = localize(mockNotice, "en", "body");

    assert(hiTitle === "वार्षिक मेला", "Localizer resolves Hindi field correctly");
    assert(enTitle === "Annual Mela", "Localizer resolves English field correctly");
    assert(fallbackBody === "विस्तृत विवरण", "Localizer provides graceful fallback when target locale field is empty");

    const formattedDate = formatLocalizedDate(new Date(2026, 8, 17), "hi");
    assert(formattedDate.length > 5, `Hindi localized date formatted correctly: ${formattedDate}`);
  } catch (err) {
    assert(false, `Multilingual test failed: ${err}`);
  }

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
