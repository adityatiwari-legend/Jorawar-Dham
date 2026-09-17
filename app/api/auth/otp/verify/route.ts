import { NextRequest, NextResponse } from "next/server";
import { verifyDevoteeOtp, DEVOTEE_SESSION_COOKIE, DEVOTEE_SESSION_TTL_DAYS } from "@/lib/auth/devotee";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/headers";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6, "OTP 6 अंकों का होना चाहिए (OTP must be 6 digits)"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || undefined;

    // Rate limit: 10 verification attempts per IP per 10 minutes
    const isAllowed = rateLimit(`otp_verify:${ip}`, 10, 10 * 60);
    if (!isAllowed.allowed) {
      return NextResponse.json(
        { success: false, error: "अत्यधिक सत्यापन प्रयास। कृपया थोड़ी देर प्रतीक्षा करें।" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "अमान्य इनपुट" },
        { status: 400 }
      );
    }

    const result = await verifyDevoteeOtp(parsed.data.phone, parsed.data.otp, ip, userAgent);
    if (!result.success || !result.user || !result.sessionToken) {
      return NextResponse.json({ success: false, error: result.error || "सत्यापन विफल" }, { status: 400 });
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        phone: result.user.phone,
        fullName: result.user.fullName,
        city: result.user.city,
        state: result.user.state,
      },
    });

    // Set secure HTTP-only cookie
    res.cookies.set({
      name: DEVOTEE_SESSION_COOKIE,
      value: result.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DEVOTEE_SESSION_TTL_DAYS * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    logger.error(`OTP verify endpoint error: ${error}`);
    return NextResponse.json(
      { success: false, error: "सत्यापन प्रक्रिया में त्रुटि" },
      { status: 500 }
    );
  }
}
