import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { OtpPurpose } from "@prisma/client";

/**
 * Secret salt / pepper used for SHA-256 HMAC hashing of OTP tokens.
 * Defaults to an internal key if not provided via OTP_PEPPER_SECRET env.
 */
const OTP_PEPPER = process.env.OTP_PEPPER_SECRET || "voidtech_secure_otp_pepper_salt_9874";

// In-memory fallback map for test runners and offline database instances
interface InMemoryOtp {
  id: string;
  identifier: string;
  codeHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  resendAvailableAt: Date;
  isUsed: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryOtpStore = new Map<string, InMemoryOtp[]>();

/**
 * Generates a cryptographically secure 6-digit numerical string.
 */
export function generateSixDigitOtp(): string {
  // crypto.randomInt is cryptographically secure (uniform random integer between min (inclusive) and max (exclusive))
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Computes a HMAC-SHA256 hash of the identifier, OTP, and purpose.
 */
export function hashOtpCode(identifier: string, code: string, purpose: OtpPurpose): string {
  return crypto
    .createHmac("sha256", OTP_PEPPER)
    .update(`${identifier.toLowerCase().trim()}:${code.trim()}:${purpose}`)
    .digest("hex");
}

export interface CreateOtpOptions {
  identifier: string;
  purpose?: OtpPurpose;
  expiryMinutes?: number;
  cooldownSeconds?: number;
  maxAttempts?: number;
}

export type CreateOtpResult =
  | {
      success: true;
      code: string;
      expiresAt: Date;
      resendAvailableAt: Date;
    }
  | {
      success: false;
      error: "RESEND_COOLDOWN_ACTIVE" | "GENERATION_FAILED";
      waitSeconds?: number;
    };

/**
 * Creates a new single-use 6-digit OTP for the given identifier and purpose.
 * Enforces a 60-second cooldown between requests and invalidates any previous unverified OTPs.
 * Plain-text OTP is returned once to the caller and NEVER stored or logged.
 */
export async function createOtp(options: CreateOtpOptions): Promise<CreateOtpResult> {
  const identifier = options.identifier.toLowerCase().trim();
  const purpose = options.purpose || "LOGIN";
  const expiryMinutes = options.expiryMinutes || 5;
  const cooldownSeconds = options.cooldownSeconds || 60;
  const maxAttempts = options.maxAttempts || 5;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);
  const resendAvailableAt = new Date(now.getTime() + cooldownSeconds * 1000);

  // Check cooldown from database or in-memory
  try {
    const activeRecent = await prisma.otpVerification.findFirst({
      where: {
        identifier,
        purpose,
        isUsed: false,
        resendAvailableAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeRecent) {
      const waitSeconds = Math.ceil((activeRecent.resendAvailableAt.getTime() - now.getTime()) / 1000);
      return {
        success: false,
        error: "RESEND_COOLDOWN_ACTIVE",
        waitSeconds,
      };
    }

    // Invalidate prior unused OTPs for this identifier and purpose
    await prisma.otpVerification.updateMany({
      where: {
        identifier,
        purpose,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    const code = generateSixDigitOtp();
    const codeHash = hashOtpCode(identifier, code, purpose);

    await prisma.otpVerification.create({
      data: {
        identifier,
        codeHash,
        purpose,
        expiresAt,
        resendAvailableAt,
        maxAttempts,
        attempts: 0,
        isUsed: false,
      },
    });

    return {
      success: true,
      code,
      expiresAt,
      resendAvailableAt,
    };
  } catch {
    // Fallback to in-memory store for isolated tests / offline DB
    const key = `${identifier}:${purpose}`;
    const list = inMemoryOtpStore.get(key) || [];

    const activeRecent = list.find((item) => !item.isUsed && item.resendAvailableAt > now);
    if (activeRecent) {
      const waitSeconds = Math.ceil((activeRecent.resendAvailableAt.getTime() - now.getTime()) / 1000);
      return {
        success: false,
        error: "RESEND_COOLDOWN_ACTIVE",
        waitSeconds,
      };
    }

    // Invalidate existing in-memory OTPs
    for (const item of list) {
      if (!item.isUsed) {
        item.isUsed = true;
      }
    }

    const code = generateSixDigitOtp();
    const codeHash = hashOtpCode(identifier, code, purpose);

    const memoryRecord: InMemoryOtp = {
      id: `mem-otp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      identifier,
      codeHash,
      purpose,
      expiresAt,
      resendAvailableAt,
      attempts: 0,
      maxAttempts,
      isUsed: false,
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    list.push(memoryRecord);
    inMemoryOtpStore.set(key, list);

    return {
      success: true,
      code,
      expiresAt,
      resendAvailableAt,
    };
  }
}

export type VerifyOtpResult =
  | {
      success: true;
      verifiedAt: Date;
    }
  | {
      success: false;
      error:
        | "OTP_NOT_FOUND"
        | "OTP_EXPIRED"
        | "OTP_ALREADY_USED"
        | "MAX_ATTEMPTS_EXCEEDED"
        | "INVALID_CODE";
      remainingAttempts?: number;
    };

/**
 * Verifies an OTP code against its cryptographically secure hash.
 * Enforces single-use consumption, expiration window, and maximum attempt lockout.
 */
export async function verifyOtp(
  identifierInput: string,
  codeInput: string,
  purpose: OtpPurpose = "LOGIN"
): Promise<VerifyOtpResult> {
  const identifier = identifierInput.toLowerCase().trim();
  const code = codeInput.trim();
  const now = new Date();

  try {
    const record = await prisma.otpVerification.findFirst({
      where: {
        identifier,
        purpose,
        isUsed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return { success: false, error: "OTP_NOT_FOUND" };
    }

    if (now > record.expiresAt) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true },
      });
      return { success: false, error: "OTP_EXPIRED" };
    }

    if (record.attempts >= record.maxAttempts) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true },
      });
      return { success: false, error: "MAX_ATTEMPTS_EXCEEDED", remainingAttempts: 0 };
    }

    // Verify hash using constant-time comparison
    const candidateHash = hashOtpCode(identifier, code, purpose);
    const candidateBuffer = Buffer.from(candidateHash, "hex");
    const storedBuffer = Buffer.from(record.codeHash, "hex");

    const isMatch =
      candidateBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(candidateBuffer, storedBuffer);

    if (!isMatch) {
      const nextAttempts = record.attempts + 1;
      const isLocked = nextAttempts >= record.maxAttempts;

      await prisma.otpVerification.update({
        where: { id: record.id },
        data: {
          attempts: nextAttempts,
          isUsed: isLocked,
        },
      });

      return {
        success: false,
        error: isLocked ? "MAX_ATTEMPTS_EXCEEDED" : "INVALID_CODE",
        remainingAttempts: Math.max(0, record.maxAttempts - nextAttempts),
      };
    }

    // Successfully verified: mark as used immediately
    const updated = await prisma.otpVerification.update({
      where: { id: record.id },
      data: {
        isUsed: true,
        verifiedAt: now,
      },
    });

    return {
      success: true,
      verifiedAt: updated.verifiedAt || now,
    };
  } catch {
    // Memory fallback handler
    const key = `${identifier}:${purpose}`;
    const list = inMemoryOtpStore.get(key) || [];
    const record = list.find((item) => !item.isUsed);

    if (!record) {
      return { success: false, error: "OTP_NOT_FOUND" };
    }

    if (now > record.expiresAt) {
      record.isUsed = true;
      return { success: false, error: "OTP_EXPIRED" };
    }

    if (record.attempts >= record.maxAttempts) {
      record.isUsed = true;
      return { success: false, error: "MAX_ATTEMPTS_EXCEEDED", remainingAttempts: 0 };
    }

    const candidateHash = hashOtpCode(identifier, code, purpose);
    const candidateBuffer = Buffer.from(candidateHash, "hex");
    const storedBuffer = Buffer.from(record.codeHash, "hex");

    const isMatch =
      candidateBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(candidateBuffer, storedBuffer);

    if (!isMatch) {
      record.attempts += 1;
      const isLocked = record.attempts >= record.maxAttempts;
      if (isLocked) {
        record.isUsed = true;
      }
      return {
        success: false,
        error: isLocked ? "MAX_ATTEMPTS_EXCEEDED" : "INVALID_CODE",
        remainingAttempts: Math.max(0, record.maxAttempts - record.attempts),
      };
    }

    record.isUsed = true;
    record.verifiedAt = now;
    return {
      success: true,
      verifiedAt: now,
    };
  }
}

/**
 * Clears the in-memory OTP store (used between isolated test suites).
 */
export function resetInMemoryOtpStore(): void {
  inMemoryOtpStore.clear();
}
