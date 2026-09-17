import { getNotificationProvider } from "./providers";
import {
  BookingNotificationData,
  PaymentNotificationData,
  DonationNotificationData,
} from "./types";
import { logger } from "@/lib/logger/logger";

export class NotificationService {
  /**
   * Dispatch booking confirmation pass notification
   */
  static async sendBookingConfirmation(data: BookingNotificationData) {
    try {
      const provider = getNotificationProvider();
      await provider.send({
        recipient: {
          name: data.primaryDevoteeName,
          phone: data.primaryDevoteePhone,
        },
        channel: "SMS",
        template: "BOOKING_CONFIRMED",
        params: {
          name: data.primaryDevoteeName,
          reference: data.bookingReference,
          service: data.serviceTitleHi,
          date: data.bookingDate,
          slot: data.slotTime,
          count: data.numberOfDevotees,
          ticketUrl: data.ticketUrl,
        },
      });
    } catch (err: any) {
      logger.error(`Notification failed for booking [${data.bookingReference}]: ${err?.message}`);
    }
  }

  /**
   * Dispatch payment receipt notification
   */
  static async sendPaymentReceipt(data: PaymentNotificationData) {
    try {
      const provider = getNotificationProvider();
      await provider.send({
        recipient: {
          name: data.devoteeName,
          phone: data.devoteePhone,
        },
        channel: "SMS",
        template: "PAYMENT_RECEIPT",
        params: {
          name: data.devoteeName,
          reference: data.paymentReference,
          amount: data.amountInRupees,
          receipt: data.receiptNumber || "",
        },
      });
    } catch (err: any) {
      logger.error(`Notification failed for payment [${data.paymentReference}]: ${err?.message}`);
    }
  }

  /**
   * Dispatch charitable donation receipt & gratitude notification
   */
  static async sendDonationReceipt(data: DonationNotificationData) {
    try {
      const provider = getNotificationProvider();
      await provider.send({
        recipient: {
          name: data.donorName,
          phone: data.donorPhone,
        },
        channel: "SMS",
        template: "DONATION_RECEIPT",
        params: {
          name: data.donorName,
          reference: data.donationReference,
          amount: data.amountInRupees,
          cause: data.causeTitle,
          receipt: data.receiptNumber || "",
        },
      });
    } catch (err: any) {
      logger.error(`Notification failed for donation [${data.donationReference}]: ${err?.message}`);
    }
  }

  /**
   * Dispatch booking cancellation notification
   */
  static async sendCancellationNotice(
    reference: string,
    name: string,
    phone: string,
    reason?: string
  ) {
    try {
      const provider = getNotificationProvider();
      await provider.send({
        recipient: { name, phone },
        channel: "SMS",
        template: "BOOKING_CANCELLED",
        params: {
          name,
          reference,
          reason: reason || "श्रद्धालु के अनुरोध पर (Devotee request)",
        },
      });
    } catch (err: any) {
      logger.error(`Notification failed for cancellation [${reference}]: ${err?.message}`);
    }
  }

  /**
   * Dispatch refund initiation notification
   */
  static async sendRefundNotice(
    reference: string,
    name: string,
    phone: string,
    amountInRupees: number
  ) {
    try {
      const provider = getNotificationProvider();
      await provider.send({
        recipient: { name, phone },
        channel: "SMS",
        template: "REFUND_INITIATED",
        params: {
          name,
          reference,
          amount: amountInRupees,
        },
      });
    } catch (err: any) {
      logger.error(`Notification failed for refund [${reference}]: ${err?.message}`);
    }
  }
}
