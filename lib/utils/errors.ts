import { NextResponse } from "next/server";
import { ZodError } from "zod";
import logger from "@/lib/logger";

export interface SafeErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

export function sanitizeError(error: unknown, context?: string): { response: SafeErrorResponse; status: number } {
  // 1. Zod Validation Errors (Safe to return validation field errors to client)
  if (error instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const field = issue.path.join(".") || "form";
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(issue.message);
    }

    logger.warn(`Validation failure [${context || "unknown"}]:`, { errors: formattedErrors });

    return {
      response: {
        success: false,
        error: "Validation failed. Please verify your input.",
        code: "VALIDATION_ERROR",
        details: formattedErrors,
      },
      status: 400,
    };
  }

  // 2. Custom Safe Application Errors
  if (error instanceof AppError) {
    logger.warn(`Application error [${context || "unknown"}]: ${error.message}`, {
      code: error.code,
      status: error.status,
    });

    return {
      response: {
        success: false,
        error: error.message,
        code: error.code,
      },
      status: error.status,
    };
  }

  // 3. Unhandled System / Database Errors (NEVER leak stack or DB details)
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(`Internal server exception [${context || "unknown"}]: ${errorMessage}`, {
    stack: errorStack,
  });

  return {
    response: {
      success: false,
      error: "An internal server error occurred. Please try again later.",
      code: "INTERNAL_SERVER_ERROR",
    },
    status: 500,
  };
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = "BAD_REQUEST",
    public status: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(error: unknown, context?: string): NextResponse<SafeErrorResponse> {
  const { response, status } = sanitizeError(error, context);
  return NextResponse.json(response, { status });
}
