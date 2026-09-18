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

    // Number of days to calculate (default 30 days, max 60)
    const daysParam = parseInt(searchParams.get("days") || "30", 10);
    const daysCount = Math.min(Math.max(daysParam, 7), 60);

    const service = await prisma.service.findUnique({
      where: { slug, isActive: true },
      include: {
        slots: {
          where: { isActive: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ success: false, error: "सेवा उपलब्ध नहीं है (Service not found)" }, { status: 404 });
    }

    const totalSlotCapacityPerDay = service.slots.reduce((sum, s) => sum + s.capacity, 0);

    // Compute range from today UTC
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const endDateUtc = new Date(todayUtc.getTime() + daysCount * 24 * 60 * 60 * 1000);

    // Fetch blocked dates in this range
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        date: {
          gte: todayUtc,
          lte: endDateUtc,
        },
        OR: [{ serviceId: null }, { serviceId: service.id }],
      },
    });
    const blockedDateMap = new Map<string, string>();
    for (const b of blockedDates) {
      const dateKey = b.date.toISOString().split("T")[0];
      blockedDateMap.set(dateKey, b.reasonHi || b.reasonEn || "अवरुद्ध (Closed)");
    }

    // Fetch active bookings in this range
    const activeBookings = await prisma.booking.groupBy({
      by: ["bookingDate"],
      where: {
        serviceId: service.id,
        bookingDate: {
          gte: todayUtc,
          lte: endDateUtc,
        },
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
      _sum: {
        numberOfDevotees: true,
      },
    });

    const bookedCountMap = new Map<string, number>();
    for (const b of activeBookings) {
      const dateKey = b.bookingDate.toISOString().split("T")[0];
      bookedCountMap.set(dateKey, b._sum.numberOfDevotees || 0);
    }

    // Generate date array
    const availabilityList = [];
    for (let i = 0; i < daysCount; i++) {
      const curDate = new Date(todayUtc.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = curDate.toISOString().split("T")[0];

      // Day of week & month metadata
      const dayOfWeek = curDate.getUTCDay(); // 0 = Sun, 1 = Mon...
      const isPast = curDate < todayUtc;

      if (isPast) {
        availabilityList.push({
          date: dateStr,
          dayOfWeek,
          status: "PAST",
          remainingSeats: 0,
          totalCapacity: totalSlotCapacityPerDay,
          reason: "भूतकाल (Past date)",
        });
        continue;
      }

      if (blockedDateMap.has(dateStr)) {
        availabilityList.push({
          date: dateStr,
          dayOfWeek,
          status: "CLOSED",
          remainingSeats: 0,
          totalCapacity: totalSlotCapacityPerDay,
          reason: blockedDateMap.get(dateStr),
        });
        continue;
      }

      if (totalSlotCapacityPerDay === 0 || service.slots.length === 0) {
        availabilityList.push({
          date: dateStr,
          dayOfWeek,
          status: "CLOSED",
          remainingSeats: 0,
          totalCapacity: 0,
          reason: "कोई स्लॉट सक्रिय नहीं है (No active slots)",
        });
        continue;
      }

      const bookedCount = bookedCountMap.get(dateStr) || 0;
      const remainingSeats = Math.max(0, totalSlotCapacityPerDay - bookedCount);

      let status: "AVAILABLE" | "LIMITED" | "FULL" | "CLOSED" = "AVAILABLE";
      if (remainingSeats <= 0) {
        status = "FULL";
      } else if (remainingSeats <= Math.ceil(totalSlotCapacityPerDay * 0.25)) {
        status = "LIMITED";
      }

      availabilityList.push({
        date: dateStr,
        dayOfWeek,
        status,
        remainingSeats,
        totalCapacity: totalSlotCapacityPerDay,
        bookedCount,
      });
    }

    return NextResponse.json({
      success: true,
      serviceSlug: service.slug,
      serviceTitleHi: service.titleHi,
      serviceTitleEn: service.titleEn,
      totalSlotCapacityPerDay,
      dates: availabilityList,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "उपलब्धता विवरण प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}
