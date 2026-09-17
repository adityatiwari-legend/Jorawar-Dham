import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { AuditAction, ActorType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const isFinanceAdmin = admin.isSuperAdmin || admin.roles.includes("FINANCE_ADMIN");
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d"; // "today", "7d", "30d", "all"
    const exportType = searchParams.get("export"); // "bookings" | "payments" | "donations" | null

    const now = new Date();
    let startDate = new Date(0);

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Handle CSV Export
    if (exportType) {
      if ((exportType === "payments" || exportType === "donations") && !isFinanceAdmin) {
        return NextResponse.json(
          { success: false, error: "वित्तीय डेटा निर्यात करने की अनुमति नहीं है (Finance authorization required)" },
          { status: 403 }
        );
      }

      await prisma.auditLog.create({
        data: {
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          actorEmail: admin.email,
          action: AuditAction.UPDATE,
          entity: `EXPORT_${exportType.toUpperCase()}`,
          details: { range, exportedBy: admin.email },
        },
      });

      if (exportType === "bookings") {
        const bookings = await prisma.booking.findMany({
          where: { createdAt: { gte: startDate } },
          include: { service: true, slot: true },
          orderBy: { createdAt: "desc" },
          take: 5000,
        });

        const headers = ["Reference", "Date", "Slot", "Service", "DevoteeName", "DevoteePhoneMasked", "Count", "AmountINR", "Status", "CheckedInAt"];
        const rows = bookings.map((b) => [
          b.bookingReference,
          b.bookingDate.toISOString().split("T")[0],
          `"${b.slot.startTime} - ${b.slot.endTime}"`,
          `"${b.service.titleHi}"`,
          `"${b.primaryDevoteeName.replace(/"/g, '""')}"`,
          `${b.primaryDevoteePhone.slice(0, 2)}****${b.primaryDevoteePhone.slice(-4)}`,
          b.numberOfDevotees,
          b.totalAmountInPaise / 100,
          b.bookingStatus,
          b.checkedInAt ? b.checkedInAt.toISOString() : "",
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="jorawar_dham_bookings_${range}.csv"`,
          },
        });
      }

      if (exportType === "donations") {
        const donations = await prisma.donation.findMany({
          where: { createdAt: { gte: startDate } },
          include: { cause: true },
          orderBy: { createdAt: "desc" },
          take: 5000,
        });

        const headers = ["Reference", "ReceiptNo", "Date", "Cause", "DonorName", "PhoneMasked", "AmountINR", "Status", "Gateway"];
        const rows = donations.map((d) => [
          d.donationReference,
          d.receiptNumber || "",
          d.createdAt.toISOString().split("T")[0],
          `"${d.cause?.titleHi || "General Seva"}"`,
          `"${d.donorName.replace(/"/g, '""')}"`,
          `${d.donorPhone.slice(0, 2)}****${d.donorPhone.slice(-4)}`,
          d.amountInPaise / 100,
          d.status,
          d.gateway,
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="jorawar_dham_donations_${range}.csv"`,
          },
        });
      }

      if (exportType === "payments") {
        const payments = await prisma.payment.findMany({
          where: { createdAt: { gte: startDate } },
          include: { booking: { select: { bookingReference: true } } },
          orderBy: { createdAt: "desc" },
          take: 5000,
        });

        const headers = ["PaymentReference", "BookingReference", "Gateway", "GatewayOrderId", "GatewayPaymentId", "AmountINR", "Status", "Date"];
        const rows = payments.map((p) => [
          p.paymentReference,
          p.booking?.bookingReference || "",
          p.gateway,
          p.gatewayOrderId || "",
          p.gatewayPaymentId || "",
          p.amountInPaise / 100,
          p.status,
          p.createdAt.toISOString(),
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="jorawar_dham_payments_${range}.csv"`,
          },
        });
      }
    }

    // Normal JSON summary report
    const [
      totalBookings,
      confirmedBookings,
      checkedInVisitors,
      cancelledBookings,
      totalDonationsCount,
      donationSumResult,
      paymentSumResult,
      servicesBreakdown,
    ] = await Promise.all([
      prisma.booking.count({ where: { createdAt: { gte: startDate } } }),
      prisma.booking.count({ where: { createdAt: { gte: startDate }, bookingStatus: "CONFIRMED" } }),
      prisma.booking.aggregate({
        where: { createdAt: { gte: startDate }, bookingStatus: "CHECKED_IN" },
        _sum: { numberOfDevotees: true },
      }),
      prisma.booking.count({ where: { createdAt: { gte: startDate }, bookingStatus: "CANCELLED" } }),
      prisma.donation.count({ where: { createdAt: { gte: startDate }, status: "PAID" } }),
      isFinanceAdmin
        ? prisma.donation.aggregate({
            where: { createdAt: { gte: startDate }, status: "PAID" },
            _sum: { amountInPaise: true },
          })
        : Promise.resolve({ _sum: { amountInPaise: null } }),
      isFinanceAdmin
        ? prisma.payment.aggregate({
            where: { createdAt: { gte: startDate }, status: "PAID" },
            _sum: { amountInPaise: true },
          })
        : Promise.resolve({ _sum: { amountInPaise: null } }),
      prisma.service.findMany({
        select: {
          id: true,
          titleHi: true,
          titleEn: true,
          _count: { select: { bookings: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      range,
      isFinanceAdmin,
      metrics: {
        totalBookings,
        confirmedBookings,
        checkedInVisitors: checkedInVisitors._sum.numberOfDevotees || 0,
        cancelledBookings,
        totalDonationsCount,
        totalDonationsAmountInRupees: isFinanceAdmin
          ? Math.round((donationSumResult._sum.amountInPaise || 0) / 100)
          : null,
        totalPaymentsAmountInRupees: isFinanceAdmin
          ? Math.round((paymentSumResult._sum.amountInPaise || 0) / 100)
          : null,
        servicesPopularity: servicesBreakdown.map((s) => ({
          name: s.titleHi,
          bookings: s._count.bookings,
        })),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "रिपोर्ट्स तैयार करने में त्रुटि" }, { status: 500 });
  }
}
