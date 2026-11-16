import crypto from "crypto";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * VOIDTECH SOLUTION — Sliding Window Rate Limiter (Process-Local)
 * 
 * ARCHITECTURE & PRODUCTION ASSESSMENT:
 * -----------------------------------------------------------------------------
 * 1. Process-Local Storage:
 *    The `rateLimitMap` and `duplicateMap` are held in Node.js process memory.
 * 2. Serverless / Multi-Instance Limitation:
 *    In multi-instance production environments (e.g., Vercel serverless functions,
 *    AWS Lambda, multi-container ECS/Kubernetes), this state is NOT shared across
 *    different running instances or regions.
 * 3. Process Lifetime & Volatility:
 *    The in-memory counters reset whenever the process restarts, scales down,
 *    or cold-starts a new serverless container.
 * 4. Production Security Requirement:
 *    While acceptable for local development, CI test suites, and single-instance
 *    deployments, this process-local limiter is NOT sufficient as the sole
 *    production brute-force defense. Production deployments require a shared
 *    distributed store (e.g., Upstash Redis, Vercel KV, Redis cluster) or
 *    infrastructure-level Edge WAF rate-limiting (e.g., Cloudflare Rate Limiting,
 *    AWS WAF) to throttle distributed dictionary attacks across serverless workers.
 * -----------------------------------------------------------------------------
 */
const rateLimitMap = new Map<string, RateLimitRecord>();

// Duplicate submission fingerprints (hash -> expiry timestamp)
const duplicateMap = new Map<string, number>();

/**
 * Checks if a specific client key (IP or identifier) has exceeded the rate limit.
 * Defaults to 5 requests per 10-minute window.
 */
export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetInSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Generates a SHA-256 fingerprint for duplicate payload detection.
 */
export function generateSubmissionFingerprint(email: string, message: string, selectedPackage?: string): string {
  const normalized = `${email.trim().toLowerCase()}:${message.trim().toLowerCase()}:${selectedPackage || ""}`;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Checks whether this submission payload was already sent within the cooldown window (default 60s).
 */
export function isDuplicateSubmission(fingerprint: string, cooldownMs = 60 * 1000): boolean {
  const now = Date.now();
  const expiresAt = duplicateMap.get(fingerprint);

  if (expiresAt && now < expiresAt) {
    return true;
  }

  duplicateMap.set(fingerprint, now + cooldownMs);
  return false;
}

/**
 * Cleanup helper for unit tests
 */
export function resetRateLimits(): void {
  rateLimitMap.clear();
  duplicateMap.clear();
}
