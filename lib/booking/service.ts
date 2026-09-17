import crypto from "crypto";
import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger/logger";
import { Booking, BookingStatus, ServiceSlot } from "@prisma/client";

export const BOOKING_HOLD_MINUTES = 10;

export class CapacityExceededError extends Error {
  constructor(message = "चयनित समय स्लॉट में पर्याप्त सीटें उपलब्ध नहीं हैं (Insufficient slot capacity)") {
    super(message);
    this.name = "CapacityExceededError";
  }
}

export class SlotNotFoundError extends Error {
  constructor(message = "समय स्लॉट उपलब्ध नहीं है (Slot not found or inactive)") {
    super(message);
    this.name = "SlotNotFoundError";
  }
}

export class DateBlockedError extends Error {
  constructor(message = "यह तिथि दर्शन/पूजा हेतु अवरुद्ध है (Selected date is blocked)") {
    super(message);
    this.name = "DateBlockedError";
  }
}

/**
 * Generates an official unique booking reference code: JD-YYYYMM-XXXXXX
 */
export function generateBookingReference(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `JD-${yearMonth}-${randomSuffix}`;
}

/**
 * Generates an official unique receipt reference code: REC-YYYYMM-XXXXXX
 */
export function generateReceiptNumber(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REC-${yearMonth}-${randomSuffix}`;
}

/**
 * Generates an official unique payment reference code: PAY-YYYYMM-XXXXXX
 */
export function generatePaymentReference(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PAY-${yearMonth}-${randomSuffix}`;
}

/**
 * Masks phone number for safe public receipts (e.g. 98****3210)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return "****";
  return `${phone.slice(0, 2)}****${phone.slice(-4)}`;
}

export interface CreateBookingParams {
  userId: string;
  serviceId: string;
  slotId: string;
  bookingDate: Date | string; // YYYY-MM-DD
  numberOfDevotees: number;
  primaryDevoteeName: string;
  primaryDevoteePhone: string;
  devoteeDetails?: Array<{ name: string; age?: number; gender?: string }>;
}

/**
 * Concurrency-safe atomic booking creator
 * Enforces PostgreSQL row-level lock and capacity verification
 */
export async function createConcurrencySafeBooking(params: CreateBookingParams): Promise<Booking> {
  const {
    userId,
    serviceId,
    slotId,
    numberOfDevotees,
    primaryDevoteeName,
    primaryDevoteePhone,
    devoteeDetails,
  } = params;

  if (numberOfDevotees < 1 || numberOfDevotees > 20) {
    throw new Error("श्रद्धालुओं की संख्या 1 से 20 के मध्य होनी चाहिए (Devotee count must be between 1 and 20)");
  }

  // Normalize date to YYYY-MM-DD midnight UTC
  const parsedDate = typeof params.bookingDate === "string" ? new Date(params.bookingDate) : params.bookingDate;
  const normalizedDate = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));

  // Check if date is in past
  const todayUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  if (normalizedDate < todayUtc) {
    throw new Error("भूतकाल की तिथि के लिए बुकिंग संभव नहीं है (Cannot book past dates)");
  }

  // Check if date is blocked
  const isBlocked = await prisma.blockedDate.findFirst({
    where: {
      date: normalizedDate,
      OR: [{ serviceId: null }, { serviceId }],
    },
  });

  if (isBlocked) {
    throw new DateBlockedError();
  }

  // Execute interactive transaction with pessimistic row lock
  return await prisma.$transaction(
    async (tx) => {
      // 1. Acquire PostgreSQL exclusive row-level lock on the ServiceSlot
      // This forces any concurrent booking transactions for this slot to queue sequentially
      const lockedSlots = await tx.$queryRaw<ServiceSlot[]>`
        SELECT * FROM "service_slots"
        WHERE "id" = ${slotId} AND "serviceId" = ${serviceId} AND "isActive" = true
        FOR UPDATE
      `;

      if (!lockedSlots || lockedSlots.length === 0) {
        throw new SlotNotFoundError();
      }

      const slot = lockedSlots[0];

      // 2. Count already allocated capacity for this slot on this specific date
      // Count CONFIRMED, CHECKED_IN, PAYMENT_PROCESSING, and non-expired PENDING_PAYMENT holds
      const activeBookings = await tx.booking.aggregate({
        _sum: { numberOfDevotees: true },
        where: {
          slotId,
          bookingDate: normalizedDate,
          OR: [
            { bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PAYMENT_PROCESSING] } },
            {
              bookingStatus: BookingStatus.PENDING_PAYMENT,
              expiresAt: { gt: new Date() },
            },
          ],
        },
      });

      const currentAllocated = activeBookings._sum.numberOfDevotees || 0;
      const availableSeats = slot.capacity - currentAllocated;

      if (availableSeats < numberOfDevotees) {
        throw new CapacityExceededError(
          `उपलब्ध सीटें अपर्याप्त हैं। शेष उपलब्ध सीटें: ${Math.max(0, availableSeats)} (Only ${Math.max(0, availableSeats)} seats available)`
        );
      }

      // 3. 100% Server-side price calculation
      const pricePerSeat = slot.priceInPaise > 0 ? slot.priceInPaise : 0;
      const totalAmountInPaise = pricePerSeat * numberOfDevotees;

      // 4. Generate identifiers
      const bookingReference = generateBookingReference();
      const qrSecurityToken = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000);

      // Free services (e.g. Free Darshan / Free Aartis) are confirmed immediately without payment step
      const isFreeService = totalAmountInPaise === 0;
      const initialStatus = isFreeService ? BookingStatus.CONFIRMED : BookingStatus.PENDING_PAYMENT;

      const booking = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          serviceId,
          slotId,
          bookingDate: normalizedDate,
          numberOfDevotees,
          primaryDevoteeName,
          primaryDevoteePhone,
          devoteeDetails: devoteeDetails || [],
          totalAmountInPaise,
          bookingStatus: initialStatus,
          qrSecurityToken,
          expiresAt,
        },
        include: {
          service: true,
          slot: true,
        },
      });

      // If free, generate immediate receipt
      if (isFreeService) {
        const paymentReference = generatePaymentReference();
        const payment = await tx.payment.create({
          data: {
            paymentReference,
            bookingId: booking.id,
            userId,
            gateway: "CASH_COUNTER",
            amountInPaise: 0,
            status: "PAID",
            paidAt: new Date(),
          },
        });

        await tx.receipt.create({
          data: {
            receiptNumber: generateReceiptNumber(),
            bookingId: booking.id,
            paymentId: payment.id,
            amountInPaise: 0,
            devoteeName: primaryDevoteeName,
            maskedPhone: maskPhoneNumber(primaryDevoteePhone),
            serviceTitleHi: booking.service.titleHi,
            serviceTitleEn: booking.service.titleEn,
          },
        });
      }

      logger.info(`Booking created [${booking.bookingReference}] status: ${booking.bookingStatus} for user: ${userId}`);

      return booking;
    },
    {
      // Set transactional isolation level and timeout
      timeout: 10000,
    }
  );
}
