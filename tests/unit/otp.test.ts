import { describe, it, expect, beforeEach } from "vitest";
import {
  generateSixDigitOtp,
  hashOtpCode,
  createOtp,
  verifyOtp,
  resetInMemoryOtpStore,
} from "@/server/security/otp.service";

describe("Phase 3: Cryptographic OTP Generation & Hashing", () => {
  it("generates a cryptographically secure 6-digit numerical string", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateSixDigitOtp();
      expect(code).toMatch(/^\d{6}$/);
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    }
  });

  it("produces deterministic HMAC-SHA256 hashes with proper salt and pepper isolation", () => {
    const hash1 = hashOtpCode("user@example.com", "123456", "LOGIN");
    const hash2 = hashOtpCode("user@example.com", "123456", "LOGIN");
    const hash3 = hashOtpCode("user@example.com", "123457", "LOGIN");
    const hash4 = hashOtpCode("user@example.com", "123456", "PASSWORD_RESET");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).not.toBe(hash4);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
  });
});

describe("Phase 3: OTP Lifecycle, Cooldown & Security Policies", () => {
  beforeEach(() => {
    resetInMemoryOtpStore();
  });

  it("successfully creates a 6-digit OTP with 5-minute expiry and 60-second cooldown", async () => {
    const result = await createOtp({
      identifier: "client@voidtechsolution.com",
      purpose: "LOGIN",
      expiryMinutes: 5,
      cooldownSeconds: 60,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.code).toMatch(/^\d{6}$/);
    const now = Date.now();
    const expiryDiff = result.expiresAt.getTime() - now;
    const cooldownDiff = result.resendAvailableAt.getTime() - now;

    // ~5 minutes (300,000ms) with small execution tolerance
    expect(expiryDiff).toBeGreaterThanOrEqual(295000);
    expect(expiryDiff).toBeLessThanOrEqual(305000);

    // ~60 seconds (60,000ms)
    expect(cooldownDiff).toBeGreaterThanOrEqual(55000);
    expect(cooldownDiff).toBeLessThanOrEqual(65000);
  });

  it("enforces 60-second resend cooldown against rapid token spamming", async () => {
    const first = await createOtp({
      identifier: "spam-check@example.com",
      cooldownSeconds: 60,
    });
    expect(first.success).toBe(true);

    const second = await createOtp({
      identifier: "spam-check@example.com",
      cooldownSeconds: 60,
    });

    expect(second.success).toBe(false);
    if (!second.success) {
      expect(second.error).toBe("RESEND_COOLDOWN_ACTIVE");
      expect(second.waitSeconds).toBeGreaterThan(0);
      expect(second.waitSeconds).toBeLessThanOrEqual(60);
    }
  });

  it("verifies a valid OTP and marks it single-use (prevents replay attacks)", async () => {
    const created = await createOtp({
      identifier: "singleuse@example.com",
      cooldownSeconds: 0, // disable cooldown for instant verification test
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    // First verification attempt: should succeed
    const verified = await verifyOtp("singleuse@example.com", created.code, "LOGIN");
    expect(verified.success).toBe(true);

    // Second verification attempt with same code: must be rejected (single-use)
    const replay = await verifyOtp("singleuse@example.com", created.code, "LOGIN");
    expect(replay.success).toBe(false);
    if (!replay.success) {
      expect(["OTP_ALREADY_USED", "OTP_NOT_FOUND"]).toContain(replay.error);
    }
  });

  it("rejects invalid OTP and tracks remaining attempts up to max 5 lockout", async () => {
    const created = await createOtp({
      identifier: "lockout-test@example.com",
      cooldownSeconds: 0,
      maxAttempts: 5,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const wrongCode = "000000";

    // Attempt 1: 4 remaining
    const attempt1 = await verifyOtp("lockout-test@example.com", wrongCode, "LOGIN");
    expect(attempt1.success).toBe(false);
    if (!attempt1.success) {
      expect(attempt1.error).toBe("INVALID_CODE");
      expect(attempt1.remainingAttempts).toBe(4);
    }

    // Attempts 2, 3, 4
    await verifyOtp("lockout-test@example.com", wrongCode, "LOGIN");
    await verifyOtp("lockout-test@example.com", wrongCode, "LOGIN");
    await verifyOtp("lockout-test@example.com", wrongCode, "LOGIN");

    // Attempt 5: Final attempt exhausted -> lockout
    const attempt5 = await verifyOtp("lockout-test@example.com", wrongCode, "LOGIN");
    expect(attempt5.success).toBe(false);
    if (!attempt5.success) {
      expect(attempt5.error).toBe("MAX_ATTEMPTS_EXCEEDED");
      expect(attempt5.remainingAttempts).toBe(0);
    }

    // Attempt 6: Locked out even with the CORRECT code!
    const attempt6 = await verifyOtp("lockout-test@example.com", created.code, "LOGIN");
    expect(attempt6.success).toBe(false);
    if (!attempt6.success) {
      expect(["MAX_ATTEMPTS_EXCEEDED", "OTP_ALREADY_USED", "OTP_NOT_FOUND"]).toContain(attempt6.error);
    }
  });

  it("rejects expired OTP tokens", async () => {
    const created = await createOtp({
      identifier: "expired@example.com",
      expiryMinutes: -1, // already in the past
      cooldownSeconds: 0,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const verified = await verifyOtp("expired@example.com", created.code, "LOGIN");
    expect(verified.success).toBe(false);
    if (!verified.success) {
      expect(verified.error).toBe("OTP_EXPIRED");
    }
  });

  it("enforces strict purpose isolation (LOGIN code cannot reset PASSWORD)", async () => {
    const created = await createOtp({
      identifier: "isolated@example.com",
      purpose: "LOGIN",
      cooldownSeconds: 0,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    // Verify against PASSWORD_RESET purpose
    const crossPurpose = await verifyOtp("isolated@example.com", created.code, "PASSWORD_RESET");
    expect(crossPurpose.success).toBe(false);
    if (!crossPurpose.success) {
      expect(crossPurpose.error).toBe("OTP_NOT_FOUND");
    }
  });
});
