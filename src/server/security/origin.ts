/**
 * VOIDTECH SOLUTION — Request Origin & CSRF Defense
 * Validates that state-changing requests originate from the expected host.
 */

export function validateRequestOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") || headers.get("host");

  if (!host) {
    return false;
  }

  // Standard case: browser provides Origin header on POST / Server Action
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost.toLowerCase() === host.toLowerCase();
    } catch {
      return false;
    }
  }

  // Fallback: browser omitted Origin, check Referer
  const referer = headers.get("referer");
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost.toLowerCase() === host.toLowerCase();
    } catch {
      return false;
    }
  }

  // If neither Origin nor Referer is present on a state-changing mutation, reject
  return false;
}
