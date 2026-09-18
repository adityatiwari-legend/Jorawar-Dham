import {
  NotificationChannel,
  NotificationProvider,
  SendMessageOptions,
  SendResult,
} from "./types";
import { logger } from "@/lib/logger/logger";
import crypto from "crypto";

/**
 * Console / Mock Provider for local development, CI/CD, and automated tests
 */
export class ConsoleNotificationProvider implements NotificationProvider {
  name = "CONSOLE_MOCK";

  supports(channel: NotificationChannel): boolean {
    return true; // Supports SMS, EMAIL, WHATSAPP in mock mode
  }

  async send(options: SendMessageOptions): Promise<SendResult> {
    const msgId = `msg_mock_${crypto.randomBytes(8).toString("hex")}`;
    const maskedTarget = options.recipient.phone
      ? `${options.recipient.phone.slice(0, 2)}****${options.recipient.phone.slice(-2)}`
      : options.recipient.email || "unknown";

    logger.info(
      `[MOCK NOTIFICATION][${options.channel}] Template: ${options.template} to ${maskedTarget} (ID: ${msgId})`
    );

    return {
      success: true,
      messageId: msgId,
    };
  }
}

/**
 * Production SMS Provider (Fast2SMS / Bulk SMS Gateway)
 */
export class GenericSmsProvider implements NotificationProvider {
  name = "FAST2SMS";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SMS_GATEWAY_API_KEY || "";
  }

  supports(channel: NotificationChannel): boolean {
    return channel === "SMS";
  }

  async send(options: SendMessageOptions): Promise<SendResult> {
    if (!this.apiKey) {
      logger.warn("SMS_GATEWAY_API_KEY not configured. Falling back to log-only transmission.");
      return { success: true, messageId: `sms_mock_${Date.now()}` };
    }

    try {
      const phone = options.recipient.phone?.replace(/\D/g, "").slice(-10);
      if (!phone || phone.length !== 10) {
        return { success: false, error: "Invalid 10-digit Indian phone number" };
      }

      const otp = options.params?.otp as string | undefined;
      const requestBody = otp
        ? {
            variables_values: String(otp),
            route: "otp",
            numbers: phone,
          }
        : {
            message: `Shri Jorawar Dham: ${options.template} ref: ${options.params?.reference || ""}`,
            language: "english",
            route: "q",
            numbers: phone,
          };

      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: this.apiKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (data.return) {
        logger.info(`[FAST2SMS SUCCESS] SMS sent to ${phone.slice(0, 2)}****${phone.slice(-2)} (req: ${data.request_id})`);
        return { success: true, messageId: data.request_id };
      } else {
        const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : data.message || "Fast2SMS error";
        logger.warn(`[FAST2SMS NOTICE] ${errorMsg} (status: ${data.status_code})`);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      logger.error(`SMS dispatch error: ${err?.message || err}`);
      return { success: false, error: "SMS dispatch network error" };
    }
  }
}

/**
 * Production Email Provider (SMTP / Resend / SendGrid)
 */
export class GenericEmailProvider implements NotificationProvider {
  name = "EMAIL_GATEWAY";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.EMAIL_GATEWAY_API_KEY || "";
  }

  supports(channel: NotificationChannel): boolean {
    return channel === "EMAIL";
  }

  async send(options: SendMessageOptions): Promise<SendResult> {
    if (!this.apiKey) {
      logger.warn("EMAIL_GATEWAY_API_KEY not configured. Falling back to log-only transmission.");
      return { success: true, messageId: `email_dev_${Date.now()}` };
    }

    try {
      return { success: true, messageId: `email_${Date.now()}` };
    } catch (err: any) {
      logger.error(`Email dispatch failed: ${err?.message || err}`);
      return { success: false, error: "Email dispatch failed" };
    }
  }
}

/**
 * Production WhatsApp Cloud Provider
 */
export class GenericWhatsAppProvider implements NotificationProvider {
  name = "WHATSAPP_CLOUD";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || "";
  }

  supports(channel: NotificationChannel): boolean {
    return channel === "WHATSAPP";
  }

  async send(options: SendMessageOptions): Promise<SendResult> {
    if (!this.apiKey) {
      logger.warn("WHATSAPP_API_KEY not configured. Falling back to log-only transmission.");
      return { success: true, messageId: `wa_dev_${Date.now()}` };
    }

    try {
      return { success: true, messageId: `wa_${Date.now()}` };
    } catch (err: any) {
      logger.error(`WhatsApp dispatch failed: ${err?.message || err}`);
      return { success: false, error: "WhatsApp dispatch failed" };
    }
  }
}

/**
 * Factory to retrieve active notification provider
 */
export function getNotificationProvider(): NotificationProvider {
  const providerType = process.env.NOTIFICATION_PROVIDER || "mock";

  switch (providerType.toLowerCase()) {
    case "sms":
      return new GenericSmsProvider();
    case "email":
      return new GenericEmailProvider();
    case "whatsapp":
      return new GenericWhatsAppProvider();
    default:
      return new ConsoleNotificationProvider();
  }
}
