import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdminAuth } from "@/lib/auth/guard";
import { pageSectionSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/auth/audit";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { AuditAction, ActorType } from "@prisma/client";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, ["content:read"]);
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const page = await prisma.page.findUnique({
        where: { slug },
        include: { sections: { orderBy: { sortOrder: "asc" } } },
      });
      return NextResponse.json({ success: true, data: page });
    }

    const pages = await prisma.page.findMany({
      include: { sections: { orderBy: { sortOrder: "asc" } } },
      orderBy: { slug: "asc" },
    });

    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    return errorResponse(error, "admin_content_get");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["content:write"]);
    const body = await req.json();

    if (!body.id) {
      throw new AppError("Section ID is required", "MISSING_ID", 400);
    }

    const parsed = pageSectionSchema.parse(body);

    const updated = await prisma.pageSection.update({
      where: { id: body.id },
      data: {
        titleHi: parsed.titleHi,
        titleEn: parsed.titleEn,
        subtitleHi: parsed.subtitleHi,
        subtitleEn: parsed.subtitleEn,
        contentHi: parsed.contentHi,
        contentEn: parsed.contentEn,
        mediaUrl: parsed.mediaUrl,
        sortOrder: parsed.sortOrder,
      },
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.UPDATE,
      entity: "PageSection",
      entityId: updated.id,
      details: { sectionKey: updated.sectionKey, titleEn: updated.titleEn },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return errorResponse(error, "admin_content_put");
  }
}
