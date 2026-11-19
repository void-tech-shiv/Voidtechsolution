import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/**
 * Only trust forwarding headers if the deployment has a trusted ingress that
 * strips client-supplied CF-Connecting-IP/X-Real-IP/X-Forwarded-For values.
 * Without this guarantee an attacker can rotate arbitrary rate-limit keys.
 */
export function getTrustedClientIp(requestHeaders: Pick<Headers, "get">): string | null {
  if (process.env.TRUST_PROXY !== "true" && process.env.TRUST_PROXY !== "1") {
    return null;
  }

  const value =
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0] ??
    null;

  const ip = value?.trim() ?? "";
  return isIP(ip) ? ip : null;
}

/** Persist a keyed pseudonymous identifier, never a raw visitor IP. */
export function hashClientIp(ip: string | null): string | null {
  const secret = process.env.IP_HASH_SECRET || process.env.AUTH_SECRET;
  if (!ip || !secret || secret.length < 32) return null;

  return createHmac("sha256", secret)
    .update("enquiry-ip-v1:")
    .update(ip)
    .digest("hex");
}
