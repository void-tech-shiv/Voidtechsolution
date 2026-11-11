import crypto from "node:crypto";

/**
 * Hashes a plaintext password using Node.js scrypt with a unique cryptographically secure salt.
 * Format: `<hex_salt>:<hex_hash>`
 */
export function hashPassword(password: string): string {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;

  const [salt, expectedHash] = parts;
  if (!salt || !expectedHash) return false;

  try {
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    const derivedBuffer = Buffer.from(derivedKey, "hex");
    const expectedBuffer = Buffer.from(expectedHash, "hex");

    if (derivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
