import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import logger from "@/lib/logger";

export const ADMIN_SESSION_COOKIE = "jd_admin_session";
const SESSION_DURATION_HOURS = 12;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const sessionTokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

  await prisma.adminSession.create({
    data: {
      adminId,
      sessionTokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return { rawToken, expiresAt };
}

export async function setAdminSessionCookie(rawToken: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: rawToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSessionFromCookie() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!rawToken) return null;

  return validateAdminSessionToken(rawToken);
}

export async function validateAdminSessionToken(rawToken: string) {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length !== 64) {
    return null;
  }

  const sessionTokenHash = hashToken(rawToken);

  const session = await prisma.adminSession.findUnique({
    where: { sessionTokenHash },
    include: {
      admin: {
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    // Session expired - clean it up
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  if (session.admin.status !== "ACTIVE") {
    logger.warn(`Suspended admin attempted access: ${session.admin.email}`);
    return null;
  }

  // Touch lastActiveAt asynchronously
  prisma.adminSession
    .update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => null);

  // Extract roles and flat permission set
  const roles = session.admin.roles.map((ar) => ar.role.name);
  const permissions = new Set<string>();

  for (const ar of session.admin.roles) {
    for (const rp of ar.role.permissions) {
      permissions.add(rp.permission.code);
    }
  }

  return {
    sessionId: session.id,
    adminId: session.admin.id,
    username: session.admin.username,
    email: session.admin.email,
    firstName: session.admin.firstName,
    lastName: session.admin.lastName,
    roles,
    permissions: Array.from(permissions),
    isSuperAdmin: roles.includes("SUPER_ADMIN"),
  };
}

export async function terminateAdminSession(rawToken: string) {
  const sessionTokenHash = hashToken(rawToken);
  await prisma.adminSession.deleteMany({
    where: { sessionTokenHash },
  });
}

export async function getAuthenticatedAdmin() {
  const session = await getAdminSessionFromCookie();
  if (!session) return null;
  return {
    id: session.adminId,
    adminId: session.adminId,
    email: session.email,
    username: session.username,
    firstName: session.firstName,
    lastName: session.lastName,
    roles: session.roles,
    permissions: session.permissions,
    isSuperAdmin: session.isSuperAdmin,
  };
}
