import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getPaymentGateway } from "@/lib/payment/gateway";
import { rateLimiter } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/headers";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { z } from "zod";
import crypto from "crypto";

const createDonationSchema = z.object({
  causeId: z.string().uuid().optional().nullable(),
  amountInRupees: z.number().int().min(10, "न्यूनतम दान राशि ₹10 है").max(10000000, "अधिकतम दान राशि सीमा ₹1,00,00,000 है"),
  donorName: z.string().min(2, "कृपया मान्य नाम दर्ज करें").max(150),
  donorPhone: z.string().regex(/^[6-9]\d{9}$/, "10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें"),
  donorEmail: z.string().email().optional().or(z.literal("")),
  donorPan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "मान्य 10 अक्षरों का पैन (PAN) नंबर दर्ज करें")
    .optional()
    .or(z.literal("")),
  donorAddress: z.string().max(300).optional().or(z.literal("")),
  donorCity: z.string().max(100).optional().or(z.literal("")),
  donorState: z.string().max(100).optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal("")),
});

function generateDonationReference(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DON-${yearMonth}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimiter.limit(`donations_create:${ip}`, 10, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "अत्यधिक अनुरोध। कृपया कुछ समय पश्चात पुनः प्रयास करें।" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createDonationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "अमान्य दान विवरण" },
        { status: 400 }
      );
    }

    const {
      causeId,
      amountInRupees,
      donorName,
      donorPhone,
      donorEmail,
      donorPan,
      donorAddress,
      donorCity,
      donorState,
      isAnonymous,
      notes,
    } = parsed.data;

    // Check if cause exists if provided
    let causeTitle = "सामान्य धर्मार्थ सेवा (General Dham Seva)";
    if (causeId) {
      const cause = await prisma.donationCause.findUnique({
        where: { id: causeId },
      });
      if (!cause || !cause.isActive) {
        return NextResponse.json(
          { success: false, error: "चयनित दान प्रकल्प सक्रिय नहीं है" },
          { status: 400 }
        );
      }
      causeTitle = cause.titleHi;
    }

    // Optional devotee session
    const devotee = await getAuthenticatedDevotee();

    // Integer paise conversion: 100% server calculated
    const amountInPaise = amountInRupees * 100;
    const donationReference = generateDonationReference();

    // Create donation record in PENDING state
    const donation = await prisma.donation.create({
      data: {
        donationReference,
        userId: devotee?.id || null,
        causeId: causeId || null,
        donorName: isAnonymous ? "गोपनीय श्रद्धालु (Anonymous Devotee)" : donorName,
        donorPhone,
        donorEmail: donorEmail || null,
        donorPan: donorPan ? donorPan.toUpperCase() : null,
        donorAddress: donorAddress || null,
        donorCity: donorCity || null,
        donorState: donorState || null,
        amountInPaise,
        status: "PENDING",
        isAnonymous,
        notes: notes || null,
      },
    });

    // Initialize Gateway Order (Razorpay / Mock)
    const gateway = getPaymentGateway();
    const order = await gateway.createOrder({
      amountInPaise,
      currency: "INR",
      receipt: donationReference,
      notes: {
        donationReference,
        causeTitle,
        donorPhone,
      },
    });

    // Save gateway order ID
    await prisma.donation.update({
      where: { id: donation.id },
      data: { gatewayOrderId: order.orderId },
    });

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      donationReference,
      amountInPaise,
      amountInRupees,
      gatewayOrderId: order.orderId,
      keyId: order.keyId,
      currency: order.currency,
      isMock: order.isMock,
      donorName: donation.donorName,
      donorPhone,
      donorEmail: donation.donorEmail,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "दान आदेश निर्माण में त्रुटि" },
      { status: 500 }
    );
  }
}
