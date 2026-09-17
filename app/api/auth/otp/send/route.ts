import { NextRequest, NextResponse } from "next/server";
import { requestDevoteeOtp } from "@/lib/auth/devotee";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/headers";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

const sendOtpSchema = z.object({
  phone: z.string().min(10, "मोबाइल नंबर कम से कम 10 अंकों का होना चाहिए").max(15),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit: 5 OTP requests per IP per 10 minutes
    const isAllowed = rateLimit(`otp_send:${ip}`, 5, 10 * 60);
    if (!isAllowed.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "अत्यधिक अनुरोध। कृपया 10 मिनट पश्चात पुनः प्रयास करें। (Too many OTP requests. Please try again later)",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "अमान्य इनपुट (Invalid input)" },
        { status: 400 }
      );
    }

    const result = await requestDevoteeOtp(parsed.data.phone, ip);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message, cooldownSeconds: result.cooldownSeconds },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      testOtp: result.testOtp, // Provided in development / test mode
    });
  } catch (error) {
    logger.error(`OTP send endpoint error: ${error}`);
    return NextResponse.json(
      { success: false, error: "OTP प्रेषित करने में तकनीकी त्रुटि। (Internal server error)" },
      { status: 500 }
    );
  }
}
