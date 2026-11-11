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
  revokeAllUserSessions,
  IDLE_TIMEOUT_MS,
  ABSOLUTE_SESSION_LIFETIME_MS,
} from "@/server/security/session";
import { validateRequestOrigin } from "@/server/security/origin";
import { checkRateLimit } from "@/server/security/rate-limiter";
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
    expect(salt.length).toBe(32); // 16 bytes in hex = 32 chars
    expect(derivedKey.length).toBe(128); // 64 bytes in hex = 128 chars
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

describe("CSRF & Origin Validation", () => {
  it("accepts request when Origin matches Host", () => {
    const headers = new Headers({
      origin: "https://voidtechsolution.com",
      host: "voidtechsolution.com",
    });
    expect(validateRequestOrigin(headers)).toBe(true);
  });

  it("accepts request with port in development environment", () => {
    const headers = new Headers({
      origin: "http://localhost:3000",
      host: "localhost:3000",
    });
    expect(validateRequestOrigin(headers)).toBe(true);
  });

  it("rejects cross-origin request from malicious site", () => {
    const headers = new Headers({
      origin: "https://malicious-phishing-site.com",
      host: "voidtechsolution.com",
    });
    expect(validateRequestOrigin(headers)).toBe(false);
  });

  it("accepts Referer fallback when Origin is omitted", () => {
    const headers = new Headers({
      referer: "https://voidtechsolution.com/admin/login",
      host: "voidtechsolution.com",
    });
    expect(validateRequestOrigin(headers)).toBe(true);
  });

  it("rejects when both Origin and Referer are missing", () => {
    const headers = new Headers({
      host: "voidtechsolution.com",
    });
    expect(validateRequestOrigin(headers)).toBe(false);
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
