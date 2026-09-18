import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    // Search Receipts
    const receipts = await prisma.receipt.findMany({
      where: search
        ? {
            OR: [
              { receiptNumber: { contains: search, mode: "insensitive" } },
              { devoteeName: { contains: search, mode: "insensitive" } },
              { booking: { bookingReference: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {},
      include: {
        booking: {
          include: {
            service: true,
            slot: true,
          },
        },
        payment: true,
      },
      orderBy: { issuedAt: "desc" },
      take: 100,
    });

    const formattedReceipts = receipts.map((r) => ({
      id: r.id,
      receiptNumber: r.receiptNumber,
      bookingId: r.bookingId,
      bookingReference: r.booking.bookingReference,
      devoteeName: r.devoteeName,
      maskedPhone: r.maskedPhone,
      serviceTitleHi: r.serviceTitleHi,
      serviceTitleEn: r.serviceTitleEn,
      amountInRupees: r.amountInPaise / 100,
      paymentReference: r.payment.paymentReference,
      gatewayPaymentId: r.payment.gatewayPaymentId,
      issuedAt: r.issuedAt.toISOString(),
      slotTime: `${r.booking.slot.startTime} - ${r.booking.slot.endTime}`,
      bookingDate: r.booking.bookingDate.toISOString().split("T")[0],
    }));

    return NextResponse.json({
      success: true,
      invoices: formattedReceipts,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "रसीद लेजर लोड करने में त्रुटि" }, { status: 500 });
  }
}
