import crypto from "crypto";
import { OtpPurpose } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import logger from "@/lib/logger";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const OTP_SECRET = process.env.SESSION_SECRET || "fallback_otp_secret_for_local_env_only_12345678";

function hashOtp(identifier: string, otp: string): string {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${identifier}:${otp}`)
    .digest("hex");
}

export function generateNumericOtp(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
}

export async function createOtpRequest(
  identifier: string,
  purpose: OtpPurpose,
  ipAddress?: string
): Promise<{ rawOtpForSms: string; expiresAt: Date }> {
  // Invalidate any existing unused OTPs for this identifier and purpose
  await prisma.otpRequest.updateMany({
    where: {
      identifier,
      purpose,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  const rawOtp = generateNumericOtp(6);
  const hashedOtp = hashOtp(identifier, rawOtp);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpRequest.create({
    data: {
      identifier,
      hashedOtp,
      purpose,
      expiresAt,
      ipAddress,
    },
  });

  logger.info(`OTP generated for ${identifier.replace(/(.{3}).*(.{3})/, "$1****$2")} [purpose: ${purpose}]`);

  // Return raw OTP strictly for sending to external SMS/Email gateway (never stored in DB or logged)
  return { rawOtpForSms: rawOtp, expiresAt };
}

export async function verifyOtpRequest(
  identifier: string,
  purpose: OtpPurpose,
  candidateOtp: string
): Promise<{ success: boolean; error?: string }> {
  const record = await prisma.otpRequest.findFirst({
    where: {
      identifier,
      purpose,
      isUsed: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { success: false, error: "No active verification code found." };
  }

  if (new Date() > record.expiresAt) {
    await prisma.otpRequest.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
    return { success: false, error: "Verification code has expired. Please request a new one." };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.otpRequest.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
    return { success: false, error: "Too many failed attempts. This code is invalidated." };
  }

  const candidateHash = hashOtp(identifier, candidateOtp);

  // Constant-time comparison to prevent timing attacks
  const recordHashBuffer = Buffer.from(record.hashedOtp, "hex");
  const candidateHashBuffer = Buffer.from(candidateHash, "hex");

  const isMatch =
    recordHashBuffer.length === candidateHashBuffer.length &&
    crypto.timingSafeEqual(recordHashBuffer, candidateHashBuffer);

  if (!isMatch) {
    await prisma.otpRequest.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Invalid verification code." };
  }

  // Mark as successfully verified and used
  await prisma.otpRequest.update({
    where: { id: record.id },
    data: {
      isUsed: true,
      verifiedAt: new Date(),
    },
  });

  return { success: true };
}
