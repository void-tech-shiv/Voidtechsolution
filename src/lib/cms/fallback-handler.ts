/**
 * VOIDTECH SOLUTION — CMS Static Fallback Engine & Diagnostic Logger
 * 
 * Implements Safeguard 6: The 5-Scenario Static Fallback Behavior Matrix.
 * Guarantees that:
 * 1. Stale static fallback content is never silently presented as latest CMS content.
 * 2. Deliberately archived content returns 404 and is never replaced by fallback data.
 * 3. Fallback events emit structured, sanitized diagnostic JSON logs without leaking credentials.
 * 4. Responses carry source attribution: "database" vs "static-fallback".
 */

export type FallbackScenario =
  | "DB_UNAVAILABLE" // Scenario 1
  | "EMPTY_TABLE"    // Scenario 2
  | "ARCHIVED"       // Scenario 3
  | "INVALID_DATA"   // Scenario 4
  | "REPO_EXCEPTION";// Scenario 5

export interface FallbackDiagnosticLog {
  level: "INFO" | "WARN" | "ERROR";
  event: string;
  scenario: FallbackScenario;
  entity: string;
  reason?: string;
  error?: string;
  slug?: string;
  entityId?: string;
  timestamp: string;
}

/**
 * Strips database connection strings, passwords, and sensitive tokens from error messages.
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  let message = error instanceof Error ? error.message : String(error);

  // Redact postgresql:// or postgres:// connection strings
  message = message.replace(/postgres(?:ql)?:\/\/[^\s@]+@[^\s/]+/gi, "postgresql://[REDACTED]@[REDACTED]");
  // Redact password or secret query params
  message = message.replace(/password=[^&\s]+/gi, "password=[REDACTED]");
  message = message.replace(/secret=[^&\s]+/gi, "secret=[REDACTED]");
  // Redact token strings
  message = message.replace(/token=[^&\s]+/gi, "token=[REDACTED]");

  return message;
}

/**
 * Emits structured, sanitized JSON diagnostic logs for fallback events.
 */
export function logFallbackEvent(params: {
  level: "INFO" | "WARN" | "ERROR";
  event: string;
  scenario: FallbackScenario;
  entity: string;
  reason?: string;
  error?: unknown;
  slug?: string;
  entityId?: string;
}): void {
  const logPayload: FallbackDiagnosticLog = {
    level: params.level,
    event: params.event,
    scenario: params.scenario,
    entity: params.entity,
    reason: params.reason,
    error: params.error ? sanitizeErrorMessage(params.error) : undefined,
    slug: params.slug,
    entityId: params.entityId,
    timestamp: new Date().toISOString(),
  };

  const formatted = JSON.stringify(logPayload);

  switch (params.level) {
    case "INFO":
      console.info(`[CMS_FALLBACK] ${formatted}`);
      break;
    case "WARN":
      console.warn(`[CMS_FALLBACK] ${formatted}`);
      break;
    case "ERROR":
      console.error(`[CMS_FALLBACK] ${formatted}`);
      break;
  }
}

export const FALLBACK_HEADER_NAME = "X-Voidtech-Content-Source";
export const FALLBACK_HEADER_VALUE = "static-fallback";
export const DATABASE_HEADER_VALUE = "database";
