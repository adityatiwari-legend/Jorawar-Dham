import { NextResponse } from "next/server";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { prisma } from "@/lib/db/client";

export async function GET() {
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
          { donorPhone: devotee.phone.replace("+91", "") },
        ],
      },
      include: { cause: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      donations: donations.map((d) => ({
        id: d.id,
        donationReference: d.donationReference,
        causeTitleHi: d.cause?.titleHi || "सामान्य धर्मार्थ सेवा",
        causeTitleEn: d.cause?.titleEn || "General Sacred Seva",
        amountInRupees: Math.round(d.amountInPaise / 100),
        status: d.status,
        receiptNumber: d.receiptNumber,
        paidAt: d.paidAt || d.createdAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "दान सूची प्राप्त करने में त्रुटि" },
      { status: 500 }
    );
  }
}
