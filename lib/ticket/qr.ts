import QRCode from "qrcode";
import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger/logger";
import { BookingStatus } from "@prisma/client";

/**
 * Generates an SVG or Data URI QR code for a booking
 * Embeds ONLY an opaque token + reference; NO sensitive PII
 */
export async function generateBookingQrDataUri(
  bookingReference: string,
  qrSecurityToken: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jorawardham.org";
  // Secure opaque verification URL
  const verificationPayload = `${baseUrl}/ticket/verify?ref=${encodeURIComponent(
    bookingReference
  )}&token=${encodeURIComponent(qrSecurityToken)}`;

  return await QRCode.toDataURL(verificationPayload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#881337", // Devotional sacred maroon
      light: "#FFFFFF",
    },
  });
}

export interface TicketVerificationResult {
  valid: boolean;
  status: BookingStatus;
  message: string;
  booking?: {
    id: string;
    bookingReference: string;
    serviceNameHi: string;
    serviceNameEn: string;
    slotTime: string;
    bookingDate: string;
    numberOfDevotees: number;
    primaryDevoteeName: string;
    checkedInAt: Date | null;
  };
}

/**
 * Verifies QR ticket authenticity and prevents replay / double check-in
 */
export async function verifyTicketQr(
  bookingReference: string,
  qrSecurityToken: string
): Promise<TicketVerificationResult> {
  if (!bookingReference || !qrSecurityToken) {
    return { valid: false, status: "CANCELLED", message: "अमान्य क्यूआर कोड (Missing token or reference)" };
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: {
      service: true,
      slot: true,
    },
  });

  if (!booking) {
    return { valid: false, status: "CANCELLED", message: "टिकट रिकॉर्ड उपलब्ध नहीं है (Booking not found)" };
  }

  // Verify opaque cryptographic security token
  if (booking.qrSecurityToken !== qrSecurityToken) {
    logger.warn(`Security alert: invalid QR token used for booking [${bookingReference}]`);
    return { valid: false, status: booking.bookingStatus, message: "अवैध सुरक्षा टोकन (Invalid QR security token)" };
  }

  // Check if ticket is already checked in (Prevents replay / double entry)
  if (booking.bookingStatus === BookingStatus.CHECKED_IN) {
    const checkedInTimeStr = booking.checkedInAt
      ? new Intl.DateTimeFormat("hi-IN", { timeStyle: "medium" }).format(booking.checkedInAt)
      : "";
    return {
      valid: false,
      status: BookingStatus.CHECKED_IN,
      message: `यह टिकट पूर्व में ही सत्यापित हो चुका है! (Already checked-in at ${checkedInTimeStr})`,
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        serviceNameHi: booking.service.titleHi,
        serviceNameEn: booking.service.titleEn,
        slotTime: `${booking.slot.startTime} - ${booking.slot.endTime}`,
        bookingDate: booking.bookingDate.toISOString().split("T")[0],
        numberOfDevotees: booking.numberOfDevotees,
        primaryDevoteeName: booking.primaryDevoteeName,
        checkedInAt: booking.checkedInAt,
      },
    };
  }

  // Check if booking is in CONFIRMED state
  if (booking.bookingStatus !== BookingStatus.CONFIRMED) {
    return {
      valid: false,
      status: booking.bookingStatus,
      message: `टिकट की स्थिति मान्य नहीं है: ${booking.bookingStatus} (Invalid booking status)`,
    };
  }

  return {
    valid: true,
    status: BookingStatus.CONFIRMED,
    message: "प्रवेश मान्य (Valid for Entry)",
    booking: {
      id: booking.id,
      bookingReference: booking.bookingReference,
      serviceNameHi: booking.service.titleHi,
      serviceNameEn: booking.service.titleEn,
      slotTime: `${booking.slot.startTime} - ${booking.slot.endTime}`,
      bookingDate: booking.bookingDate.toISOString().split("T")[0],
      numberOfDevotees: booking.numberOfDevotees,
      primaryDevoteeName: booking.primaryDevoteeName,
      checkedInAt: null,
    },
  };
}
