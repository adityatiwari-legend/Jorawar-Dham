import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { prisma } from "@/lib/db/client";
import { generateBookingQrDataUri } from "@/lib/ticket/qr";
import { BookingStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "लॉगिन आवश्यक है" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        slot: true,
        receipt: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "बुकिंग उपलब्ध नहीं है" }, { status: 404 });
    }

    // IDOR Guard: Only the booking owner can inspect their booking
    if (booking.userId !== devotee.id) {
      return NextResponse.json({ success: false, error: "अनधिकृत अनुरोध (Unauthorized access)" }, { status: 403 });
    }

    // If confirmed or checked-in, generate QR code data URI
    let qrDataUri: string | null = null;
    if (booking.bookingStatus === BookingStatus.CONFIRMED || booking.bookingStatus === BookingStatus.CHECKED_IN) {
      qrDataUri = await generateBookingQrDataUri(booking.bookingReference, booking.qrSecurityToken);
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        serviceTitleHi: booking.service.titleHi,
        serviceTitleEn: booking.service.titleEn,
        slotTime: `${booking.slot.startTime} - ${booking.slot.endTime}`,
        bookingDate: booking.bookingDate.toISOString().split("T")[0],
        numberOfDevotees: booking.numberOfDevotees,
        primaryDevoteeName: booking.primaryDevoteeName,
        primaryDevoteePhone: booking.primaryDevoteePhone,
        totalAmountInPaise: booking.totalAmountInPaise,
        status: booking.bookingStatus,
        expiresAt: booking.expiresAt,
        qrDataUri,
        receipt: booking.receipt
          ? {
              receiptNumber: booking.receipt.receiptNumber,
              amountInPaise: booking.receipt.amountInPaise,
              issuedAt: booking.receipt.issuedAt,
            }
          : null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "त्रुटि उत्पन्न हुई" }, { status: 500 });
  }
}
