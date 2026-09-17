import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { verifyTicketQr } from "@/lib/ticket/qr";
import { BookingStatus, AuditAction } from "@prisma/client";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

const checkInSchema = z.object({
  bookingReference: z.string().min(5),
  qrSecurityToken: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "अमान्य क्यूआर डेटा" }, { status: 400 });
    }

    const { bookingReference, qrSecurityToken } = parsed.data;

    // Verify QR validity and prevent double check-in
    const verification = await verifyTicketQr(bookingReference, qrSecurityToken);

    if (!verification.valid || !verification.booking) {
      return NextResponse.json(
        {
          success: false,
          error: verification.message,
          status: verification.status,
          booking: verification.booking,
        },
        { status: 400 }
      );
    }

    // Execute check-in
    const now = new Date();
    await prisma.booking.update({
      where: { id: verification.booking.id },
      data: {
        bookingStatus: BookingStatus.CHECKED_IN,
        checkedInAt: now,
        checkedInByAdminId: admin.id,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorType: "ADMIN",
        actorId: admin.id,
        actorEmail: admin.email,
        action: AuditAction.UPDATE,
        entity: "BOOKING_CHECK_IN",
        entityId: verification.booking.id,
        details: {
          bookingReference,
          devoteeCount: verification.booking.numberOfDevotees,
          checkedInAt: now.toISOString(),
        },
      },
    });

    logger.info(`Devotee checked in [${bookingReference}] by staff [${admin.email}]`);

    return NextResponse.json({
      success: true,
      message: "प्रवेश सत्यापित (Entry Approved & Checked-in)",
      booking: {
        ...verification.booking,
        checkedInAt: now,
        status: BookingStatus.CHECKED_IN,
      },
    });
  } catch (error: any) {
    logger.error("Check-in error:", error);
    return NextResponse.json({ success: false, error: "सत्यापन प्रक्रिया में त्रुटि" }, { status: 500 });
  }
}
