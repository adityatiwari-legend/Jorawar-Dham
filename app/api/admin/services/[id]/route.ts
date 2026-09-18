import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const updateServiceSchema = z.object({
  titleHi: z.string().min(2).max(255).optional(),
  titleEn: z.string().min(2).max(255).optional(),
  descriptionHi: z.string().min(5).optional(),
  descriptionEn: z.string().min(5).optional(),
  timingHi: z.string().max(255).optional().nullable(),
  timingEn: z.string().max(255).optional().nullable(),
  guidelinesHi: z.string().optional().nullable(),
  guidelinesEn: z.string().optional().nullable(),
  capacity: z.number().int().min(0).optional(),
  price: z.number().int().min(0).optional(),
  imageUrl: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "BOOKING_ADMIN", "CONTENT_ADMIN"];
    const hasRole = admin.isSuperAdmin || admin.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return NextResponse.json({ success: false, error: "सेवा संपादन हेतु अनुमति नहीं है" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "अमान्य विवरण" }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "सेवा अद्यतन में त्रुटि" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    if (!admin.isSuperAdmin && !admin.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "केवल सुपर एडमिन ही सेवा हटा सकते हैं" }, { status: 403 });
    }

    const { id } = await params;

    // Check if there are bookings
    const bookingsCount = await prisma.booking.count({
      where: { serviceId: id },
    });

    if (bookingsCount > 0) {
      // Soft-delete by setting isActive = false to preserve historical integrity
      await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: "सेवा में पूर्व बुकिंग्स होने के कारण इसे निष्क्रिय (deactivated) कर दिया गया है।",
      });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "सेवा सफलतापूर्वक हटा दी गई।" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "सेवा हटाने में त्रुटि" }, { status: 500 });
  }
}
