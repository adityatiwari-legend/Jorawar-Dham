import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { AuditAction, ActorType } from "@prisma/client";
import { z } from "zod";

const causeSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(3).max(100),
  titleHi: z.string().min(2).max(255),
  titleEn: z.string().min(2).max(255),
  descriptionHi: z.string().min(5),
  descriptionEn: z.string().min(5),
  suggestedAmountsInRupees: z.array(z.number().int().min(1)).min(1),
  targetAmountInRupees: z.number().int().min(0).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const causes = await prisma.donationCause.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { donations: true } },
      },
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
        isActive: c.isActive,
        sortOrder: c.sortOrder,
        donationsCount: c._count.donations,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: "प्रकल्प सूची प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    if (!admin.isSuperAdmin && !admin.roles.includes("FINANCE_ADMIN") && !admin.roles.includes("CONTENT_ADMIN")) {
      return NextResponse.json({ success: false, error: "प्रकल्प प्रबंधन हेतु अनुमति आवश्यक है" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = causeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "अमान्य डेटा" }, { status: 400 });
    }

    const {
      id,
      slug,
      titleHi,
      titleEn,
      descriptionHi,
      descriptionEn,
      suggestedAmountsInRupees,
      targetAmountInRupees,
      imageUrl,
      isActive,
      sortOrder,
    } = parsed.data;

    const suggestedAmounts = suggestedAmountsInRupees.map((r) => r * 100);
    const targetAmountInPaise = targetAmountInRupees ? targetAmountInRupees * 100 : null;

    let cause;
    if (id) {
      cause = await prisma.donationCause.update({
        where: { id },
        data: {
          slug,
          titleHi,
          titleEn,
          descriptionHi,
          descriptionEn,
          suggestedAmounts,
          targetAmountInPaise,
          imageUrl: imageUrl || null,
          isActive,
          sortOrder,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          actorEmail: admin.email,
          action: AuditAction.UPDATE,
          entity: "DONATION_CAUSE",
          entityId: cause.id,
          details: { slug, titleEn, updatedBy: admin.email },
        },
      });
    } else {
      cause = await prisma.donationCause.create({
        data: {
          slug,
          titleHi,
          titleEn,
          descriptionHi,
          descriptionEn,
          suggestedAmounts,
          targetAmountInPaise,
          imageUrl: imageUrl || null,
          isActive,
          sortOrder,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          actorEmail: admin.email,
          action: AuditAction.CREATE,
          entity: "DONATION_CAUSE",
          entityId: cause.id,
          details: { slug, titleEn, createdBy: admin.email },
        },
      });
    }

    return NextResponse.json({ success: true, cause });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "प्रकल्प सहेजने में त्रुटि" }, { status: 500 });
  }
}
