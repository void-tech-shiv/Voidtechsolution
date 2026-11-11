"use server";

import { cookies, headers } from "next/headers";
import { adminLoginSchema } from "@/validations/auth";
import { getAdminByEmail, updateLastLogin } from "@/server/repositories/users.repo";
import { verifyPassword } from "@/server/security/password";
import {
  createAdminSession,
  validateAdminSession,
  revokeAdminSession,
  SESSION_COOKIE_NAME,
} from "@/server/security/session";
import { checkRateLimit } from "@/server/security/rate-limiter";
import { createAuditLog } from "@/server/repositories/audit.repo";
import { validateRequestOrigin } from "@/server/security/origin";
import type { AdminUser, AdminSession } from "@prisma/client";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * Server Action for administrative credentials login.
 * 
 * Security Controls:
 * 1. Strict Origin/CSRF header check.
 * 2. Zod schema validation (max length bounds).
 * 3. Rate limiting (max 5 failed attempts per 15 min per IP/email).
 * 4. Timing-safe scrypt password verification.
 * 5. Generic authentication failure responses (anti-enumeration).
 * 6. Dual-layer session creation (DB row + signed HttpOnly cookie).
 * 7. Immutable audit logging for success and failure.
 */
export async function loginAction(input: unknown): Promise<AuthActionResult> {
  const reqHeaders = await headers();

  // 1. CSRF / Origin Validation for state-changing mutation
  if (!validateRequestOrigin(reqHeaders)) {
    return {
      success: false,
      error: "Cross-origin request rejected. Please refresh and try again.",
    };
  }

  // 2. Schema Validation
  const parsed = adminLoginSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Invalid input";
    return {
      success: false,
      error: firstError,
    };
  }

  const { email, password, rememberMe } = parsed.data;
  const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  // 3. Pre-computation Rate Limiting (5 failures / 15 min window)
  const rateLimitKey = `auth_login:${ip}:${email.toLowerCase()}`;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    const waitMins = Math.ceil((rateLimit.resetInSeconds || 60) / 60);
    return {
      success: false,
      error: `Too many failed login attempts. Account access is temporarily throttled. Please try again in ${waitMins} minute(s).`,
    };
  }

  // 4. User Lookup
  const user = await getAdminByEmail(email);

  // Anti-enumeration: Identical error response for missing user or bad password
  const GENERIC_AUTH_ERROR = "Invalid email or password.";

  if (!user || !user.isActive) {
    // Record audit event for suspicious attempt
    try {
      await createAuditLog({
        action: "AUTH_LOGIN_FAILED",
        entity: "AdminUser",
        actorEmail: email,
        ipAddress: ip,
        userAgent,
        details: { reason: !user ? "UNKNOWN_USER" : "ACCOUNT_INACTIVE" },
      });
    } catch {}

    return {
      success: false,
      error: GENERIC_AUTH_ERROR,
    };
  }

  // 5. Scrypt Password Verification
  const isMatch = verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    try {
      await createAuditLog({
        action: "AUTH_LOGIN_FAILED",
        entity: "AdminUser",
        entityId: user.id,
        actorId: user.id,
        actorEmail: user.email,
        ipAddress: ip,
        userAgent,
        details: { reason: "PASSWORD_MISMATCH" },
      });
    } catch {}

    return {
      success: false,
      error: GENERIC_AUTH_ERROR,
    };
  }

  // 6. Session Creation & Cookie Generation
  try {
    const { cookieValue } = await createAdminSession(user.id, {
      ipAddress: ip,
      userAgent,
      rememberMe: !!rememberMe,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours absolute expiration
    });

    // 7. Update Last Login Timestamp & Audit Log
    await updateLastLogin(user.id);

    await createAuditLog({
      action: "AUTH_LOGIN_SUCCESS",
      entity: "AdminUser",
      entityId: user.id,
      actorId: user.id,
      actorEmail: user.email,
      ipAddress: ip,
      userAgent,
      details: { role: user.role },
    });

    return {
      success: true,
      redirectUrl: "/admin",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Session creation failed";
    console.error("[auth.action] Session creation failed:", msg);
    return {
      success: false,
      error: "Authentication service temporarily unavailable. Please try again.",
    };
  }
}

/**
 * Server Action for administrative logout.
 * Revokes database session and clears client cookie.
 */
export async function logoutAction(): Promise<AuthActionResult> {
  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "unknown";

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const validation = await validateAdminSession(sessionCookie);
      if (validation.isValid) {
        await createAuditLog({
          action: "AUTH_LOGOUT",
          entity: "AdminUser",
          entityId: validation.user.id,
          actorId: validation.user.id,
          actorEmail: validation.user.email,
          ipAddress: ip,
          userAgent,
        });
      }

      await revokeAdminSession(sessionCookie);
    } catch {}

    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  return {
    success: true,
    redirectUrl: "/admin/login",
  };
}

/**
 * Helper retrieving the currently authenticated administrator.
 * Performs authoritative PostgreSQL validation (verifies session row, idle timeout, active flag).
 */
export async function getCurrentAdmin(): Promise<{
  user: AdminUser;
  session: AdminSession;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const result = await validateAdminSession(sessionCookie);
    if (!result.isValid) return null;

    return { user: result.user, session: result.session };
  } catch {
    return null;
  }
}
