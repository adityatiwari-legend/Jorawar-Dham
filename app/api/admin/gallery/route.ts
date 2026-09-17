import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdminAuth } from "@/lib/auth/guard";
import { galleryItemSchema } from "@/lib/validation/schemas";
import { storage } from "@/lib/storage/local";
import { logAuditEvent } from "@/lib/auth/audit";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { AuditAction, ActorType } from "@prisma/client";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, ["gallery:read"]);

    const categories = await prisma.galleryCategory.findMany({
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return errorResponse(error, "admin_gallery_get");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["gallery:write"]);
    const body = await req.json();
    const parsed = galleryItemSchema.parse(body);

    const item = await prisma.galleryItem.create({
      data: parsed,
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.CREATE,
      entity: "GalleryItem",
      entityId: item.id,
      details: { titleEn: item.titleEn, fileKey: item.fileKey },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "admin_gallery_post");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["gallery:write"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new AppError("Item ID is required", "MISSING_ID", 400);
    }

    const item = await prisma.galleryItem.findUnique({ where: { id } });
    if (!item) {
      throw new AppError("Gallery item not found", "NOT_FOUND", 404);
    }

    // Delete physical file from storage
    await storage.delete(item.fileKey);

    // Delete database record
    await prisma.galleryItem.delete({ where: { id } });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.DELETE,
      entity: "GalleryItem",
      entityId: id,
      details: { fileKey: item.fileKey },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, message: "Gallery item deleted" });
  } catch (error) {
    return errorResponse(error, "admin_gallery_delete");
  }
}
