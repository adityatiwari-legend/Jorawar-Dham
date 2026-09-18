import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { prisma } from "@/lib/db/client";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { generatePaymentReference } from "@/lib/booking/service";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { logger } from "@/lib/logger/logger";
import { z } from "zod";

const createOrderSchema = z.object({
  bookingId: z.string().uuid("अमान्य बुकिंग पहचानकर्ता"),
});

export async function POST(req: NextRequest) {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "लॉगिन आवश्यक है" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "अमान्य इनपुट" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parsed.data.bookingId },
      include: { service: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "बुकिंग नहीं मिली" }, { status: 404 });
    }

    // IDOR Protection: only booking owner can initiate payment
    if (booking.userId !== devotee.id) {
      return NextResponse.json({ success: false, error: "अनधिकृत अनुरोध" }, { status: 403 });
    }

    // Check status
    if (booking.bookingStatus !== BookingStatus.PENDING_PAYMENT) {
      return NextResponse.json(
        { success: false, error: `इस बुकिंग की स्थिति (${booking.bookingStatus}) भुगतान योग्य नहीं है` },
        { status: 400 }
      );
    }

    // Check if hold has expired
    if (booking.expiresAt < new Date()) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { bookingStatus: BookingStatus.EXPIRED },
      });
      return NextResponse.json(
        { success: false, error: "बुकिंग समय-सीमा समाप्त हो चुकी है। कृपया पुनः नया स्लॉट चुनें।" },
        { status: 400 }
      );
    }

    // Check amount
    if (booking.totalAmountInPaise <= 0) {
      return NextResponse.json(
        { success: false, error: "यह सेवा निःशुल्क है, इसके लिए भुगतान आवश्यक नहीं है।" },
        { status: 400 }
      );
    }

    const gateway = getPaymentGateway();
    const order = await gateway.createOrder({
      amountInPaise: booking.totalAmountInPaise,
      currency: "INR",
      receipt: booking.bookingReference,
      notes: {
        bookingId: booking.id,
        userId: devotee.id,
        serviceSlug: booking.service.slug,
      },
    });

    // Create or update Payment record
    const paymentReference = generatePaymentReference();
    await prisma.payment.upsert({
      where: { gatewayOrderId: order.orderId },
      update: {
        amountInPaise: order.amountInPaise,
        status: PaymentStatus.PENDING,
      },
      create: {
        paymentReference,
        bookingId: booking.id,
        userId: devotee.id,
        gateway: gateway.name === "RAZORPAY" ? "RAZORPAY" : "MOCK",
        gatewayOrderId: order.orderId,
        amountInPaise: order.amountInPaise,
        currency: order.currency,
        status: PaymentStatus.PENDING,
      },
    });

    // Update booking status to PAYMENT_PROCESSING
    await prisma.booking.update({
      where: { id: booking.id },
      data: { bookingStatus: BookingStatus.PAYMENT_PROCESSING },
    });

    logger.info(`Payment order created [${order.orderId}] for booking [${booking.bookingReference}]`);

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        amountInPaise: order.amountInPaise,
        currency: order.currency,
        keyId: order.keyId,
        isMock: order.isMock,
        bookingReference: booking.bookingReference,
      },
    });
  } catch (error: any) {
    logger.error("Create payment order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "भुगतान आदेश सृजन में त्रुटि" },
      { status: 500 }
    );
  }
}
