import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdminAuth } from "@/lib/auth/guard";
import { noticeSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/auth/audit";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { AuditAction, ActorType } from "@prisma/client";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, ["notices:read"]);

    const notices = await prisma.notice.findMany({
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: notices });
  } catch (error) {
    return errorResponse(error, "admin_notices_get");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["notices:write"]);
    const body = await req.json();
    const parsed = noticeSchema.parse(body);

    const notice = await prisma.notice.create({
      data: {
        titleHi: parsed.titleHi,
        titleEn: parsed.titleEn,
        bodyHi: parsed.bodyHi,
        bodyEn: parsed.bodyEn,
        priority: parsed.priority,
        isPinned: parsed.isPinned,
        isActive: parsed.isActive,
        publishedAt: parsed.publishedAt,
        expiresAt: parsed.expiresAt,
      },
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.CREATE,
      entity: "Notice",
      entityId: notice.id,
      details: { titleEn: notice.titleEn, priority: notice.priority },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, data: notice }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "admin_notices_post");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["notices:write"]);
    const body = await req.json();

    if (!body.id) {
      throw new AppError("Notice ID is required for update", "MISSING_ID", 400);
    }

    const parsed = noticeSchema.parse(body);

    const updated = await prisma.notice.update({
      where: { id: body.id },
      data: {
        titleHi: parsed.titleHi,
        titleEn: parsed.titleEn,
        bodyHi: parsed.bodyHi,
        bodyEn: parsed.bodyEn,
        priority: parsed.priority,
        isPinned: parsed.isPinned,
        isActive: parsed.isActive,
        publishedAt: parsed.publishedAt,
        expiresAt: parsed.expiresAt,
      },
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.UPDATE,
      entity: "Notice",
      entityId: updated.id,
      details: { titleEn: updated.titleEn, priority: updated.priority },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return errorResponse(error, "admin_notices_put");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["notices:write"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new AppError("Notice ID is required", "MISSING_ID", 400);
    }

    const deleted = await prisma.notice.delete({
      where: { id },
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.DELETE,
      entity: "Notice",
      entityId: id,
      details: { titleEn: deleted.titleEn },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    return errorResponse(error, "admin_notices_delete");
  }
}
