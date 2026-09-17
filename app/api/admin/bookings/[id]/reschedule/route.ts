import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { AuditAction, ActorType } from "@prisma/client";
import { z } from "zod";

const rescheduleSchema = z.object({
  newSlotId: z.string().uuid(),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(300),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "प्रशासन लॉगिन आवश्यक है" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "अमान्य पुनर्समय विवरण" }, { status: 400 });
    }

    const { newSlotId, newDate, reason } = parsed.data;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "बुकिंग उपलब्ध नहीं है" }, { status: 404 });
    }

    if (booking.bookingStatus !== "CONFIRMED") {
      return NextResponse.json(
        { success: false, error: `केवल स्वीकृत (CONFIRMED) बुकिंग को ही पुनर्निर्धारित किया जा सकता है (Current: ${booking.bookingStatus})` },
        { status: 400 }
      );
    }

    const targetDate = new Date(`${newDate}T00:00:00.000Z`);

    // Check capacity of target slot within transaction
    await prisma.$transaction(async (tx) => {
      // Row lock on target slot
      const [slot] = await tx.$queryRaw<any[]>`
        SELECT * FROM "service_slots"
        WHERE "id" = ${newSlotId}
        FOR UPDATE;
      `;

      if (!slot) {
        throw new Error("नया स्लॉट उपलब्ध नहीं है");
      }

      // Check allocated seats
      const allocatedAgg = await tx.booking.aggregate({
        where: {
          slotId: newSlotId,
          bookingDate: targetDate,
          bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "PENDING_PAYMENT"] },
        },
        _sum: { numberOfDevotees: true },
      });

      const currentlyAllocated = allocatedAgg._sum.numberOfDevotees || 0;
      if (currentlyAllocated + booking.numberOfDevotees > slot.capacity) {
        throw new Error(
          `चयनित नए स्लॉट में पर्याप्त स्थान उपलब्ध नहीं है (Available: ${Math.max(
            0,
            slot.capacity - currentlyAllocated
          )})`
        );
      }

      // Update booking
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          slotId: newSlotId,
          bookingDate: targetDate,
        },
      });

      // Audit record
      await tx.auditLog.create({
        data: {
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          actorEmail: admin.email,
          action: AuditAction.UPDATE,
          entity: "BOOKING_RESCHEDULE",
          entityId: booking.id,
          details: {
            bookingReference: booking.bookingReference,
            oldDate: booking.bookingDate.toISOString().split("T")[0],
            newDate,
            oldSlot: booking.slot.startTime,
            rescheduledBy: admin.email,
            reason,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "बुकिंग समय सफलतापूर्वक पुनर्निर्धारित (Rescheduled successfully)",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "पुनर्निर्धारण प्रक्रिया में त्रुटि" },
      { status: 500 }
    );
  }
}
