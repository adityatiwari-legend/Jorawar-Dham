import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { BookingStatus, PaymentStatus, AuditAction } from "@prisma/client";
import { generatePaymentReference } from "@/lib/booking/service";
import { NotificationService } from "@/lib/notifications/service";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().min(3, "रद्द करने का कारण अनिवार्य है").max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const hasBookingPermission =
      admin.isSuperAdmin ||
      admin.roles.includes("BOOKING_ADMIN") ||
      admin.permissions.includes("bookings:manage") ||
      admin.permissions.includes("bookings:read");

    if (!hasBookingPermission) {
      return NextResponse.json(
        { success: false, error: "अनधिकृत: बुकिंग प्रबंधन अधिकार आवश्यक हैं" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "अमान्य विवरण" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payments: { where: { status: PaymentStatus.PAID } },
        service: true,
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "बुकिंग नहीं मिली" }, { status: 404 });
    }

    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      return NextResponse.json(
        { success: false, error: "यह बुकिंग पूर्व में ही निरस्त की जा चुकी है" },
        { status: 400 }
      );
    }

    const completedPayment = booking.payments[0];

    await prisma.$transaction(async (tx) => {
      // 1. Update booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: completedPayment ? BookingStatus.REFUND_PENDING : BookingStatus.CANCELLED,
          cancellationReason: `[Admin: ${admin.email}] ${parsed.data.reason}`,
          cancelledAt: new Date(),
        },
      });

      // 2. Decrement slot count if active
      if (booking.bookingStatus === BookingStatus.CONFIRMED) {
        await tx.serviceSlot.update({
          where: { id: booking.slotId },
          data: {
            bookedCount: { decrement: booking.numberOfDevotees },
          },
        });
      }

      // 3. Initiate refund record if paid
      if (completedPayment) {
        await tx.payment.update({
          where: { id: completedPayment.id },
          data: { status: PaymentStatus.REFUND_PENDING },
        });

        await tx.refund.create({
          data: {
            refundReference: `REF-${generatePaymentReference().slice(4)}`,
            paymentId: completedPayment.id,
            bookingId: booking.id,
            amountInPaise: completedPayment.amountInPaise,
            reason: parsed.data.reason,
            status: "REQUESTED",
            processedByAdminId: admin.id,
          },
        });
      }

      // 4. Record tamper-resistant audit log
      await tx.auditLog.create({
        data: {
          actorType: "ADMIN",
          actorId: admin.id,
          actorEmail: admin.email,
          action: AuditAction.UPDATE,
          entity: "BOOKING",
          entityId: booking.id,
          details: {
            action: "ADMIN_CANCEL_BOOKING",
            bookingReference: booking.bookingReference,
            previousStatus: booking.bookingStatus,
            newStatus: completedPayment ? BookingStatus.REFUND_PENDING : BookingStatus.CANCELLED,
            reason: parsed.data.reason,
            devoteeCount: booking.numberOfDevotees,
          },
        },
      });
    });

    // 5. Send cancellation notice (zero secrets)
    await NotificationService.sendCancellationNotice(
      booking.bookingReference,
      booking.primaryDevoteeName,
      booking.primaryDevoteePhone,
      parsed.data.reason
    ).catch((err: any) => logger.warn(`Cancellation notice failed: ${err}`));

    logger.info(`Booking [${booking.bookingReference}] cancelled by admin [${admin.email}]`);

    return NextResponse.json({
      success: true,
      message: completedPayment
        ? "बुकिंग निरस्त कर दी गई है एवं रिफंड अनुरोध दर्ज कर लिया गया है।"
        : "बुकिंग सफलतापूर्वक निरस्त कर दी गई है।",
    });
  } catch (error: any) {
    logger.error("Admin booking cancel error:", error);
    return NextResponse.json({ success: false, error: "बुकिंग निरस्त करने में त्रुटि हुई" }, { status: 500 });
  }
}
