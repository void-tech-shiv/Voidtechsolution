import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminLoginSchema } from "@/validations/auth";
import {
  hashPassword,
  verifyPassword,
} from "@/server/security/password";
import {
  generateRawSessionToken,
  hashSessionToken,
  signSessionCookie,
  verifySessionCookie,
  validateAdminSession,
  createAdminSession,
  revokeAdminSession,
  ABSOLUTE_SESSION_LIFETIME_MS,
} from "@/server/security/session";
import { validateRequestOrigin } from "@/server/security/origin";
import { checkRateLimit } from "@/server/security/rate-limiter";
import {
  updateAdminPassword,
  updateAdminRole,
  setAdminActiveStatus,
} from "@/server/repositories/users.repo";
import { prisma } from "@/lib/prisma";

const TEST_SECRET = "test_auth_secret_minimum_32_characters_for_hmac_testing_key_12345";

describe("Milestone 7.1: Admin Authentication & Input Validation", () => {
  it("validates valid admin login input", () => {
    const valid = {
      email: "admin@voidtechsolution.com",
      password: "StrongPassword123!",
      rememberMe: true,
    };
    const result = adminLoginSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email address format", () => {
    const invalid = {
      email: "not-an-email",
      password: "StrongPassword123!",
    };
    const result = adminLoginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const invalid = {
      email: "admin@voidtechsolution.com",
      password: "short",
    };
    const result = adminLoginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 128 characters (DoS prevention)", () => {
    const invalid = {
      email: "admin@voidtechsolution.com",
      password: "a".repeat(129),
    };
    const result = adminLoginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("Milestone 7.1: Scrypt Password Hashing & Constant-Time Verification", () => {
  it("generates a formatted scrypt hash with 16-byte salt", () => {
    const hash = hashPassword("P@ssword2026!");
    expect(hash).toContain(":");
    const [salt, derivedKey] = hash.split(":");
    expect(salt?.length).toBe(32); // 16 bytes in hex = 32 chars
    expect(derivedKey?.length).toBe(128); // 64 bytes in hex = 128 chars
  });

  it("successfully verifies matching password against scrypt hash", () => {
    const password = "Secur3Password#Void";
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("rejects non-matching password", () => {
    const hash = hashPassword("CorrectPassword123");
    expect(verifyPassword("WrongPassword123", hash)).toBe(false);
  });

  it("rejects corrupted or malformed stored hash strings safely", () => {
    expect(verifyPassword("AnyPassword", "malformed_hash_without_delimiter")).toBe(false);
    expect(verifyPassword("AnyPassword", "")).toBe(false);
  });
});

describe("Milestone 7.2: Token Generation & SHA-256 Hashing", () => {
  it("generates 256-bit high-entropy random session tokens", () => {
    const token1 = generateRawSessionToken();
    const token2 = generateRawSessionToken();
    expect(token1.length).toBe(64); // 32 bytes hex
    expect(token2.length).toBe(64);
    expect(token1).not.toBe(token2);
  });

  it("computes deterministic SHA-256 session token hashes", async () => {
    const token = "fixed_test_token_string_1234567890abcdef";
    const hash1 = await hashSessionToken(token);
    const hash2 = await hashSessionToken(token);
    expect(hash1.length).toBe(64);
    expect(hash1).toBe(hash2);
  });
});

describe("Milestone 7.2: Web Crypto HMAC-SHA256 Dual-Layer Cookie Signing", () => {
  it("signs and verifies valid session payload using Web Crypto API", async () => {
    const payload = {
      sessionId: "sess_123",
      rawToken: "raw_token_xyz_456",
      exp: Date.now() + 8 * 60 * 60 * 1000,
    };

    const cookieValue = await signSessionCookie(payload, TEST_SECRET);
    expect(cookieValue).toContain(".");

    const verified = await verifySessionCookie(cookieValue, TEST_SECRET);
    expect(verified).not.toBeNull();
    expect(verified?.sessionId).toBe("sess_123");
    expect(verified?.rawToken).toBe("raw_token_xyz_456");
  });

  it("rejects cookie with tampered data payload", async () => {
    const payload = {
      sessionId: "sess_123",
      rawToken: "raw_token_xyz",
      exp: Date.now() + 3600000,
    };
    const cookieValue = await signSessionCookie(payload, TEST_SECRET);
    const [, sigHex] = cookieValue.split(".");

    // Tamper with data payload
    const tamperedData = Buffer.from(
      JSON.stringify({ ...payload, sessionId: "sess_HACKED" })
    ).toString("base64url");
    const tamperedCookie = `${tamperedData}.${sigHex}`;

    const verified = await verifySessionCookie(tamperedCookie, TEST_SECRET);
    expect(verified).toBeNull();
  });

  it("rejects cookie verified with wrong secret key", async () => {
    const payload = {
      sessionId: "sess_123",
      rawToken: "raw_token_xyz",
      exp: Date.now() + 3600000,
    };
    const cookieValue = await signSessionCookie(payload, TEST_SECRET);
    const verified = await verifySessionCookie(cookieValue, "completely_wrong_secret_key_9999999999");
    expect(verified).toBeNull();
  });

  it("rejects cryptographically expired cookie signature", async () => {
    const payload = {
      sessionId: "sess_expired",
      rawToken: "raw_token_xyz",
      exp: Date.now() - 1000, // Expired 1 second ago
    };
    const cookieValue = await signSessionCookie(payload, TEST_SECRET);
    const verified = await verifySessionCookie(cookieValue, TEST_SECRET);
    expect(verified).toBeNull();
  });
});

describe("Milestone 7.2: Server-Side Session Validation & Idle Timeout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates active session and returns user and session records", async () => {
    const mockUser = {
      id: "usr_admin_01",
      email: "admin@voidtechsolution.com",
      name: "Lead Admin",
      role: "ADMIN" as const,
      isActive: true,
      passwordHash: "salt:hash",
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSession = {
      id: "sess_active_01",
      userId: "usr_admin_01",
      sessionToken: "sha256_mock_hash",
      ipAddress: "127.0.0.1",
      userAgent: "vitest-test-runner",
      expiresAt: new Date(Date.now() + ABSOLUTE_SESSION_LIFETIME_MS),
      lastActiveAt: new Date(),
      createdAt: new Date(),
      user: mockUser,
    };

    vi.spyOn(prisma.adminSession, "findUnique").mockResolvedValue(mockSession as any);
    vi.spyOn(prisma.adminSession, "update").mockResolvedValue(mockSession as any);

    const rawToken = "sample_raw_token_for_validation";
    const cookieValue = await signSessionCookie(
      {
        sessionId: mockSession.id,
        rawToken,
        exp: mockSession.expiresAt.getTime(),
      },
      process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security"
    );

    const result = await validateAdminSession(cookieValue);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.user.email).toBe("admin@voidtechsolution.com");
      expect(result.session.id).toBe("sess_active_01");
    }
  });

  it("rejects session that exceeds the 30-minute server-side idle timeout", async () => {
    const mockUser = {
      id: "usr_admin_01",
      email: "admin@voidtechsolution.com",
      name: "Lead Admin",
      role: "ADMIN" as const,
      isActive: true,
      passwordHash: "salt:hash",
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Idle for 31 minutes
    const idleTime = new Date(Date.now() - 31 * 60 * 1000);

    const mockSession = {
      id: "sess_idle_01",
      userId: "usr_admin_01",
      sessionToken: "sha256_mock_hash",
      ipAddress: "127.0.0.1",
      userAgent: "vitest-test-runner",
      expiresAt: new Date(Date.now() + ABSOLUTE_SESSION_LIFETIME_MS),
      lastActiveAt: idleTime,
      createdAt: new Date(),
      user: mockUser,
    };

    vi.spyOn(prisma.adminSession, "findUnique").mockResolvedValue(mockSession as any);
    const deleteSpy = vi.spyOn(prisma.adminSession, "delete").mockResolvedValue(mockSession as any);

    const cookieValue = await signSessionCookie(
      {
        sessionId: mockSession.id,
        rawToken: "token_idle",
        exp: mockSession.expiresAt.getTime(),
      },
      process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security"
    );

    const result = await validateAdminSession(cookieValue);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.reason).toBe("IDLE_TIMEOUT");
    }
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: "sess_idle_01" } });
  });

  it("rejects session when account is deactivated (isActive = false)", async () => {
    const mockInactiveUser = {
      id: "usr_deactivated",
      email: "banned@voidtechsolution.com",
      name: "Deactivated Staff",
      role: "EDITOR" as const,
      isActive: false, // Inactive
      passwordHash: "salt:hash",
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSession = {
      id: "sess_banned_01",
      userId: "usr_deactivated",
      sessionToken: "sha256_mock_hash",
      ipAddress: "127.0.0.1",
      userAgent: "vitest-test-runner",
      expiresAt: new Date(Date.now() + ABSOLUTE_SESSION_LIFETIME_MS),
      lastActiveAt: new Date(),
      createdAt: new Date(),
      user: mockInactiveUser,
    };

    vi.spyOn(prisma.adminSession, "findUnique").mockResolvedValue(mockSession as any);

    const cookieValue = await signSessionCookie(
      {
        sessionId: mockSession.id,
        rawToken: "token_banned",
        exp: mockSession.expiresAt.getTime(),
      },
      process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security"
    );

    const result = await validateAdminSession(cookieValue);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.reason).toBe("USER_INACTIVE");
    }
  });
});

describe("CSRF & Origin Security Validation", () => {
  it("accepts legitimate same-origin requests in development and production", () => {
    // Development environment
    const devHeaders = new Headers({
      origin: "http://localhost:3000",
      host: "localhost:3000",
    });
    expect(validateRequestOrigin(devHeaders)).toBe(true);

    // Production environment with explicit trusted configuration
    const prodHeaders = new Headers({
      origin: "https://voidtechsolution.com",
      host: "voidtechsolution.com",
    });
    expect(
      validateRequestOrigin(prodHeaders, {
        trustedHosts: ["voidtechsolution.com", "www.voidtechsolution.com"],
      })
    ).toBe(true);
  });

  it("rejects forged Origin headers", () => {
    const headers = new Headers({
      origin: "https://evil-phishing-attacker.com",
      host: "voidtechsolution.com",
    });
    expect(
      validateRequestOrigin(headers, {
        trustedHosts: ["voidtechsolution.com"],
      })
    ).toBe(false);
  });

  it("rejects when both Origin and Referer are missing on state-changing mutation", () => {
    const headers = new Headers({
      host: "localhost:3000",
    });
    expect(validateRequestOrigin(headers)).toBe(false);
  });

  it("rejects cross-origin Server Action requests", () => {
    const headers = new Headers({
      origin: "https://cross-site-attacker.org",
      referer: "https://cross-site-attacker.org/embed",
      host: "voidtechsolution.com",
    });
    expect(
      validateRequestOrigin(headers, {
        trustedHosts: ["voidtechsolution.com"],
      })
    ).toBe(false);
  });

  it("rejects forged Host headers when attacker attempts to spoof Host to match Origin", () => {
    // Attacker crafts both Host and Origin to match their controlled domain
    const headers = new Headers({
      origin: "https://attacker-controlled.com",
      host: "attacker-controlled.com",
    });
    // System must reject because attacker-controlled.com is NOT in trusted application hosts
    expect(
      validateRequestOrigin(headers, {
        trustedHosts: ["voidtechsolution.com", "www.voidtechsolution.com"],
      })
    ).toBe(false);
  });

  it("rejects untrusted forwarded-host headers when proxy trust is disabled", () => {
    const headers = new Headers({
      origin: "https://attacker-proxy.com",
      host: "localhost:3000",
      "x-forwarded-host": "attacker-proxy.com",
    });
    // With trustProxy false (or default), x-forwarded-host is ignored; host is localhost:3000, mismatch!
    expect(validateRequestOrigin(headers, { trustProxy: false })).toBe(false);
  });

  it("accepts properly configured trusted proxy behavior with validated application domain", () => {
    // Behind reverse proxy (e.g. AWS ALB, Cloudflare, NGINX) with internal host
    const headers = new Headers({
      origin: "https://voidtechsolution.com",
      host: "internal-alb-10-0-1-5.local",
      "x-forwarded-host": "voidtechsolution.com",
    });
    expect(
      validateRequestOrigin(headers, {
        trustedHosts: ["voidtechsolution.com"],
        trustProxy: true,
      })
    ).toBe(true);
  });

  it("rejects untrusted forwarded-host even when proxy trust is enabled if domain is untrusted", () => {
    const headers = new Headers({
      origin: "https://evil-untrusted.com",
      host: "internal-alb-10-0-1-5.local",
      "x-forwarded-host": "evil-untrusted.com",
    });
    expect(
      validateRequestOrigin(headers, {
        trustedHosts: ["voidtechsolution.com"],
        trustProxy: true,
      })
    ).toBe(false);
  });

  it("accepts Referer fallback when Origin is omitted by legitimate client", () => {
    const headers = new Headers({
      referer: "https://voidtechsolution.com/admin/login",
      host: "voidtechsolution.com",
    });
    expect(
      validateRequestOrigin(headers, {
        trustedHosts: ["voidtechsolution.com"],
      })
    ).toBe(true);
  });
});

describe("Milestone 7.2: Comprehensive Session Security & Invalidation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("guarantees raw session tokens never enter database records (stores strictly SHA-256 hash)", async () => {
    let capturedSessionTokenArg: string | undefined;

    (vi.spyOn(prisma.adminSession, "create") as any).mockImplementation(async (args: any) => {
      capturedSessionTokenArg = args.data.sessionToken;
      return {
        id: "sess_created_01",
        userId: args.data.userId,
        sessionToken: args.data.sessionToken,
        ipAddress: args.data.ipAddress,
        userAgent: args.data.userAgent,
        expiresAt: args.data.expiresAt,
        lastActiveAt: new Date(),
        createdAt: new Date(),
      } as any;
    });

    const { rawToken, session } = await createAdminSession("usr_test_01", {
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });

    // 1. Raw token is 64 hex characters (256-bit random string)
    expect(rawToken.length).toBe(64);
    // 2. Database record holds the SHA-256 hash, NOT the raw token
    expect(capturedSessionTokenArg).toBeDefined();
    expect(capturedSessionTokenArg).not.toBe(rawToken);
    const expectedHash = await hashSessionToken(rawToken);
    expect(capturedSessionTokenArg).toBe(expectedHash);
    expect(session.sessionToken).toBe(expectedHash);
  });

  it("rejects nonexistent or revoked sessions (SESSION_NOT_FOUND)", async () => {
    vi.spyOn(prisma.adminSession, "findUnique").mockResolvedValue(null);

    const cookieValue = await signSessionCookie(
      {
        sessionId: "sess_nonexistent",
        rawToken: "token_nonexistent",
        exp: Date.now() + 3600000,
      },
      process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security"
    );

    const result = await validateAdminSession(cookieValue);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.reason).toBe("SESSION_NOT_FOUND");
    }
  });

  it("rejects absolute lifetime expiration (ABSOLUTE_TIMEOUT) and purges session record", async () => {
    const expiredAbsolute = new Date(Date.now() - 1000); // 1 second in the past
    const mockSession = {
      id: "sess_expired_absolute",
      userId: "usr_admin_01",
      sessionToken: "sha256_mock_hash",
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      expiresAt: expiredAbsolute,
      lastActiveAt: new Date(), // Active recently, but absolute lifetime passed
      createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000), // Created 9 hours ago
      user: { id: "usr_admin_01", isActive: true },
    };

    vi.spyOn(prisma.adminSession, "findUnique").mockResolvedValue(mockSession as any);
    const deleteSpy = vi.spyOn(prisma.adminSession, "delete").mockResolvedValue(mockSession as any);

    const cookieValue = await signSessionCookie(
      {
        sessionId: mockSession.id,
        rawToken: "token_abs_expired",
        exp: Date.now() + 3600000, // Cookie signature payload still valid, but DB expiresAt passed
      },
      process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security"
    );

    const result = await validateAdminSession(cookieValue);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.reason).toBe("ABSOLUTE_TIMEOUT");
    }
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: "sess_expired_absolute" } });
  });

  it("revokes database session upon logout (revokeAdminSession)", async () => {
    const rawToken = "raw_token_to_revoke";
    const tokenHash = await hashSessionToken(rawToken);
    const deleteManySpy = vi.spyOn(prisma.adminSession, "deleteMany").mockResolvedValue({ count: 1 });

    const cookieValue = await signSessionCookie(
      {
        sessionId: "sess_to_revoke",
        rawToken,
        exp: Date.now() + 3600000,
      },
      process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security"
    );

    const revoked = await revokeAdminSession(cookieValue);
    expect(revoked).toBe(true);
    expect(deleteManySpy).toHaveBeenCalledWith({
      where: { sessionToken: tokenHash },
    });
  });

  it("revokes all active sessions when admin password is changed (updateAdminPassword)", async () => {
    const updateSpy = vi.spyOn(prisma.adminUser, "update").mockResolvedValue({
      id: "usr_pw_change",
      passwordHash: "new_hash",
    } as any);
    const deleteManySpy = vi.spyOn(prisma.adminSession, "deleteMany").mockResolvedValue({ count: 3 });

    await updateAdminPassword("usr_pw_change", "new_hash");
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: "usr_pw_change" },
      data: { passwordHash: "new_hash" },
    });
    expect(deleteManySpy).toHaveBeenCalledWith({
      where: { userId: "usr_pw_change" },
    });
  });

  it("revokes all active sessions when admin role is changed (updateAdminRole)", async () => {
    const updateSpy = vi.spyOn(prisma.adminUser, "update").mockResolvedValue({
      id: "usr_role_change",
      role: "EDITOR",
    } as any);
    const deleteManySpy = vi.spyOn(prisma.adminSession, "deleteMany").mockResolvedValue({ count: 2 });

    await updateAdminRole("usr_role_change", "EDITOR");
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: "usr_role_change" },
      data: { role: "EDITOR" },
    });
    expect(deleteManySpy).toHaveBeenCalledWith({
      where: { userId: "usr_role_change" },
    });
  });

  it("revokes all active sessions when admin is deactivated (setAdminActiveStatus)", async () => {
    const updateSpy = vi.spyOn(prisma.adminUser, "update").mockResolvedValue({
      id: "usr_deact",
      isActive: false,
    } as any);
    const deleteManySpy = vi.spyOn(prisma.adminSession, "deleteMany").mockResolvedValue({ count: 1 });

    await setAdminActiveStatus("usr_deact", false);
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: "usr_deact" },
      data: { isActive: false },
    });
    expect(deleteManySpy).toHaveBeenCalledWith({
      where: { userId: "usr_deact" },
    });
  });

  it("throttles session lastActiveAt touch to prevent write amplification within TOUCH_INTERVAL_MS", async () => {
    const mockUser = {
      id: "usr_admin_01",
      email: "admin@voidtechsolution.com",
      role: "ADMIN" as const,
      isActive: true,
    };

    // User touched 2 minutes ago (which is < 5 minutes TOUCH_INTERVAL_MS)
    const recentlyTouched = new Date(Date.now() - 2 * 60 * 1000);
    const mockSession = {
      id: "sess_throttled_touch",
      userId: "usr_admin_01",
      sessionToken: "sha256_mock_hash",
      expiresAt: new Date(Date.now() + ABSOLUTE_SESSION_LIFETIME_MS),
      lastActiveAt: recentlyTouched,
      user: mockUser,
    };

    vi.spyOn(prisma.adminSession, "findUnique").mockResolvedValue(mockSession as any);
    const updateSpy = vi.spyOn(prisma.adminSession, "update").mockResolvedValue(mockSession as any);

    const cookieValue = await signSessionCookie(
      {
        sessionId: mockSession.id,
        rawToken: "token_throttle",
        exp: mockSession.expiresAt.getTime(),
      },
      process.env.AUTH_SECRET || "default_auth_secret_minimum_32_characters_long_for_security"
    );

    const result = await validateAdminSession(cookieValue);
    expect(result.isValid).toBe(true);
    // Since elapsed (2m) is LESS than TOUCH_INTERVAL_MS (5m), no DB write should occur!
    expect(updateSpy).not.toHaveBeenCalled();
  });
});

describe("Login Rate Limiting", () => {
  it("permits initial attempts and throttles after 5 failed attempts", () => {
    const testKey = `test_throttle_${Date.now()}`;
    const windowMs = 60 * 1000;

    for (let i = 1; i <= 5; i++) {
      const result = checkRateLimit(testKey, 5, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - i);
    }

    // 6th attempt should be blocked
    const blocked = checkRateLimit(testKey, 5, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
  });
});

