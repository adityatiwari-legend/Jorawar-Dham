import { AuditAction, ActorType } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import logger from "@/lib/logger";

export interface AuditEventParams {
  actorType?: ActorType;
  actorId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const REDACTED_AUDIT_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "secret",
  "otp",
  "authorization",
  "cookie",
]);

function sanitizeAuditDetails(details?: Record<string, unknown> | null): Record<string, unknown> | undefined {
  if (!details) return undefined;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (REDACTED_AUDIT_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeAuditDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const safeDetails = sanitizeAuditDetails(params.details);

    await prisma.auditLog.create({
      data: {
        actorType: params.actorType || ActorType.ADMIN,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: safeDetails ? (safeDetails as object) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent ? params.userAgent.substring(0, 500) : undefined,
      },
    });

    logger.info(`Audit: [${params.action}] on ${params.entity} by ${params.actorEmail || params.actorId || "SYSTEM"}`);
  } catch (err) {
    logger.error("Failed to persist audit log entry:", {
      error: err instanceof Error ? err.message : String(err),
      action: params.action,
      entity: params.entity,
    });
  }
}
