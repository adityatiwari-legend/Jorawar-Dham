import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, terminateAdminSession, clearAdminSessionCookie, getAdminSessionFromCookie } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { AuditAction, ActorType } from "@prisma/client";
import { extractClientIp } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rawToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const currentAdmin = await getAdminSessionFromCookie();

    if (rawToken) {
      await terminateAdminSession(rawToken);
    }

    await clearAdminSessionCookie();

    if (currentAdmin) {
      const ip = extractClientIp(req.headers);
      await logAuditEvent({
        actorType: ActorType.ADMIN,
        actorId: currentAdmin.adminId,
        actorEmail: currentAdmin.email,
        action: AuditAction.LOGOUT,
        entity: "Admin",
        entityId: currentAdmin.adminId,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") || undefined,
      });
    }

    return NextResponse.json({ success: true, message: "Logged out successfully." });
  } catch {
    await clearAdminSessionCookie();
    return NextResponse.json({ success: true, message: "Session cleared." });
  }
}
