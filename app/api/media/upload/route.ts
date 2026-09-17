import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { storage } from "@/lib/storage/local";
import { logAuditEvent } from "@/lib/auth/audit";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { AuditAction, ActorType } from "@prisma/client";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["gallery:write"]);
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new AppError("No valid file provided in upload request", "FILE_REQUIRED", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await storage.upload(buffer, {
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: buffer.length,
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.CREATE,
      entity: "MediaFile",
      entityId: result.fileKey,
      details: {
        originalFilename: result.originalFilename,
        sizeBytes: result.sizeBytes,
        mimeType: result.mimeType,
      },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return errorResponse(error, "media_upload");
  }
}
