import crypto from "node:crypto";
import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Validates and sanitizes internal redirect destination.
 * Rejects external URLs, protocol-relative paths, backslashes, and encoded bypass attempts.
 */
export function safeInternalRedirectPath(
  rawPath: string | null | undefined,
  requestUrl: string
): string {
  if (!rawPath || typeof rawPath !== "string") {
    return "/";
  }

  const trimmed = rawPath.trim();

  // Reject paths that don't start with '/', start with '//', contain backslashes, or control characters
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /[\x00-\x1F\x7F]/.test(trimmed) ||
    /%2f|%5c/i.test(trimmed)
  ) {
    return "/";
  }

  try {
    const base = new URL(requestUrl);
    const resolved = new URL(trimmed, base.origin);

    // Explicit origin check: must match base origin
    if (resolved.origin !== base.origin) {
      return "/";
    }

    // Protocol check: must be http: or https:
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return "/";
    }

    // Pathname check: must start with single '/' and not start with '//' or contain '\\'
    if (
      !resolved.pathname.startsWith("/") ||
      resolved.pathname.startsWith("//") ||
      resolved.pathname.includes("\\")
    ) {
      return "/";
    }

    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return "/";
  }
}

/**
 * Constant-time string equality check to prevent timing attacks.
 */
function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

const SECURITY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.DRAFT_MODE_SECRET;

  // A.1: Fail closed if secret is missing or empty — no hardcoded fallback
  if (!expectedSecret || expectedSecret.trim().length === 0) {
    return NextResponse.json(
      {
        error: "Draft mode preview service is unavailable.",
        code: "PREVIEW_UNAVAILABLE",
      },
      {
        status: 500,
        headers: SECURITY_HEADERS,
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const rawRedirect = searchParams.get("redirect");

  // A.2: Validate input token and perform constant-time comparison
  if (
    !secret ||
    typeof secret !== "string" ||
    secret.trim().length === 0 ||
    !timingSafeEqualStrings(secret, expectedSecret)
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized: Invalid or missing draft mode secret token.",
        code: "INVALID_PREVIEW_SECRET",
      },
      {
        status: 401,
        headers: SECURITY_HEADERS,
      }
    );
  }

  // A.3: Sanitize redirect destination to internal paths only
  const safePath = safeInternalRedirectPath(rawRedirect, request.url);

  // Activate Next.js Draft Mode only after secret is verified
  const draft = await draftMode();
  draft.enable();

  const redirectUrl = new URL(safePath, request.url);
  const response = NextResponse.redirect(redirectUrl);

  // A.4: Indexing and caching protection headers
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");

  return response;
}
