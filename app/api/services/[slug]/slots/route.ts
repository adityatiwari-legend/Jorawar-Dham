import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { BookingStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date"); // e.g. "2026-09-20"

    const service = await prisma.service.findUnique({
      where: { slug, isActive: true },
      include: {
        slots: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ success: false, error: "सेवा उपलब्ध नहीं है" }, { status: 404 });
    }

    if (!dateQuery) {
      // Return slots without date-specific availability counts
      return NextResponse.json({
        success: true,
        service: {
          id: service.id,
          slug: service.slug,
          titleHi: service.titleHi,
          titleEn: service.titleEn,
          price: service.price,
          slots: service.slots,
        },
      });
    }

    // Check blocked date
    const parsedDate = new Date(dateQuery);
    const normalizedDate = new Date(
      Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate())
    );

    const isBlocked = await prisma.blockedDate.findFirst({
      where: {
        date: normalizedDate,
        OR: [{ serviceId: null }, { serviceId: service.id }],
      },
    });

    if (isBlocked) {
      return NextResponse.json({
        success: true,
        service: {
          id: service.id,
          slug: service.slug,
          titleHi: service.titleHi,
          titleEn: service.titleEn,
          isBlocked: true,
          blockedReasonHi: isBlocked.reasonHi,
          blockedReasonEn: isBlocked.reasonEn,
          slots: [],
        },
      });
    }

    // Calculate live capacity for each slot on this date
    const slotsWithCapacity = await Promise.all(
      service.slots.map(async (slot) => {
        const activeBookings = await prisma.booking.aggregate({
          _sum: { numberOfDevotees: true },
          where: {
            slotId: slot.id,
            bookingDate: normalizedDate,
            OR: [
              {
                bookingStatus: {
                  in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PAYMENT_PROCESSING],
                },
              },
              {
                bookingStatus: BookingStatus.PENDING_PAYMENT,
                expiresAt: { gt: new Date() },
              },
            ],
          },
        });

        const allocatedSeats = activeBookings._sum.numberOfDevotees || 0;
        const availableSeats = Math.max(0, slot.capacity - allocatedSeats);

        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          allocatedSeats,
          availableSeats,
          priceInPaise: slot.priceInPaise,
          isAvailable: availableSeats > 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        slug: service.slug,
        titleHi: service.titleHi,
        titleEn: service.titleEn,
        date: dateQuery,
        isBlocked: false,
        slots: slotsWithCapacity,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "स्लॉट जानकारी प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}
