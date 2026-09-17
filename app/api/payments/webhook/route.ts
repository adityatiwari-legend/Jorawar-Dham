import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { generateReceiptNumber, maskPhoneNumber } from "@/lib/booking/service";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { logger } from "@/lib/logger/logger";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const gateway = getPaymentGateway();
    const isValid = gateway.verifyWebhookSignature({
      rawBody,
      signature,
      secret: process.env.RAZORPAY_WEBHOOK_SECRET,
    });

    if (!isValid) {
      logger.warn("Security alert: Invalid webhook signature received on /api/payments/webhook");
      return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    logger.info(`Webhook event [${event}] received for order [${orderId || "unknown"}] payment [${paymentId || "unknown"}]`);

    // 1. Handle Payment Captured / Succeeded
    if (event === "payment.captured" || event === "order.paid") {
      if (!orderId) {
        return NextResponse.json({ success: true, message: "No order ID in event payload" });
      }

      const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId: orderId },
        include: {
          booking: {
            include: { service: true, slot: true, receipt: true },
          },
        },
      });

      if (!payment) {
        // Check if this webhook corresponds to a Donation order
        const donation = await prisma.donation.findFirst({
          where: { gatewayOrderId: orderId },
        });

        if (!donation) {
          logger.warn(`Webhook: Neither payment nor donation found for order [${orderId}]`);
          return NextResponse.json({ success: true, message: "Order not recognized" });
        }

        // Idempotency: If donation already marked PAID, return safe success
        if (donation.status === PaymentStatus.PAID) {
          logger.info(`Webhook idempotency: Donation [${donation.donationReference}] already confirmed and paid. Skipping duplicate.`);
          return NextResponse.json({ success: true, message: "Already processed" });
        }

        const now = new Date();
        const donationReceiptNum = donation.receiptNumber || `REC-DON-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

        await prisma.$transaction(async (tx) => {
          await tx.donation.update({
            where: { id: donation.id },
            data: {
              status: PaymentStatus.PAID,
              gatewayPaymentId: paymentId || donation.gatewayPaymentId,
              receiptNumber: donationReceiptNum,
              receiptIssuedAt: donation.receiptIssuedAt || now,
              paidAt: donation.paidAt || now,
            },
          });

          if (donation.causeId) {
            await tx.donationCause.update({
              where: { id: donation.causeId },
              data: {
                collectedAmountInPaise: { increment: donation.amountInPaise },
              },
            });
          }
        });

        logger.info(`Webhook: Donation [${donation.donationReference}] marked PAID via webhook`);
        return NextResponse.json({ success: true, status: "PROCESSED" });
      }

      // Idempotency Check: If already marked PAID, exit safely without duplicate processing
      if (payment.status === PaymentStatus.PAID && payment.booking.bookingStatus === BookingStatus.CONFIRMED) {
        logger.info(`Webhook idempotency: Order [${orderId}] already confirmed and paid. Skipping duplicate.`);
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      // Atomic confirmation transaction
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            gatewayPaymentId: paymentId || payment.gatewayPaymentId,
            paidAt: new Date(),
            rawGatewayResponse: payload,
          },
        });

        await tx.booking.update({
          where: { id: payment.booking.id },
          data: {
            bookingStatus: BookingStatus.CONFIRMED,
          },
        });

        // Ensure receipt exists
        const existingReceipt = await tx.receipt.findFirst({
          where: { bookingId: payment.booking.id },
        });

        if (!existingReceipt) {
          await tx.receipt.create({
            data: {
              receiptNumber: generateReceiptNumber(),
              bookingId: payment.booking.id,
              paymentId: payment.id,
              amountInPaise: payment.amountInPaise,
              devoteeName: payment.booking.primaryDevoteeName,
              maskedPhone: maskPhoneNumber(payment.booking.primaryDevoteePhone),
              serviceTitleHi: payment.booking.service.titleHi,
              serviceTitleEn: payment.booking.service.titleEn,
            },
          });
        }
      });

      logger.info(`Webhook: Booking [${payment.booking.bookingReference}] marked CONFIRMED via webhook`);
      return NextResponse.json({ success: true, status: "PROCESSED" });
    }

    // 2. Handle Payment Failed
    if (event === "payment.failed") {
      if (orderId) {
        await prisma.payment.updateMany({
          where: { gatewayOrderId: orderId },
          data: {
            status: PaymentStatus.FAILED,
            rawGatewayResponse: payload,
          },
        });
        await prisma.donation.updateMany({
          where: { gatewayOrderId: orderId, status: PaymentStatus.PENDING },
          data: {
            status: PaymentStatus.FAILED,
          },
        });
        logger.info(`Webhook: Order [${orderId}] marked FAILED for payment/donation`);
      }
      return NextResponse.json({ success: true, status: "MARKED_FAILED" });
    }

    // 3. Handle Refund Processed
    if (event === "refund.processed") {
      const refundEntity = payload.payload?.refund?.entity;
      const refundId = refundEntity?.id;
      const rPaymentId = refundEntity?.payment_id;

      if (rPaymentId) {
        const payment = await prisma.payment.findFirst({
          where: { gatewayPaymentId: rPaymentId },
        });

        if (payment) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.REFUNDED },
            });
            await tx.booking.update({
              where: { id: payment.bookingId },
              data: { bookingStatus: BookingStatus.REFUNDED },
            });
            await tx.refund.updateMany({
              where: { paymentId: payment.id },
              data: {
                status: "SUCCESS",
                gatewayRefundId: refundId,
                processedAt: new Date(),
              },
            });
          });
          logger.info(`Webhook: Refund processed for payment [${rPaymentId}]`);
        }

        const donation = await prisma.donation.findFirst({
          where: { gatewayPaymentId: rPaymentId },
        });

        if (donation && donation.status !== PaymentStatus.REFUNDED) {
          await prisma.$transaction(async (tx) => {
            await tx.donation.update({
              where: { id: donation.id },
              data: { status: PaymentStatus.REFUNDED },
            });
            if (donation.causeId) {
              await tx.donationCause.update({
                where: { id: donation.causeId },
                data: {
                  collectedAmountInPaise: { decrement: donation.amountInPaise },
                },
              });
            }
          });
          logger.info(`Webhook: Refund processed for donation [${donation.donationReference}]`);
        }
      }
      return NextResponse.json({ success: true, status: "REFUND_RECORDED" });
    }

    return NextResponse.json({ success: true, status: "IGNORED_EVENT" });
  } catch (error: any) {
    logger.error("Webhook processing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
