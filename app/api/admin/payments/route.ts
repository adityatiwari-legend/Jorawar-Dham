import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { PaymentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    // Role check: Only FINANCE_ADMIN or SUPER_ADMIN can view financial payment ledger
    const isAuthorized = admin.isSuperAdmin || admin.roles.includes("FINANCE_ADMIN");
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "वित्तीय अभिलेख देखने हेतु अधिकृत नहीं हैं (Finance permission required)" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status") as PaymentStatus | null;
    const gateway = searchParams.get("gateway");

    const where: any = {};

    if (search) {
      where.OR = [
        { paymentReference: { contains: search, mode: "insensitive" } },
        { gatewayOrderId: { contains: search, mode: "insensitive" } },
        { gatewayPaymentId: { contains: search, mode: "insensitive" } },
        { booking: { primaryDevoteeName: { contains: search, mode: "insensitive" } } },
        { booking: { primaryDevoteePhone: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (gateway) {
      where.gateway = gateway;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          select: {
            bookingReference: true,
            primaryDevoteeName: true,
            primaryDevoteePhone: true,
            service: { select: { titleHi: true, titleEn: true } },
          },
        },
        refunds: {
          select: { refundReference: true, amountInPaise: true, status: true, reason: true },
        },
        receipts: {
          select: { receiptNumber: true, issuedAt: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      payments: payments.map((p) => ({
        id: p.id,
        paymentReference: p.paymentReference,
        gateway: p.gateway,
        gatewayOrderId: p.gatewayOrderId,
        gatewayPaymentId: p.gatewayPaymentId,
        amountInRupees: Math.round(p.amountInPaise / 100),
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        bookingReference: p.booking?.bookingReference,
        devoteeName: p.booking?.primaryDevoteeName,
        devoteePhone: p.booking?.primaryDevoteePhone,
        serviceTitle: p.booking?.service?.titleHi,
        receiptNumber: p.receipts[0]?.receiptNumber,
        refunds: p.refunds,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: "भुगतान सूची प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}
