import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { prisma } from "@/lib/db/client";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { generatePaymentReference } from "@/lib/booking/service";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().min(3, "रद्द करने का कारण दर्ज करें").max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "लॉगिन आवश्यक है" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = cancelSchema.safeParse(body);
    const reason = parsed.success ? parsed.data.reason : "Devotee requested cancellation";

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payments: { where: { status: "PAID" } } },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "बुकिंग उपलब्ध नहीं है" }, { status: 404 });
    }

    // IDOR check
    if (booking.userId !== devotee.id) {
      return NextResponse.json({ success: false, error: "अनधिकृत अनुरोध" }, { status: 403 });
    }

    // Check if can be cancelled
    if (booking.bookingStatus !== BookingStatus.CONFIRMED && booking.bookingStatus !== BookingStatus.PENDING_PAYMENT) {
      return NextResponse.json(
        { success: false, error: `वर्तमान स्थिति (${booking.bookingStatus}) में बुकिंग रद्द नहीं की जा सकती` },
        { status: 400 }
      );
    }

    const paidPayment = booking.payments[0];

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: paidPayment ? BookingStatus.REFUND_PENDING : BookingStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      });

      if (paidPayment) {
        await tx.payment.update({
          where: { id: paidPayment.id },
          data: { status: PaymentStatus.REFUND_PENDING },
        });

        await tx.refund.create({
          data: {
            refundReference: `REF-${generatePaymentReference().slice(4)}`,
            paymentId: paidPayment.id,
            bookingId: booking.id,
            amountInPaise: paidPayment.amountInPaise,
            reason,
            status: "REQUESTED",
          },
        });
      }
    });

    logger.info(`Booking cancelled [${booking.bookingReference}] by devotee [${devotee.id}]`);

    return NextResponse.json({
      success: true,
      message: paidPayment
        ? "बुकिंग सफलतापूर्वक रद्द कर दी गई है। रिफंड अनुरोध दर्ज कर लिया गया है।"
        : "बुकिंग सफलतापूर्वक रद्द कर दी गई है।",
    });
  } catch (error) {
    logger.error(`Cancellation error: ${error}`);
    return NextResponse.json({ success: false, error: "रद्दीकरण प्रक्रिया में त्रुटि" }, { status: 500 });
  }
}
