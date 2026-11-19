import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  isDuplicateSubmission,
  peekRateLimit,
  recordRateLimitFailure,
  releaseSubmissionFingerprint,
  resetRateLimits,
} from "@/server/security/rate-limiter";
import { getTrustedClientIp, hashClientIp } from "@/server/security/client-ip";
import { getSessionSigningSecret } from "@/server/security/cookie";

describe("Security hardening: trusted IPs, secrets, and throttling", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  afterEach(() => {
    resetRateLimits();
    vi.unstubAllEnvs();
  });

  it("ignores spoofable forwarded IP headers unless an ingress is explicitly trusted", () => {
    vi.stubEnv("TRUST_PROXY", "false");
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5" });
    expect(getTrustedClientIp(headers)).toBeNull();
  });

  it("uses a valid proxy-provided IP only when configured", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    expect(getTrustedClientIp(new Headers({
      "x-forwarded-for": "203.0.113.5, 10.0.0.1",
    }))).toBe("203.0.113.5");
    expect(getTrustedClientIp(new Headers({
      "x-real-ip": "not-an-ip",
    }))).toBeNull();
  });

  it("never stores a raw address as enquiry IP metadata", () => {
    vi.stubEnv("AUTH_SECRET", "a-very-long-test-secret-with-at-least-32-characters");
    const digest = hashClientIp("203.0.113.5");
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain("203.0.113.5");
    expect(hashClientIp("203.0.113.5")).toBe(digest);
  });

  it("fails closed on missing production signing secrets", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "");
    expect(getSessionSigningSecret).toThrow("AUTH_SECRET");
    vi.stubEnv("AUTH_SECRET", "a-very-long-test-secret-with-at-least-32-characters");
    expect(getSessionSigningSecret()).toBe(
      "a-very-long-test-secret-with-at-least-32-characters"
    );
  });

  it("does not charge successful logins to failure-only throttle counters", () => {
    const key = "test:login-account";
    for (let i = 0; i < 8; i++) {
      expect(peekRateLimit(key, 2, 60_000).allowed).toBe(true);
    }
    recordRateLimitFailure(key, 2, 60_000);
    expect(peekRateLimit(key, 2, 60_000).allowed).toBe(true);
    recordRateLimitFailure(key, 2, 60_000);
    expect(peekRateLimit(key, 2, 60_000).allowed).toBe(false);
  });

  it("can release an in-flight duplicate reservation after a persistence error", () => {
    const fingerprint = "failed-persistence-test";
    expect(isDuplicateSubmission(fingerprint)).toBe(false);
    expect(isDuplicateSubmission(fingerprint)).toBe(true);
    releaseSubmissionFingerprint(fingerprint);
    expect(isDuplicateSubmission(fingerprint)).toBe(false);
  });

  it("retains the existing submission limiting primitive for compatibility", () => {
    expect(checkRateLimit("test", 1).allowed).toBe(true);
    expect(checkRateLimit("test", 1).allowed).toBe(false);
  });
});
