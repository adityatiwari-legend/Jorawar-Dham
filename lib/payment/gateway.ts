import crypto from "crypto";
import { logger } from "@/lib/logger/logger";

export interface CreateOrderParams {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  orderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
  isMock: boolean;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface VerifyWebhookParams {
  rawBody: string;
  signature: string;
  secret?: string;
}

export interface PaymentGatewayProvider {
  name: string;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPaymentSignature(params: VerifySignatureParams): boolean;
  verifyWebhookSignature(params: VerifyWebhookParams): boolean;
  processRefund(params: { paymentId: string; amountInPaise: number; reason?: string }): Promise<{ refundId: string; status: string }>;
}

/**
 * Standard Indian Gateway Provider: Razorpay implementation
 */
class RazorpayGatewayProvider implements PaymentGatewayProvider {
  name = "RAZORPAY";
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.keyId || !this.keySecret) {
      throw new Error("Razorpay credentials missing in environment");
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: params.amountInPaise,
        currency: params.currency || "INR",
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Razorpay order creation failed: ${errorText}`);
      throw new Error("Failed to create payment order with gateway");
    }

    const data = await response.json();
    return {
      orderId: data.id,
      amountInPaise: data.amount,
      currency: data.currency,
      keyId: this.keyId,
      isMock: false,
    };
  }

  verifyPaymentSignature(params: VerifySignatureParams): boolean {
    const { orderId, paymentId, signature } = params;
    if (!orderId || !paymentId || !signature || !this.keySecret) return false;

    try {
      const generatedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      return crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(params: VerifyWebhookParams): boolean {
    const { rawBody, signature, secret } = params;
    const webhookSecret = secret || this.webhookSecret;
    if (!rawBody || !signature || !webhookSecret) return false;

    try {
      const generatedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      return crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async processRefund(params: { paymentId: string; amountInPaise: number; reason?: string }): Promise<{ refundId: string; status: string }> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const response = await fetch(`https://api.razorpay.com/v1/payments/${params.paymentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: params.amountInPaise,
        notes: { reason: params.reason || "Devotee cancellation" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error(`Razorpay refund failed: ${err}`);
      throw new Error("Gateway refund processing failed");
    }

    const data = await response.json();
    return {
      refundId: data.id,
      status: data.status || "SUCCESS",
    };
  }
}

/**
 * Mock Gateway Provider for automated test suites and local environments
 */
export class MockGatewayProvider implements PaymentGatewayProvider {
  name = "MOCK";
  private secret = "mock_jorawar_dham_gateway_secret_2026";

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const orderId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
    return {
      orderId,
      amountInPaise: params.amountInPaise,
      currency: params.currency || "INR",
      keyId: "rzp_mock_test_key_jorawardham",
      isMock: true,
    };
  }

  generateTestSignature(orderId: string, paymentId: string): string {
    return crypto
      .createHmac("sha256", this.secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
  }

  verifyPaymentSignature(params: VerifySignatureParams): boolean {
    const { orderId, paymentId, signature } = params;
    if (!orderId || !paymentId || !signature) return false;

    try {
      const generated = this.generateTestSignature(orderId, paymentId);
      return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(params: VerifyWebhookParams): boolean {
    const { rawBody, signature, secret } = params;
    const webhookSecret = secret || this.secret;
    try {
      const generated = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async processRefund(params: { paymentId: string; amountInPaise: number; reason?: string }): Promise<{ refundId: string; status: string }> {
    const refundId = `rfnd_mock_${crypto.randomBytes(8).toString("hex")}`;
    return { refundId, status: "SUCCESS" };
  }
}

/**
 * Get active payment gateway provider based on environment
 */
export function getPaymentGateway(): PaymentGatewayProvider {
  const providerType = (process.env.PAYMENT_GATEWAY_PROVIDER || "").trim().toLowerCase();

  // Explicitly forced mock mode for automated test suites
  if (providerType === "mock") {
    return new MockGatewayProvider();
  }

  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

  // Detect valid Razorpay key formats (rzp_test_... or rzp_live_...) with non-placeholder secret
  const hasValidRazorpayKeys =
    (keyId.startsWith("rzp_test_") || keyId.startsWith("rzp_live_")) &&
    keySecret.length >= 8 &&
    !keySecret.includes("placeholder");

  if (providerType === "razorpay" || hasValidRazorpayKeys) {
    if (!hasValidRazorpayKeys) {
      logger.error(
        "PAYMENT_GATEWAY_PROVIDER is set to 'razorpay' but RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing or contains placeholder values. Check .env."
      );
      throw new Error(
        "Razorpay credentials missing or invalid in environment. Refusing to initialize gateway with placeholder credentials."
      );
    }
    return new RazorpayGatewayProvider();
  }

  return new MockGatewayProvider();
}
