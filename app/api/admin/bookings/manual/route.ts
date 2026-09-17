import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { createConcurrencySafeBooking } from "@/lib/booking/service";
import { generateBookingQrDataUri } from "@/lib/ticket/qr";
import { BookingStatus, AuditAction, ActorType } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

const manualBookingSchema = z.object({
  serviceId: z.string().uuid(),
  slotId: z.string().uuid(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  primaryDevoteeName: z.string().min(2).max(150),
  primaryDevoteePhone: z.string().min(10).max(15),
  numberOfDevotees: z.number().int().min(1).max(20),
  isPaidAtCounter: z.boolean().default(true),
  notes: z.string().max(300).optional(),
});

function generateReceiptNumber(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REC-${yearMonth}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = manualBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "अमान्य इनपुट" },
        { status: 400 }
      );
    }

    const {
      serviceId,
      slotId,
      bookingDate,
      primaryDevoteeName,
      primaryDevoteePhone,
      numberOfDevotees,
      isPaidAtCounter,
      notes,
    } = parsed.data;

    // Find or create user for this phone
    let devotee = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: primaryDevoteePhone },
          { phone: `+91${primaryDevoteePhone.replace(/^\+91/, "")}` },
        ],
      },
    });

    if (!devotee) {
      devotee = await prisma.user.create({
        data: {
          phone: primaryDevoteePhone.startsWith("+91") ? primaryDevoteePhone : `+91${primaryDevoteePhone}`,
          fullName: primaryDevoteeName,
          isPhoneVerified: true, // Verified in-person at temple counter
        },
      });
    }

    // Use concurrency-safe booking creator
    const booking = await createConcurrencySafeBooking({
      serviceId,
      slotId,
      userId: devotee.id,
      bookingDate,
      primaryDevoteeName,
      primaryDevoteePhone,
      numberOfDevotees,
    });

    // Mark confirmed at counter
    const now = new Date();
    const receiptNumber = generateReceiptNumber();

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: BookingStatus.CONFIRMED,
        },
      });

      // Create counter cash payment record
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          userId: devotee.id,
          paymentReference: `PAY-CTR-${Date.now()}`,
          gateway: "CASH_COUNTER",
          amountInPaise: booking.totalAmountInPaise,
          status: "PAID",
          paidAt: now,
        },
      });

      // Create Receipt
      const service = await tx.service.findUnique({ where: { id: serviceId } });
      await tx.receipt.create({
        data: {
          bookingId: booking.id,
          paymentId: payment.id,
          receiptNumber,
          amountInPaise: booking.totalAmountInPaise,
          devoteeName: primaryDevoteeName,
          maskedPhone: `${primaryDevoteePhone.slice(0, 2)}****${primaryDevoteePhone.slice(-4)}`,
          serviceTitleHi: service?.titleHi || "दर्शन सेवा",
          serviceTitleEn: service?.titleEn || "Darshan Seva",
          issuedAt: now,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          actorEmail: admin.email,
          action: AuditAction.CREATE,
          entity: "MANUAL_COUNTER_BOOKING",
          entityId: booking.id,
          details: {
            bookingReference: booking.bookingReference,
            receiptNumber,
            devoteeName: primaryDevoteeName,
            createdByStaff: admin.email,
            notes,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "काउंटर बुकिंग सफलतापूर्वक संपन्न",
      bookingReference: booking.bookingReference,
      receiptNumber,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "काउंटर बुकिंग निर्माण में त्रुटि" },
      { status: 500 }
    );
  }
}
