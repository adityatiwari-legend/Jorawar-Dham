import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const createServiceSchema = z.object({
  slug: z.string().min(2).max(100),
  titleHi: z.string().min(2).max(255),
  titleEn: z.string().min(2).max(255),
  descriptionHi: z.string().min(5),
  descriptionEn: z.string().min(5),
  timingHi: z.string().max(255).optional().nullable(),
  timingEn: z.string().max(255).optional().nullable(),
  guidelinesHi: z.string().optional().nullable(),
  guidelinesEn: z.string().optional().nullable(),
  capacity: z.number().int().min(0).default(50),
  price: z.number().int().min(0).default(0),
  imageUrl: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      include: {
        _count: {
          select: {
            slots: true,
            bookings: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, services });
  } catch (error) {
    return NextResponse.json({ success: false, error: "सेवाएं लोड करने में त्रुटि" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    // Role check: SUPER_ADMIN, BOOKING_ADMIN, or CONTENT_ADMIN
    const allowedRoles = ["SUPER_ADMIN", "BOOKING_ADMIN", "CONTENT_ADMIN"];
    const hasRole = admin.isSuperAdmin || admin.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return NextResponse.json({ success: false, error: "सेवा सृजन हेतु अनुमति नहीं है" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "अमान्य सेवा विवरण" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.service.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "इस स्लग (slug) की सेवा पहले से विद्यमान है" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    return NextResponse.json({ success: false, error: "सेवा सृजन में सर्वर त्रुटि" }, { status: 500 });
  }
}
