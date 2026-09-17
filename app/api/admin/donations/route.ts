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

    // Role check: Only FINANCE_ADMIN or SUPER_ADMIN
    const isAuthorized = admin.isSuperAdmin || admin.roles.includes("FINANCE_ADMIN");
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "दान अभिलेख देखने हेतु अधिकृत नहीं हैं (Finance permission required)" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const causeId = searchParams.get("causeId");
    const status = searchParams.get("status") as PaymentStatus | null;

    const where: any = {};

    if (search) {
      where.OR = [
        { donationReference: { contains: search, mode: "insensitive" } },
        { receiptNumber: { contains: search, mode: "insensitive" } },
        { donorName: { contains: search, mode: "insensitive" } },
        { donorPhone: { contains: search } },
        { gatewayPaymentId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (causeId) {
      where.causeId = causeId;
    }

    if (status) {
      where.status = status;
    }

    const donations = await prisma.donation.findMany({
      where,
      include: { cause: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      donations: donations.map((d) => ({
        id: d.id,
        donationReference: d.donationReference,
        receiptNumber: d.receiptNumber,
        donorName: d.donorName,
        donorPhone: d.donorPhone,
        donorEmail: d.donorEmail,
        donorPan: d.donorPan,
        amountInRupees: Math.round(d.amountInPaise / 100),
        causeTitleHi: d.cause?.titleHi || "सामान्य सेवा",
        causeTitleEn: d.cause?.titleEn || "General Seva",
        status: d.status,
        gateway: d.gateway,
        gatewayPaymentId: d.gatewayPaymentId,
        paidAt: d.paidAt,
        createdAt: d.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: "दान सूची प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}
