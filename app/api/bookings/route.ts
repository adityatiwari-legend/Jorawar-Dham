import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { createConcurrencySafeBooking } from "@/lib/booking/service";
import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

const createBookingSchema = z.object({
  serviceId: z.string().uuid("अमान्य सेवा पहचानकर्ता"),
  slotId: z.string().uuid("अमान्य स्लॉट पहचानकर्ता"),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "दिनांक प्रारूप YYYY-MM-DD होना चाहिए"),
  numberOfDevotees: z.number().int().min(1).max(20),
  primaryDevoteeName: z.string().min(2, "नाम कम से कम 2 अक्षरों का होना चाहिए").max(150),
  primaryDevoteePhone: z.string().min(10).max(15),
  devoteeDetails: z.array(z.object({ name: z.string(), age: z.number().optional(), gender: z.string().optional() })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "कृपया बुकिंग हेतु लॉगिन करें (Login required)" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "अमान्य विवरण" },
        { status: 400 }
      );
    }

    const booking = await createConcurrencySafeBooking({
      userId: devotee.id,
      serviceId: parsed.data.serviceId,
      slotId: parsed.data.slotId,
      bookingDate: parsed.data.bookingDate,
      numberOfDevotees: parsed.data.numberOfDevotees,
      primaryDevoteeName: parsed.data.primaryDevoteeName,
      primaryDevoteePhone: parsed.data.primaryDevoteePhone,
      devoteeDetails: parsed.data.devoteeDetails,
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.bookingStatus,
        totalAmountInPaise: booking.totalAmountInPaise,
        numberOfDevotees: booking.numberOfDevotees,
        expiresAt: booking.expiresAt,
      },
    });
  } catch (error: any) {
    logger.warn(`Booking creation failed: ${error.message}`);
    return NextResponse.json(
      { success: false, error: error.message || "बुकिंग प्रक्रिया में त्रुटि" },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "लॉगिन आवश्यक है" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: devotee.id },
      include: {
        service: {
          select: {
            titleHi: true,
            titleEn: true,
            slug: true,
            imageUrl: true,
          },
        },
        slot: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
        receipt: {
          select: {
            receiptNumber: true,
            issuedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingReference: b.bookingReference,
        serviceTitleHi: b.service.titleHi,
        serviceTitleEn: b.service.titleEn,
        slotTime: `${b.slot.startTime} - ${b.slot.endTime}`,
        bookingDate: b.bookingDate.toISOString().split("T")[0],
        numberOfDevotees: b.numberOfDevotees,
        totalAmountInPaise: b.totalAmountInPaise,
        status: b.bookingStatus,
        qrSecurityToken: b.qrSecurityToken,
        hasReceipt: Boolean(b.receipt),
        receiptNumber: b.receipt?.receiptNumber,
        createdAt: b.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: "बुकिंग सूची प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}
