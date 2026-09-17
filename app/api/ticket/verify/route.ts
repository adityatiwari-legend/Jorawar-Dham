import { NextRequest, NextResponse } from "next/server";
import { verifyTicketQr } from "@/lib/ticket/qr";
import { rateLimiter } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rl = await rateLimiter.limit(`ticket-verify:${ip}`, 30, 60);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "कृपया थोड़ी देर बाद पुनः प्रयास करें" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref")?.trim();
    const token = searchParams.get("token")?.trim();

    if (!ref || !token) {
      return NextResponse.json({ success: false, error: "अमान्य संदर्भ या सुरक्षा टोकन" }, { status: 400 });
    }

    const result = await verifyTicketQr(ref, token);

    if (!result.booking) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: result.message,
        status: result.status,
      }, { status: 400 });
    }

    // Mask name for privacy when viewed publicly (e.g., "R**** S****")
    const maskedName = result.booking.primaryDevoteeName
      .split(" ")
      .map((part) => (part.length > 2 ? `${part[0]}***${part[part.length - 1]}` : part))
      .join(" ");

    return NextResponse.json({
      success: true,
      valid: result.valid,
      status: result.status,
      message: result.message,
      ticket: {
        bookingReference: result.booking.bookingReference,
        devoteeNameMasked: maskedName,
        serviceTitleHi: result.booking.serviceNameHi,
        serviceTitleEn: result.booking.serviceNameEn,
        slotTime: result.booking.slotTime,
        bookingDate: result.booking.bookingDate,
        numberOfDevotees: result.booking.numberOfDevotees,
        checkedInAt: result.booking.checkedInAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "सत्यापन में त्रुटि" }, { status: 500 });
  }
}
