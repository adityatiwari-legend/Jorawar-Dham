import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdminAuth } from "@/lib/auth/guard";
import { errorResponse } from "@/lib/utils/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req, ["audit:read"]);
    const { searchParams } = new URL(req.url);

    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const entity = searchParams.get("entity") || undefined;

    const logs = await prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return errorResponse(error, "admin_audit_logs_get");
  }
}
