import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger/logger";
import { BookingStatus } from "@prisma/client";

/**
 * Sweeps and marks expired pending holds
 */
export async function sweepExpiredBookings(): Promise<{ expiredCount: number }> {
  const now = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      bookingStatus: BookingStatus.PENDING_PAYMENT,
      expiresAt: { lt: now },
    },
    data: {
      bookingStatus: BookingStatus.EXPIRED,
    },
  });

  if (result.count > 0) {
    logger.info(`Expired ${result.count} uncompleted pending booking holds`);
  }

  return { expiredCount: result.count };
}
