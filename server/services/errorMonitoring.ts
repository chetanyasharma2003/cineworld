/**
 * Error Monitoring Service
 * Centralized error tracking, classification, and reporting
 */

import * as Sentry from "@sentry/node";
import logger from "../utils/logger.js";
import { Request } from "express";

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  AUTH = "auth",
  DATABASE = "database",
  EXTERNAL_API = "external_api",
  VALIDATION = "validation",
  RATE_LIMIT = "rate_limit",
  INTERNAL = "internal",
  UNKNOWN = "unknown",
}

interface ErrorContext {
  userId?: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  additionalContext?: Record<string, unknown>;
}

interface ErrorReport {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  stack?: string | undefined;
  context: ErrorContext;
  timestamp: string;
  sentryId?: string;
}

/**
 * Classify error based on type and context
 */
function classifyError(error: Error, statusCode?: number): {
  category: ErrorCategory;
  severity: ErrorSeverity;
} {
  const message = error.message.toLowerCase();

  // Auth errors
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("token")
  ) {
    return {
      category: ErrorCategory.AUTH,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  // Database errors
  if (
    error.name.includes("Mongoose") ||
    message.includes("database") ||
    message.includes("mongodb") ||
    message.includes("connection")
  ) {
    return {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
    };
  }

  // External API errors (TMDB, Groq, etc.)
  if (
    message.includes("tmdb") ||
    message.includes("groq") ||
    message.includes("external") ||
    message.includes("api") ||
    statusCode === 429
  ) {
    const severity = statusCode === 429 ? ErrorSeverity.MEDIUM : ErrorSeverity.MEDIUM;
    return {
      category: statusCode === 429 ? ErrorCategory.RATE_LIMIT : ErrorCategory.EXTERNAL_API,
      severity,
    };
  }

  // Validation errors
  if (
    statusCode === 400 ||
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
    };
  }

  // Rate limiting
  if (statusCode === 429 || message.includes("too many")) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  // Server errors
  if (statusCode && statusCode >= 500) {
    return {
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.CRITICAL,
    };
  }

  return {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
  };
}

/**
 * Report error to Sentry and internal monitoring
 */
export function reportError(
  error: Error | unknown,
  context: ErrorContext
): ErrorReport {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const { category, severity } = classifyError(
    errorObj,
    context.statusCode
  );

  const errorReport: ErrorReport = {
    message: errorObj.message,
    category,
    severity,
    stack: errorObj.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    // Use Sentry's withScope to attach context to the error
    Sentry.withScope((scope): void => {
      // Add context data
      if (context.userId) scope.setUser({ id: context.userId });
      if (context.requestId) scope.setTag("requestId", context.requestId);
      if (context.method) scope.setTag("method", context.method);
      if (context.path) scope.setTag("path", context.path);
      if (context.statusCode) scope.setTag("statusCode", context.statusCode.toString());
      if (context.duration !== undefined) scope.setContext("performance", { duration: context.duration });

      // Add category and severity
      scope.setTag("errorCategory", category);
      scope.setTag("severity", severity);

      // Add additional context
      if (context.additionalContext) {
        scope.setContext("additional", context.additionalContext);
      }

      const sentryId = Sentry.captureException(errorObj);
      errorReport.sentryId = sentryId;
    });
  }

  // Log based on severity
  const logLevel = {
    [ErrorSeverity.LOW]: "warn",
    [ErrorSeverity.MEDIUM]: "warn",
    [ErrorSeverity.HIGH]: "error",
    [ErrorSeverity.CRITICAL]: "error",
  }[severity];

  logger[logLevel as keyof typeof logger](
    `[${category.toUpperCase()}] ${errorObj.message}`,
    {
      severity,
      category,
      stack: errorObj.stack,
      requestId: context.requestId,
      userId: context.userId,
      ...(context.additionalContext || {}),
    }
  );

  return errorReport;
}

/**
 * Middleware to capture and report errors from request context
 */
export function errorMonitoringMiddleware(
  req: Request & { requestId?: string; _startTime?: number; user?: unknown },
  _error: Error | unknown
): ErrorContext {
  const user = req.user as { _id?: { toString?(): string } } | undefined;
  return {
    requestId: req.requestId,
    userId: user?._id?.toString?.(),
    method: req.method,
    path: req.path,
    duration: req._startTime ? Date.now() - req._startTime : undefined,
  };
}

/**
 * Get error statistics for monitoring dashboard
 */
export const errorStats = {
  byCategory: {
    [ErrorCategory.AUTH]: 0,
    [ErrorCategory.DATABASE]: 0,
    [ErrorCategory.EXTERNAL_API]: 0,
    [ErrorCategory.VALIDATION]: 0,
    [ErrorCategory.RATE_LIMIT]: 0,
    [ErrorCategory.INTERNAL]: 0,
    [ErrorCategory.UNKNOWN]: 0,
  } as Record<ErrorCategory, number>,
  bySeverity: {
    [ErrorSeverity.LOW]: 0,
    [ErrorSeverity.MEDIUM]: 0,
    [ErrorSeverity.HIGH]: 0,
    [ErrorSeverity.CRITICAL]: 0,
  } as Record<ErrorSeverity, number>,
  byStatusCode: {} as Record<number, number>,
  total: 0,
  lastErrors: [] as ErrorReport[],

  /**
   * Record an error occurrence
   */
  record(report: ErrorReport): void {
    this.total++;
    this.byCategory[report.category] = (this.byCategory[report.category] || 0) + 1;
    this.bySeverity[report.severity] = (this.bySeverity[report.severity] || 0) + 1;

    if (report.context.statusCode) {
      this.byStatusCode[report.context.statusCode] =
        (this.byStatusCode[report.context.statusCode] || 0) + 1;
    }

    // Keep last 100 errors
    this.lastErrors.unshift(report);
    if (this.lastErrors.length > 100) {
      this.lastErrors.pop();
    }
  },

  /**
   * Get summary statistics
   */
  getSummary(): Record<string, unknown> {
    return {
      total: this.total,
      byCategory: this.byCategory,
      bySeverity: this.bySeverity,
      byStatusCode: this.byStatusCode,
      criticalErrorsCount: this.bySeverity[ErrorSeverity.CRITICAL] || 0,
      highErrorsCount: this.bySeverity[ErrorSeverity.HIGH] || 0,
    };
  },

  /**
   * Get recent errors
   */
  getRecent(limit: number = 10): ErrorReport[] {
    return this.lastErrors.slice(0, limit);
  },

  /**
   * Reset stats
   */
  reset(): void {
    this.byCategory = {
      [ErrorCategory.AUTH]: 0,
      [ErrorCategory.DATABASE]: 0,
      [ErrorCategory.EXTERNAL_API]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.RATE_LIMIT]: 0,
      [ErrorCategory.INTERNAL]: 0,
      [ErrorCategory.UNKNOWN]: 0,
    };
    this.bySeverity = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0,
    };
    this.byStatusCode = {};
    this.total = 0;
    this.lastErrors = [];
  },
};
