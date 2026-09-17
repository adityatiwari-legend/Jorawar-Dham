import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { prisma } from "@/lib/db/client";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { generateReceiptNumber, maskPhoneNumber } from "@/lib/booking/service";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  orderId: z.string().min(5),
  paymentId: z.string().min(5),
  signature: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "लॉगिन आवश्यक है" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "अमान्य भुगतान सत्यापन डेटा" }, { status: 400 });
    }

    const { bookingId, orderId, paymentId, signature } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, slot: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "बुकिंग नहीं मिली" }, { status: 404 });
    }

    // IDOR Protection: only booking owner can verify
    if (booking.userId !== devotee.id) {
      return NextResponse.json({ success: false, error: "अनधिकृत अनुरोध" }, { status: 403 });
    }

    // Server-side Payment Signature Verification
    const gateway = getPaymentGateway();
    const isValidSignature = gateway.verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      logger.warn(`Payment signature verification failed for booking [${booking.bookingReference}], order [${orderId}]`);
      await prisma.payment.updateMany({
        where: { gatewayOrderId: orderId },
        data: { status: PaymentStatus.FAILED },
      });
      return NextResponse.json(
        { success: false, error: "भुगतान सत्यापन हस्ताक्षर अमान्य है। (Invalid payment signature)" },
        { status: 400 }
      );
    }

    // Check if already confirmed (Idempotency)
    if (booking.bookingStatus === BookingStatus.CONFIRMED) {
      return NextResponse.json({
        success: true,
        message: "बुकिंग पूर्व में ही पुष्ट हो चुकी है।",
        bookingReference: booking.bookingReference,
      });
    }

    // Atomically transition payment to PAID, booking to CONFIRMED, and create official receipt
    const receiptNumber = generateReceiptNumber();

    await prisma.$transaction(async (tx) => {
      // Find or create payment
      const payment = await tx.payment.findFirst({
        where: { gatewayOrderId: orderId },
      });

      if (!payment) {
        throw new Error("Payment record not found for order");
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          gatewayPaymentId: paymentId,
          gatewaySignature: signature,
          paidAt: new Date(),
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: BookingStatus.CONFIRMED,
        },
      });

      // Upsert receipt
      await tx.receipt.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
          receiptNumber,
          bookingId: booking.id,
          paymentId: payment.id,
          amountInPaise: booking.totalAmountInPaise,
          devoteeName: booking.primaryDevoteeName,
          maskedPhone: maskPhoneNumber(booking.primaryDevoteePhone),
          serviceTitleHi: booking.service.titleHi,
          serviceTitleEn: booking.service.titleEn,
        },
      });
    });

    logger.info(`Payment verified and booking confirmed [${booking.bookingReference}] receipt: [${receiptNumber}]`);

    return NextResponse.json({
      success: true,
      message: "भुगतान सफलतापूर्वक सत्यापित हुआ। आपकी बुकिंग पुष्ट कर दी गई है।",
      bookingReference: booking.bookingReference,
      receiptNumber,
    });
  } catch (error: any) {
    logger.error("Payment verification route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "भुगतान सत्यापन में तकनीकी त्रुटि" },
      { status: 500 }
    );
  }
}
