import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { NotificationService } from "@/lib/notifications/service";
import { z } from "zod";
import crypto from "crypto";

const verifyDonationSchema = z.object({
  donationId: z.string().uuid(),
  orderId: z.string().min(5),
  paymentId: z.string().min(5),
  signature: z.string().min(10),
});

function generateDonationReceiptNumber(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REC-DON-${yearMonth}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyDonationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "अमान्य भुगतान सत्यापन डेटा" }, { status: 400 });
    }

    const { donationId, orderId, paymentId, signature } = parsed.data;

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { cause: true },
    });

    if (!donation) {
      return NextResponse.json({ success: false, error: "दान रिकॉर्ड उपलब्ध नहीं है" }, { status: 404 });
    }

    // Idempotency: if already paid, return receipt without re-processing
    if (donation.status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "दान पूर्व में ही सत्यापित हो चुका है (Already verified)",
        receiptNumber: donation.receiptNumber,
        donationReference: donation.donationReference,
        amountInRupees: Math.round(donation.amountInPaise / 100),
      });
    }

    // Gateway HMAC signature verification
    const gateway = getPaymentGateway();
    const isValidSignature = gateway.verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        { success: false, error: "भुगतान हस्ताक्षर सत्यापन विफल। (Invalid payment signature)" },
        { status: 400 }
      );
    }

    const receiptNumber = generateDonationReceiptNumber();
    const now = new Date();

    // Transactional status transition and cause total increment
    const updated = await prisma.$transaction(async (tx) => {
      const updatedDonation = await tx.donation.update({
        where: { id: donation.id },
        data: {
          status: "PAID",
          gatewayPaymentId: paymentId,
          gatewaySignature: signature,
          receiptNumber,
          receiptIssuedAt: now,
          paidAt: now,
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

      return updatedDonation;
    });

    // Dispatch acknowledgment notification (stripped of payment secrets)
    const causeTitle = donation.cause?.titleHi || "सामान्य धर्मार्थ सेवा";
    NotificationService.sendDonationReceipt({
      donationReference: updated.donationReference,
      amountInRupees: Math.round(updated.amountInPaise / 100),
      donorName: updated.donorName,
      donorPhone: updated.donorPhone,
      causeTitle,
      receiptNumber,
    });

    return NextResponse.json({
      success: true,
      message: "दान सफलतापूर्वक सत्यापित एवं रसीद जारी (Donation verified and receipt issued)",
      receiptNumber,
      donationReference: updated.donationReference,
      amountInRupees: Math.round(updated.amountInPaise / 100),
      causeTitle,
      paidAt: now.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "दान सत्यापन प्रक्रिया में त्रुटि" },
      { status: 500 }
    );
  }
}
