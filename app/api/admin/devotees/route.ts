import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const devoteeId = searchParams.get("id");

    const isSuperAdmin = admin.isSuperAdmin || admin.roles.includes("SUPER_ADMIN");

    // If specific devotee details requested
    if (devoteeId) {
      const user = await prisma.user.findUnique({
        where: { id: devoteeId },
        include: {
          bookings: {
            include: { service: true, slot: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          donations: {
            include: { cause: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: "श्रद्धालु रिकॉर्ड नहीं मिला" }, { status: 404 });
      }

      // Mask phone if not Super Admin
      const displayPhone = isSuperAdmin
        ? user.phone
        : `${user.phone.slice(0, 2)}****${user.phone.slice(-4)}`;

      return NextResponse.json({
        success: true,
        devotee: {
          id: user.id,
          phone: displayPhone,
          fullName: user.fullName || "—",
          email: user.email ? (isSuperAdmin ? user.email : `***@${user.email.split("@")[1] || "..."}`) : null,
          city: user.city,
          state: user.state,
          status: user.status,
          isPhoneVerified: user.isPhoneVerified,
          createdAt: user.createdAt.toISOString().split("T")[0],
          bookings: user.bookings.map((b) => ({
            id: b.id,
            reference: b.bookingReference,
            service: b.service.titleHi,
            date: b.bookingDate.toISOString().split("T")[0],
            slot: `${b.slot.startTime} - ${b.slot.endTime}`,
            devotees: b.numberOfDevotees,
            status: b.bookingStatus,
            amount: b.totalAmountInPaise / 100,
          })),
          donations: user.donations.map((d) => ({
            id: d.id,
            reference: d.donationReference,
            cause: d.cause?.titleHi || "सामान्य दान",
            amount: d.amountInPaise / 100,
            status: d.status,
            date: d.createdAt.toISOString().split("T")[0],
          })),
        },
      });
    }

    // List devotees
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { phone: { contains: search } },
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      include: {
        _count: {
          select: {
            bookings: true,
            donations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formattedDevotees = users.map((u) => ({
      id: u.id,
      phone: isSuperAdmin ? u.phone : `${u.phone.slice(0, 2)}****${u.phone.slice(-4)}`,
      fullName: u.fullName || "—",
      city: u.city || "—",
      state: u.state || "—",
      status: u.status,
      isPhoneVerified: u.isPhoneVerified,
      bookingsCount: u._count.bookings,
      donationsCount: u._count.donations,
      createdAt: u.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json({
      success: true,
      devotees: formattedDevotees,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "श्रद्धालु सूची लोड करने में त्रुटि" }, { status: 500 });
  }
}
