import { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, validateAdminSessionToken } from "./session";
import { AppError } from "@/lib/utils/errors";
import logger from "@/lib/logger";

export interface AuthenticatedAdmin {
  sessionId: string;
  adminId: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export async function requireAdminAuth(
  req?: NextRequest,
  requiredPermissions: string[] = [],
  requiredRoles: string[] = []
): Promise<AuthenticatedAdmin> {
  let rawToken: string | undefined;

  if (req) {
    // 1. Check HTTP-only cookie first
    rawToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    // 2. Check Authorization header (Bearer <token>) as fallback
    if (!rawToken) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        rawToken = authHeader.substring(7).trim();
      }
    }
  }

  if (!rawToken) {
    throw new AppError("Authentication required. Please sign in.", "UNAUTHORIZED", 401);
  }

  const admin = await validateAdminSessionToken(rawToken);

  if (!admin) {
    throw new AppError("Invalid or expired session. Please sign in again.", "UNAUTHORIZED", 401);
  }

  // Super Admin possesses full bypass capability
  if (admin.isSuperAdmin) {
    return admin;
  }

  // Check required roles if specified
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => (admin.roles as string[]).includes(role));
    if (!hasRole) {
      logger.warn(`Admin ${admin.email} denied access: missing required role`, {
        requiredRoles,
        actualRoles: admin.roles,
      });
      throw new AppError("Access denied. You do not have the required administrative role.", "FORBIDDEN", 403);
    }
  }

  // Check required permissions if specified
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.every((perm) => admin.permissions.includes(perm));
    if (!hasPermission) {
      logger.warn(`Admin ${admin.email} denied access: missing required permission`, {
        requiredPermissions,
        actualPermissions: admin.permissions,
      });
      throw new AppError("Access denied. You do not have sufficient permissions for this operation.", "FORBIDDEN", 403);
    }
  }

  return admin;
}
