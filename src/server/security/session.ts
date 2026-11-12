import { prisma } from "@/lib/prisma";
import type { AdminUser, AdminSession } from "@prisma/client";
import {
  SESSION_COOKIE_NAME,
  ABSOLUTE_SESSION_LIFETIME_MS,
  signSessionCookie,
  verifySessionCookie,
  sanitizeCallbackUrl,
  getSessionCookieOptions,
  type SessionCookiePayload,
} from "./cookie";

export {
  SESSION_COOKIE_NAME,
  ABSOLUTE_SESSION_LIFETIME_MS,
  signSessionCookie,
  verifySessionCookie,
  sanitizeCallbackUrl,
  getSessionCookieOptions,
  type SessionCookiePayload,
};

/**
 * VOIDTECH SOLUTION — Session Engine & Security Configuration
 * 
 * Security Policies:
 * - Absolute Lifetime: 8 hours (28,800 seconds).
 * - Idle Timeout: 30 minutes (1,800 seconds) enforced via PostgreSQL lastActiveAt.
 * - Dual-layer verification: Edge HMAC signature validation + server PostgreSQL verification.
 * - Tokens stored in DB strictly as SHA-256 hashes (OWASP session storage standard).
 */

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
// Write Amplification Protection:
// Throttled to at most once per 5 minutes to prevent saturating PostgreSQL / PgBouncer connection pools
export const TOUCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes throttle for DB touch

/**
 * Generates a 256-bit cryptographically secure pseudorandom opaque session token.
 */
export function generateRawSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Computes the SHA-256 hash of a session token for secure database storage.
 */
export async function hashSessionToken(token: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a database-backed AdminSession row and generates a signed cookie value.
 */
export async function createAdminSession(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string; rememberMe?: boolean }
): Promise<{
  session: AdminSession;
  rawToken: string;
  cookieValue: string;
}> {
  const rawToken = generateRawSessionToken();
  const sessionTokenHash = await hashSessionToken(rawToken);
  const secret = process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security";
  const expiresAt = new Date(Date.now() + ABSOLUTE_SESSION_LIFETIME_MS);

  const session = await prisma.adminSession.create({
    data: {
      userId,
      sessionToken: sessionTokenHash,
      ipAddress: metadata?.ipAddress || null,
      userAgent: metadata?.userAgent || null,
      expiresAt,
    },
  });

  const cookieValue = await signSessionCookie(
    {
      sessionId: session.id,
      rawToken,
      exp: expiresAt.getTime(),
    },
    secret
  );

  return { session, rawToken, cookieValue };
}

export type SessionValidationResult =
  | { isValid: true; user: AdminUser; session: AdminSession }
  | { isValid: false; reason: "INVALID_SIGNATURE" | "SESSION_NOT_FOUND" | "ABSOLUTE_TIMEOUT" | "IDLE_TIMEOUT" | "USER_INACTIVE" };

/**
 * Authoritative Server-Side Session Validation.
 * Verifies cookie signature, queries PostgreSQL, checks idle timeout (30 min),
 * absolute lifetime (8 hours), and account active status.
 */
export async function validateAdminSession(cookieValue: string): Promise<SessionValidationResult> {
  const secret = process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security";
  const verified = await verifySessionCookie(cookieValue, secret);

  if (!verified) {
    return { isValid: false, reason: "INVALID_SIGNATURE" };
  }

  const tokenHash = await hashSessionToken(verified.rawToken);

  const session = await prisma.adminSession.findUnique({
    where: { sessionToken: tokenHash },
    include: { user: true },
  });

  if (!session) {
    return { isValid: false, reason: "SESSION_NOT_FOUND" };
  }

  // Check 1: Absolute 8-hour expiration
  if (session.expiresAt.getTime() < Date.now()) {
    try {
      await prisma.adminSession.delete({ where: { id: session.id } });
    } catch {}
    return { isValid: false, reason: "ABSOLUTE_TIMEOUT" };
  }

  // Check 2: Server-side 30-minute idle timeout
  const idleElapsed = Date.now() - session.lastActiveAt.getTime();
  if (idleElapsed > IDLE_TIMEOUT_MS) {
    try {
      await prisma.adminSession.delete({ where: { id: session.id } });
    } catch {}
    return { isValid: false, reason: "IDLE_TIMEOUT" };
  }

  // Check 3: Administrator active status
  if (!session.user.isActive) {
    return { isValid: false, reason: "USER_INACTIVE" };
  }

  // Idle touch: update lastActiveAt if more than TOUCH_INTERVAL_MS has elapsed
  // Write Amplification Protection: Throttled to at most once per 5 minutes
  if (idleElapsed > TOUCH_INTERVAL_MS) {
    try {
      await prisma.adminSession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      });
    } catch {}
  }

  return { isValid: true, user: session.user, session };
}

/**
 * Revokes a session by deleting it from PostgreSQL.
 */
export async function revokeAdminSession(cookieValue: string): Promise<boolean> {
  const secret = process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security";
  const verified = await verifySessionCookie(cookieValue, secret);
  if (!verified) return false;

  try {
    const tokenHash = await hashSessionToken(verified.rawToken);
    await prisma.adminSession.deleteMany({
      where: { sessionToken: tokenHash },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revokes all sessions for a specific administrator (e.g. after password reset or deactivation).
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  try {
    const result = await prisma.adminSession.deleteMany({
      where: { userId },
    });
    return result.count;
  } catch {
    return 0;
  }
}

/**
 * Rotates a session: revokes previous session and generates a fresh session.
 */
export async function rotateAdminSession(
  oldCookieValue: string,
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ session: AdminSession; rawToken: string; cookieValue: string }> {
  await revokeAdminSession(oldCookieValue);
  return await createAdminSession(userId, metadata);
}

