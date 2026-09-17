import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const causes = await prisma.donationCause.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      causes: causes.map((c) => ({
        id: c.id,
        slug: c.slug,
        titleHi: c.titleHi,
        titleEn: c.titleEn,
        descriptionHi: c.descriptionHi,
        descriptionEn: c.descriptionEn,
        suggestedAmountsInRupees: c.suggestedAmounts.map((a) => Math.round(a / 100)),
        targetAmountInRupees: c.targetAmountInPaise ? Math.round(c.targetAmountInPaise / 100) : null,
        collectedAmountInRupees: Math.round(c.collectedAmountInPaise / 100),
        imageUrl: c.imageUrl,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "दान प्रकल्प सूची प्राप्त करने में त्रुटि" },
      { status: 500 }
    );
  }
}
