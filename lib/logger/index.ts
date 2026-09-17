type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "sessiontoken",
  "secret",
  "otp",
  "hashedotp",
  "authorization",
  "cookie",
  "cvv",
  "creditcard",
  "apikey",
]);

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Redact potential jwt or long bearer tokens
    if (obj.startsWith("Bearer ") || obj.length > 128) {
      return "[REDACTED_STRING]";
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, depth + 1));
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redact(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}

function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const safeMeta = meta ? redact(meta) : undefined;

  const logPayload = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(safeMeta ? { meta: safeMeta } : {}),
  };

  if (process.env.NODE_ENV === "production") {
    // Machine-readable single-line JSON
    const serialized = JSON.stringify(logPayload);
    if (level === "error") {
      console.error(serialized);
    } else if (level === "warn") {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  } else {
    // Human-readable dev output
    const prefix = `[${timestamp}] [${level.toUpperCase()}]:`;
    if (level === "error") {
      console.error(prefix, message, safeMeta ?? "");
    } else if (level === "warn") {
      console.warn(prefix, message, safeMeta ?? "");
    } else {
      console.log(prefix, message, safeMeta ?? "");
    }
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") {
      writeLog("debug", message, meta);
    }
  },
  info: (message: string, meta?: Record<string, unknown>) => writeLog("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => writeLog("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => writeLog("error", message, meta),
};

export default logger;
