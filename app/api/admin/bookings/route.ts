import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { BookingStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const serviceId = searchParams.get("serviceId");
    const status = searchParams.get("status") as BookingStatus | null;
    const dateStr = searchParams.get("date");

    const where: any = {};

    if (search) {
      where.OR = [
        { bookingReference: { contains: search, mode: "insensitive" } },
        { primaryDevoteePhone: { contains: search } },
        { primaryDevoteeName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (status) {
      where.bookingStatus = status;
    }

    if (dateStr) {
      const d = new Date(dateStr);
      const normalizedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      where.bookingDate = normalizedDate;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          select: { titleHi: true, titleEn: true, slug: true },
        },
        slot: {
          select: { startTime: true, endTime: true },
        },
        payments: {
          select: { paymentReference: true, gateway: true, status: true, amountInPaise: true },
          take: 1,
        },
        receipt: {
          select: { receiptNumber: true, issuedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingReference: b.bookingReference,
        devoteeName: b.primaryDevoteeName,
        devoteePhone: b.primaryDevoteePhone,
        serviceTitleHi: b.service.titleHi,
        serviceTitleEn: b.service.titleEn,
        slotTime: `${b.slot.startTime} - ${b.slot.endTime}`,
        bookingDate: b.bookingDate.toISOString().split("T")[0],
        numberOfDevotees: b.numberOfDevotees,
        totalAmountInPaise: b.totalAmountInPaise,
        status: b.bookingStatus,
        checkedInAt: b.checkedInAt,
        receiptNumber: b.receipt?.receiptNumber,
        paymentStatus: b.payments[0]?.status || "PENDING",
        createdAt: b.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: "बुकिंग सूची प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}
