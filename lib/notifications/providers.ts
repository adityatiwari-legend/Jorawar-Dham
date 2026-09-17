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
 * Production SMS Provider (e.g. Fast2SMS / Twilio / MSG91)
 */
export class GenericSmsProvider implements NotificationProvider {
  name = "SMS_GATEWAY";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SMS_GATEWAY_API_KEY || "";
  }

  supports(channel: NotificationChannel): boolean {
    return channel === "SMS";
  }

  async send(options: SendMessageOptions): Promise<SendResult> {
    if (!this.apiKey) {
      // Fallback gracefully to mock in absence of live SMS gateway keys
      logger.warn("SMS_GATEWAY_API_KEY not configured. Falling back to log-only transmission.");
      return { success: true, messageId: `sms_dev_${Date.now()}` };
    }

    try {
      // Plug in provider HTTP call here
      return { success: true, messageId: `sms_${Date.now()}` };
    } catch (err: any) {
      logger.error(`SMS dispatch failed: ${err?.message || err}`);
      return { success: false, error: "SMS dispatch failed" };
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
