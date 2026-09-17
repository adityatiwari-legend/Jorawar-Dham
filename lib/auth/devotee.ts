import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger/logger";
import { User } from "@prisma/client";

export const DEVOTEE_SESSION_COOKIE = "jd_devotee_session";
export const DEVOTEE_SESSION_TTL_DAYS = 30;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

const OTP_PEPPER = process.env.OTP_SECRET_PEPPER || "jorawar_dham_sacred_otp_pepper_2026";

/**
 * Validates Indian standard mobile format: 10 digits starting with 6, 7, 8, 9
 */
export function validateIndianMobile(phone: string): { valid: boolean; formatted: string } {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, formatted: cleaned };
  }
  // If provided with country code e.g. 919876543210
  if (cleaned.length === 12 && cleaned.startsWith("91") && /^[6-9]\d{9}$/.test(cleaned.slice(2))) {
    return { valid: true, formatted: cleaned.slice(2) };
  }
  return { valid: false, formatted: "" };
}

/**
 * Hash OTP with salt and pepper
 * Plaintext OTP is NEVER stored in database
 */
export function hashOtp(otp: string, identifier: string): string {
  return crypto
    .createHmac("sha256", OTP_PEPPER)
    .update(`${identifier}:${otp}`)
    .digest("hex");
}

/**
 * Generate cryptographically random 6-digit numeric OTP
 */
export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash session token with SHA-256 for secure database lookup
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Request OTP for devotee login / verification
 */
export async function requestDevoteeOtp(
  phone: string,
  ipAddress?: string
): Promise<{ success: boolean; message: string; cooldownSeconds?: number; testOtp?: string }> {
  const { valid, formatted } = validateIndianMobile(phone);
  if (!valid) {
    return { success: false, message: "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (Invalid 10-digit Indian mobile number)" };
  }

  // Check recent OTP request for cooldown
  const recentOtp = await prisma.otpRequest.findFirst({
    where: {
      identifier: formatted,
      purpose: "DEVOTEE_LOGIN",
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const elapsedSeconds = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const remaining = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        message: `कृपया नया OTP अनुरोध करने से पूर्व ${remaining} सेकंड प्रतीक्षा करें। (Please wait ${remaining}s before resending)`,
        cooldownSeconds: remaining,
      };
    }

    // Invalidate previous active OTPs for this identifier
    await prisma.otpRequest.updateMany({
      where: {
        identifier: formatted,
        purpose: "DEVOTEE_LOGIN",
        isUsed: false,
      },
      data: { isUsed: true },
    });
  }

  const otp = generateNumericOtp();
  const hashedOtp = hashOtp(otp, formatted);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpRequest.create({
    data: {
      identifier: formatted,
      hashedOtp,
      purpose: "DEVOTEE_LOGIN",
      expiresAt,
      ipAddress,
    },
  });

  // Log safe operational event (NO plaintext OTP in logs)
  logger.info(`OTP requested for identifier [${formatted.slice(0, 2)}****${formatted.slice(-2)}] from IP [${ipAddress || "unknown"}]`);

  // In development / test mode without real SMS provider configured, return testOtp so automated tests and developers can proceed safely
  const isDevOrTest = process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_OTP === "true";

  return {
    success: true,
    message: "OTP आपके मोबाइल नंबर पर प्रेषित कर दिया गया है। (OTP sent successfully)",
    testOtp: isDevOrTest ? otp : undefined,
  };
}

/**
 * Verify OTP and create/retrieve devotee User with secure session
 */
export async function verifyDevoteeOtp(
  phone: string,
  otp: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; user?: User; sessionToken?: string; error?: string }> {
  const { valid, formatted } = validateIndianMobile(phone);
  if (!valid) {
    return { success: false, error: "अमान्य मोबाइल नंबर (Invalid mobile number)" };
  }

  const otpRecord = await prisma.otpRequest.findFirst({
    where: {
      identifier: formatted,
      purpose: "DEVOTEE_LOGIN",
      isUsed: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return { success: false, error: "सक्रिय OTP नहीं मिला। कृपया पुनः अनुरोध करें। (No active OTP found. Please request a new OTP)" };
  }

  if (otpRecord.expiresAt < new Date()) {
    await prisma.otpRequest.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    return { success: false, error: "OTP की समय-सीमा समाप्त हो चुकी है। (OTP expired. Please request a new one)" };
  }

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.otpRequest.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
    return { success: false, error: "अधिकतम प्रयास पूर्ण। सुरक्षा कारणों से यह OTP रद्द कर दिया गया है। (Maximum attempts exceeded)" };
  }

  // Verify hash
  const expectedHash = hashOtp(otp, formatted);
  if (crypto.timingSafeEqual(Buffer.from(otpRecord.hashedOtp), Buffer.from(expectedHash)) === false) {
    // Increment attempts
    await prisma.otpRequest.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });
    return {
      success: false,
      error: `गलत OTP प्रविष्ट किया गया। शेष प्रयास: ${OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1)} (Invalid OTP)`,
    };
  }

  // Mark OTP as used
  await prisma.otpRequest.update({
    where: { id: otpRecord.id },
    data: { isUsed: true, verifiedAt: new Date() },
  });

  // Find or create User
  const user = await prisma.user.upsert({
    where: { phone: formatted },
    update: {
      isPhoneVerified: true,
      status: "ACTIVE",
    },
    create: {
      phone: formatted,
      isPhoneVerified: true,
      status: "ACTIVE",
    },
  });

  // Create secure session token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const sessionTokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + DEVOTEE_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.userSession.create({
    data: {
      userId: user.id,
      sessionTokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  logger.info(`Devotee authenticated successfully [${user.id}]`);

  return { success: true, user, sessionToken: rawToken };
}

/**
 * Retrieve authenticated devotee from session token
 */
export async function getDevoteeFromSession(token: string): Promise<User | null> {
  if (!token) return null;

  const sessionTokenHash = hashSessionToken(token);
  const session = await prisma.userSession.findUnique({
    where: { sessionTokenHash },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (session.user.status !== "ACTIVE") {
    return null;
  }

  // Update last active time (sliding window)
  const now = new Date();
  if (now.getTime() - session.lastActiveAt.getTime() > 1000 * 60 * 60) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActiveAt: now },
    }).catch(() => {});
  }

  return session.user;
}

/**
 * Helper to get devotee from Next.js request cookies
 */
export async function getAuthenticatedDevotee(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(DEVOTEE_SESSION_COOKIE)?.value;
    if (!token) return null;
    return await getDevoteeFromSession(token);
  } catch {
    return null;
  }
}

/**
 * Terminate devotee session
 */
export async function invalidateDevoteeSession(token: string): Promise<void> {
  if (!token) return;
  const sessionTokenHash = hashSessionToken(token);
  await prisma.userSession.deleteMany({
    where: { sessionTokenHash },
  });
}
