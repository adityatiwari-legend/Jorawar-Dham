import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdminAuth } from "@/lib/auth/guard";
import { logAuditEvent } from "@/lib/auth/audit";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { AuditAction, ActorType } from "@prisma/client";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, ["settings:read"]);

    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return errorResponse(error, "admin_settings_get");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req, ["settings:write"]);
    const body = await req.json();

    if (!Array.isArray(body)) {
      throw new AppError("Payload must be an array of settings", "INVALID_PAYLOAD", 400);
    }

    const updatedKeys: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of body) {
        if (!item.key || typeof item.value !== "string") continue;
        await tx.siteSetting.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: {
            key: item.key,
            value: item.value,
            description: item.description,
            isPublic: item.isPublic ?? true,
          },
        });
        updatedKeys.push(item.key);
      }
    });

    const ip = extractClientIp(req.headers);
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.adminId,
      actorEmail: admin.email,
      action: AuditAction.UPDATE,
      entity: "SiteSetting",
      details: { updatedKeys },
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    return errorResponse(error, "admin_settings_post");
  }
}
