import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/argon2";
import { createAdminSession, setAdminSessionCookie } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { checkRateLimit, extractClientIp } from "@/lib/security/rate-limit";
import { errorResponse, AppError } from "@/lib/utils/errors";
import { AuditAction, ActorType } from "@prisma/client";
import logger from "@/lib/logger";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const ip = extractClientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || undefined;

    // 1. Rate limiting: max 5 login requests per 60s per IP
    const rateCheck = checkRateLimit(`admin_login_${ip}`, {
      windowMs: 60000,
      maxRequests: 5,
    });

    if (!rateCheck.allowed) {
      logger.warn(`Admin login rate limit triggered from IP: ${ip}`);
      throw new AppError(
        "Too many login attempts. Please wait before trying again.",
        "RATE_LIMITED",
        429
      );
    }

    // 2. Strict payload validation
    const body = await req.json();
    const parsed = adminLoginSchema.parse(body);
    const identifier = parsed.identifier.toLowerCase();

    // 3. Lookup admin by username or email
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!admin) {
      // Generic error to prevent account enumeration
      logger.warn(`Failed admin login for non-existent identifier: ${identifier} from IP ${ip}`);
      throw new AppError("Invalid credentials provided.", "INVALID_CREDENTIALS", 401);
    }

    // 4. Check account status & lockout
    if (admin.status !== "ACTIVE") {
      throw new AppError("Account is inactive or suspended. Contact super administrator.", "ACCOUNT_SUSPENDED", 403);
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(
        `Account temporarily locked due to excessive failed attempts. Try again in ${waitMinutes} minute(s).`,
        "ACCOUNT_LOCKED",
        423
      );
    }

    // 5. Verify Argon2id password
    const isPasswordValid = await verifyPassword(parsed.password, admin.passwordHash);

    if (!isPasswordValid) {
      const updatedAttempts = admin.failedLoginAttempts + 1;
      const shouldLock = updatedAttempts >= MAX_FAILED_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: updatedAttempts,
          lockedUntil,
        },
      });

      await logAuditEvent({
        actorType: ActorType.ADMIN,
        actorId: admin.id,
        actorEmail: admin.email,
        action: AuditAction.LOGIN_FAILURE,
        entity: "Admin",
        entityId: admin.id,
        details: { reason: "Incorrect password", attemptCount: updatedAttempts },
        ipAddress: ip,
        userAgent,
      });

      if (shouldLock) {
        throw new AppError(
          `Account locked for ${LOCKOUT_MINUTES} minutes due to repeated failed attempts.`,
          "ACCOUNT_LOCKED",
          423
        );
      }

      throw new AppError("Invalid credentials provided.", "INVALID_CREDENTIALS", 401);
    }

    // 6. Login Success: Reset failures, record timestamps
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    // 7. Create server-side session and set HTTP-only cookie
    const { rawToken, expiresAt } = await createAdminSession(admin.id, ip, userAgent);
    await setAdminSessionCookie(rawToken, expiresAt);

    // 8. Record audit log
    await logAuditEvent({
      actorType: ActorType.ADMIN,
      actorId: admin.id,
      actorEmail: admin.email,
      action: AuditAction.LOGIN_SUCCESS,
      entity: "Admin",
      entityId: admin.id,
      ipAddress: ip,
      userAgent,
    });

    const roles = admin.roles.map((r) => r.role.name);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        roles,
      },
    });
  } catch (error) {
    return errorResponse(error, "admin_login");
  }
}
