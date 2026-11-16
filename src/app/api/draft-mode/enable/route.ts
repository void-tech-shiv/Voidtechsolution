import crypto from "node:crypto";
import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { validateRequestOrigin } from "@/server/security/origin";

/**
 * Validates and sanitizes internal redirect destination.
 * Rejects external URLs, protocol-relative paths, backslashes, control characters,
 * and encoded bypass attempts.
 */
export function safeInternalRedirectPath(
  rawPath: string | null | undefined,
  requestUrl: string
): string {
  if (!rawPath || typeof rawPath !== "string") {
    return "/";
  }

  const trimmed = rawPath.trim();

  // Reject paths that don't start with '/', start with '//', contain backslashes, control characters, or encoded slashes
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

/**
 * GET requests to /api/draft-mode/enable are strictly rejected.
 * Secrets must never be transmitted via URL query strings.
 */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "Method Not Allowed: Draft Mode preview activation requires a POST request with the secret in the JSON request body.",
      code: "METHOD_NOT_ALLOWED",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
        ...SECURITY_HEADERS,
      },
    }
  );
}

/**
 * POST handler for secure Draft Mode activation.
 * Secret is supplied strictly in the JSON request body.
 */
export async function POST(request: NextRequest) {
  // 1. Cross-Origin & CSRF Defense: Enforce same-origin request
  const isOriginValid = validateRequestOrigin(request.headers);
  if (!isOriginValid) {
    return NextResponse.json(
      {
        error: "Forbidden: Cross-origin preview activation is rejected.",
        code: "CSRF_ORIGIN_MISMATCH",
      },
      {
        status: 403,
        headers: SECURITY_HEADERS,
      }
    );
  }

  // 2. Secret Configuration Check: Fail closed if unconfigured
  const expectedSecret = process.env.DRAFT_MODE_SECRET;
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

  // 3. Request Body Parsing & Payload Validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Bad Request: Request body must be valid JSON.",
        code: "INVALID_REQUEST_BODY",
      },
      {
        status: 400,
        headers: SECURITY_HEADERS,
      }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      {
        error: "Bad Request: Request body must be a JSON object.",
        code: "INVALID_REQUEST_BODY",
      },
      {
        status: 400,
        headers: SECURITY_HEADERS,
      }
    );
  }

  const { secret, redirect } = body as {
    secret?: unknown;
    redirect?: unknown;
  };

  // 4. Token Input Validation & Constant-Time Comparison
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

  // 5. Sanitize internal redirect destination
  const safePath = safeInternalRedirectPath(
    typeof redirect === "string" ? redirect : undefined,
    request.url
  );

  // 6. Activate Draft Mode
  const draft = await draftMode();
  draft.enable();

  // 7. Return successful activation response with security headers and safe destination
  return NextResponse.json(
    {
      success: true,
      redirect: safePath,
    },
    {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        Location: safePath,
      },
    }
  );
}
