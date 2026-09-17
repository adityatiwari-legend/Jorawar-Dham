import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const slotSchema = z.object({
  id: z.string().uuid().optional(),
  serviceId: z.string().uuid(),
  startTime: z.string().min(2),
  endTime: z.string().min(2),
  capacity: z.number().int().min(1).max(5000),
  priceInPaise: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      include: {
        slots: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, services });
  } catch {
    return NextResponse.json({ success: false, error: "त्रुटि उत्पन्न हुई" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = slotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "अमान्य स्लॉट विवरण" }, { status: 400 });
    }

    const { id, serviceId, startTime, endTime, capacity, priceInPaise, isActive } = parsed.data;

    let slot;
    if (id) {
      slot = await prisma.serviceSlot.update({
        where: { id },
        data: { startTime, endTime, capacity, priceInPaise, isActive },
      });
    } else {
      slot = await prisma.serviceSlot.create({
        data: { serviceId, startTime, endTime, capacity, priceInPaise, isActive },
      });
    }

    return NextResponse.json({ success: true, slot });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "स्लॉट सहेजने में त्रुटि" }, { status: 500 });
  }
}
