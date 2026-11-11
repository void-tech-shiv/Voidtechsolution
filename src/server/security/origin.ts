/**
 * VOIDTECH SOLUTION — Request Origin & CSRF Defense
 * 
 * Validates that state-changing requests (Server Actions, POST mutations)
 * originate from the expected, authorized host.
 * 
 * Security Controls:
 * 1. Authoritative Trusted Host Allowlist:
 *    - Derived from NEXT_PUBLIC_SITE_URL / APP_URL / ALLOWED_HOSTS.
 *    - Local development / test fallbacks (localhost:3000, 127.0.0.1:3000) when NODE_ENV !== "production".
 * 2. Host Header Injection Defense:
 *    - Attacker cannot spoof Host or x-forwarded-host to match a forged Origin.
 *    - Host itself must exist within the trusted host allowlist.
 * 3. Reverse Proxy Trust Boundaries:
 *    - x-forwarded-host is ONLY evaluated when trustProxy is explicitly enabled.
 *    - Untrusted proxy requests ignore x-forwarded-host and use the direct Host header.
 * 4. Strict Origin / Referer Requirement:
 *    - State-changing mutations without an Origin or Referer are rejected.
 *    - Cross-origin origins are strictly rejected.
 */

export interface OriginValidationOptions {
  /**
   * Explicit allowlist of trusted hostnames (with optional port, e.g. 'voidtechsolution.com', 'localhost:3000').
   */
  trustedHosts?: string[];
  /**
   * Whether the server is behind a trusted reverse proxy (e.g. Vercel, Cloudflare, ALB)
   * that sets and sanitizes the x-forwarded-host header.
   */
  trustProxy?: boolean;
}

/**
 * Derives the set of authorized application hostnames from configuration and runtime environment.
 */
export function getTrustedHosts(options?: OriginValidationOptions): Set<string> {
  const trusted = new Set<string>();

  // 1. Explicit options passed directly
  if (options?.trustedHosts && options.trustedHosts.length > 0) {
    for (const h of options.trustedHosts) {
      trusted.add(h.trim().toLowerCase());
    }
  }

  // 2. Environment variable: ALLOWED_HOSTS (comma-separated)
  const envAllowedHosts = process.env.ALLOWED_HOSTS;
  if (envAllowedHosts) {
    for (const h of envAllowedHosts.split(",")) {
      const trimmed = h.trim().toLowerCase();
      if (trimmed) trusted.add(trimmed);
    }
  }

  // 3. Environment variable: NEXT_PUBLIC_SITE_URL or APP_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL;
  if (siteUrl) {
    try {
      const parsed = new URL(siteUrl);
      const host = parsed.host.toLowerCase();
      trusted.add(host);
      // Auto-include www variant for apex domains and vice-versa
      if (host.startsWith("www.")) {
        trusted.add(host.slice(4));
      } else if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        trusted.add(`www.${host}`);
      }
    } catch {}
  }

  // 4. Local development & test environment fallbacks
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv !== "production") {
    trusted.add("localhost:3000");
    trusted.add("localhost");
    trusted.add("127.0.0.1:3000");
    trusted.add("127.0.0.1");
  }

  return trusted;
}

/**
 * Validates the Origin and Host headers of a state-changing request.
 * 
 * @param headers Incoming request Headers object.
 * @param options Optional configuration overrides (e.g. for testing or custom proxy setups).
 * @returns boolean True if the request is a verified same-origin mutation.
 */
export function validateRequestOrigin(
  headers: Headers,
  options?: OriginValidationOptions
): boolean {
  const trustedHosts = getTrustedHosts(options);

  // Determine whether proxy headers should be trusted
  const trustProxy =
    options?.trustProxy ??
    (process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1");

  // Determine the effective request host
  let effectiveHost: string | null = null;

  if (trustProxy) {
    const forwardedHost = headers.get("x-forwarded-host");
    if (forwardedHost) {
      // In multi-proxy setups, take the first client-facing host
      const firstHost = forwardedHost.split(",")[0];
      if (firstHost) {
        effectiveHost = firstHost.trim().toLowerCase();
      }
    }
  }

  if (!effectiveHost) {
    effectiveHost = headers.get("host")?.trim().toLowerCase() || null;
  }

  // If no host can be identified, reject
  if (!effectiveHost) {
    return false;
  }

  // Anti-Host Header Injection: The effective host MUST be in the trusted allowlist
  if (!trustedHosts.has(effectiveHost)) {
    return false;
  }

  // Check Origin header first (standard for modern browser POST / Server Actions)
  const origin = headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      // Origin must match the verified effective host AND be trusted
      return originHost === effectiveHost && trustedHosts.has(originHost);
    } catch {
      return false;
    }
  }

  // Fallback to Referer header if Origin was omitted by the client
  const referer = headers.get("referer");
  if (referer) {
    try {
      const refererHost = new URL(referer).host.toLowerCase();
      // Referer must match the verified effective host AND be trusted
      return refererHost === effectiveHost && trustedHosts.has(refererHost);
    } catch {
      return false;
    }
  }

  // If neither Origin nor Referer is present on a state-changing mutation, reject
  return false;
}
