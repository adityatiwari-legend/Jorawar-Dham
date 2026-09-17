import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json(
        { success: false, error: "लॉगिन आवश्यक है (Authentication required)" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: devotee.id,
        phone: devotee.phone,
        email: devotee.email,
        fullName: devotee.fullName,
        city: devotee.city,
        state: devotee.state,
        isPhoneVerified: devotee.isPhoneVerified,
        createdAt: devotee.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "त्रुटि उत्पन्न हुई" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "लॉगिन आवश्यक है" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await prisma.user.update({
      where: { id: devotee.id },
      data: {
        fullName: body.fullName ? String(body.fullName).slice(0, 150) : undefined,
        city: body.city ? String(body.city).slice(0, 100) : undefined,
        state: body.state ? String(body.state).slice(0, 100) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        phone: updated.phone,
        fullName: updated.fullName,
        city: updated.city,
        state: updated.state,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "प्रोफाइल अद्यतन विफल" }, { status: 500 });
  }
}
