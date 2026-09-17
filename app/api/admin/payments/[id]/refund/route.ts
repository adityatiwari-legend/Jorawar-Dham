import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { NotificationService } from "@/lib/notifications/service";
import { AuditAction, ActorType } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

const refundSchema = z.object({
  reason: z.string().min(5, "रिफंड का कारण अनिवार्य है (Reason is required)").max(500),
  amountInRupees: z.number().int().min(1).optional(),
});

function generateRefundReference(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REF-${yearMonth}-${randomSuffix}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    // Role check: Only FINANCE_ADMIN or SUPER_ADMIN
    if (!admin.isSuperAdmin && !admin.roles.includes("FINANCE_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "रिफंड जारी करने हेतु वित्त अधिकार आवश्यक है (Finance permission required)" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = refundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "अमान्य रिफंड अनुरोध" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: "भुगतान रिकॉर्ड उपलब्ध नहीं है" }, { status: 404 });
    }

    if (payment.status !== "PAID" && payment.status !== "REFUND_PENDING") {
      return NextResponse.json(
        { success: false, error: `केवल PAID अथवा REFUND_PENDING स्थिति के भुगतानों पर ही रिफंड संभव है (Current: ${payment.status})` },
        { status: 400 }
      );
    }

    const refundAmountInPaise = parsed.data.amountInRupees
      ? parsed.data.amountInRupees * 100
      : payment.amountInPaise;

    if (refundAmountInPaise > payment.amountInPaise) {
      return NextResponse.json(
        { success: false, error: "रिफंड राशि मूल भुगतान राशि से अधिक नहीं हो सकती" },
        { status: 400 }
      );
    }

    // Process Gateway Refund
    const gateway = getPaymentGateway();
    let gatewayRefundId: string | undefined;
    try {
      if (payment.gatewayPaymentId) {
        const refundRes = await gateway.processRefund({
          paymentId: payment.gatewayPaymentId,
          amountInPaise: refundAmountInPaise,
          reason: parsed.data.reason,
        });
        gatewayRefundId = refundRes.refundId;
      }
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: `गेटवे रिफंड विफल: ${err.message || "Gateway error"}` },
        { status: 502 }
      );
    }

    const refundRef = generateRefundReference();
    const now = new Date();

    // Transactional status update & audit record
    await prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          refundReference: refundRef,
          paymentId: payment.id,
          bookingId: payment.bookingId,
          gatewayRefundId: gatewayRefundId || `rfnd_${Date.now()}`,
          amountInPaise: refundAmountInPaise,
          reason: parsed.data.reason,
          status: "SUCCESS",
          processedByAdminId: admin.id,
          processedAt: now,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { bookingStatus: "REFUNDED" },
      });

      await tx.auditLog.create({
        data: {
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          actorEmail: admin.email,
          action: AuditAction.UPDATE,
          entity: "PAYMENT_REFUND",
          entityId: payment.id,
          details: {
            refundReference: refundRef,
            amountInPaise: refundAmountInPaise,
            reason: parsed.data.reason,
            gatewayRefundId,
            processedBy: admin.email,
          },
        },
      });
    });

    // Notify devotee
    if (payment.booking) {
      NotificationService.sendRefundNotice(
        payment.booking.bookingReference,
        payment.booking.primaryDevoteeName,
        payment.booking.primaryDevoteePhone,
        Math.round(refundAmountInPaise / 100)
      );
    }

    return NextResponse.json({
      success: true,
      message: "रिफंड सफलतापूर्वक स्वीकृत एवं जारी कर दिया गया है। (Refund processed successfully)",
      refundReference: refundRef,
      amountInRupees: Math.round(refundAmountInPaise / 100),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "रिफंड प्रक्रिया में त्रुटि" },
      { status: 500 }
    );
  }
}
