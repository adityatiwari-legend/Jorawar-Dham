import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdminAuth } from "@/lib/auth/guard";
import { eventSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/auth/audit";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { AuditAction, ActorType } from "@prisma/client";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, ["events:read"]);

    const events = await prisma.event.findMany({
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    return errorResponse(error, "admin_events_get");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["events:write"]);
    const body = await req.json();
    const parsed = eventSchema.parse(body);

    const event = await prisma.event.create({
      data: parsed,
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.CREATE,
      entity: "Event",
      entityId: event.id,
      details: { slug: event.slug, titleEn: event.titleEn },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "admin_events_post");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["events:write"]);
    const body = await req.json();

    if (!body.id) {
      throw new AppError("Event ID is required for update", "MISSING_ID", 400);
    }

    const parsed = eventSchema.parse(body);

    const updated = await prisma.event.update({
      where: { id: body.id },
      data: parsed,
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.UPDATE,
      entity: "Event",
      entityId: updated.id,
      details: { slug: updated.slug, titleEn: updated.titleEn },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return errorResponse(error, "admin_events_put");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["events:write"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new AppError("Event ID is required", "MISSING_ID", 400);
    }

    const deleted = await prisma.event.delete({ where: { id } });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.DELETE,
      entity: "Event",
      entityId: id,
      details: { slug: deleted.slug, titleEn: deleted.titleEn },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    return errorResponse(error, "admin_events_delete");
  }
}
