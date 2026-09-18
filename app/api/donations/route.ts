import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";

export async function GET(req: NextRequest) {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "लॉगिन आवश्यक है" }, { status: 401 });
    }

    const donations = await prisma.donation.findMany({
      where: {
        OR: [
          { userId: devotee.id },
          { donorPhone: devotee.phone },
        ],
      },
      include: {
        cause: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedDonations = donations.map((d) => ({
      id: d.id,
      donationReference: d.donationReference,
      amountInPaise: d.amountInPaise,
      amountInRupees: d.amountInPaise / 100,
      currency: d.currency,
      status: d.status,
      causeTitleHi: d.cause?.titleHi || "सामान्य धर्मार्थ सेवा",
      causeTitleEn: d.cause?.titleEn || "General Seva",
      donorName: d.donorName,
      isAnonymous: d.isAnonymous,
      receiptNumber: d.receiptNumber,
      paymentReference: d.gatewayPaymentId || d.gatewayOrderId || "DIRECT",
      createdAt: d.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json({
      success: true,
      donations: formattedDonations,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "दान विवरण लोड करने में त्रुटि" }, { status: 500 });
  }
}
