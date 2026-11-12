/**
 * VOIDTECH SOLUTION — Edge-Compatible Session Cookie Engine
 * 
 * Crucial Architecture Boundary:
 * This module has ZERO database/Prisma dependencies. It executes safely within
 * Next.js Edge Middleware, Server Components, Route Handlers, and Server Actions
 * using standard Web Crypto API (crypto.subtle).
 */

export const SESSION_COOKIE_NAME = "vts_session";
export const ABSOLUTE_SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface SessionCookiePayload {
  sessionId: string;
  rawToken: string;
  exp: number;
}

/**
 * Edge-compatible Base64URL string encoder.
 */
function base64UrlEncode(str: string): string {
  const enc = new TextEncoder();
  const bytes = enc.encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i] ?? 0;
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Edge-compatible Base64URL string decoder.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const dec = new TextDecoder();
  return dec.decode(bytes);
}

/**
 * Imports the server secret key into an Edge-compatible Web Crypto HMAC key.
 */
async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs the session token payload using Web Crypto API HMAC-SHA256.
 * Output format: `<base64url_json>.<hex_signature>`
 */
export async function signSessionCookie(
  payload: SessionCookiePayload,
  secret: string
): Promise<string> {
  const data = JSON.stringify(payload);
  const key = await getHmacKey(secret);
  const enc = new TextEncoder();
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const sigHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const encodedData = base64UrlEncode(data);
  return `${encodedData}.${sigHex}`;
}

/**
 * Verifies the HMAC-SHA256 signature of a session cookie value.
 * Returns payload if signature and expiration check pass; otherwise null.
 */
export async function verifySessionCookie(
  cookieValue: string,
  secret: string
): Promise<SessionCookiePayload | null> {
  if (!cookieValue || !cookieValue.includes(".")) return null;
  const [encodedData, sigHex] = cookieValue.split(".");
  if (!encodedData || !sigHex) return null;

  try {
    const data = base64UrlDecode(encodedData);
    const parsed = JSON.parse(data) as SessionCookiePayload;
    if (!parsed.sessionId || !parsed.rawToken || !parsed.exp) return null;

    if (Date.now() > parsed.exp) {
      return null; // Expired cryptographically
    }

    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const sigBytes = new Uint8Array(
      sigHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
    if (!isValid) return null;

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Sanitizes return URLs (callbackUrl) to prevent Open Redirect vulnerabilities.
 * Strictly guarantees that return URLs are relative paths within the same origin.
 */
export function sanitizeCallbackUrl(
  url: string | null | undefined,
  defaultUrl = "/admin"
): string {
  if (!url) return defaultUrl;
  const trimmed = url.trim();

  // Must begin with a single slash (relative path)
  if (!trimmed.startsWith("/")) return defaultUrl;

  // Reject protocol-relative URLs (e.g. //evil.com)
  if (trimmed.startsWith("//")) return defaultUrl;

  // Reject Windows-style slash backslash bypass (e.g. /\evil.com)
  if (trimmed.startsWith("/\\")) return defaultUrl;

  // Reject carriage return / line break control characters (header injection)
  if (/[\r\n\t]/.test(trimmed)) return defaultUrl;

  // Reject URI schemes (e.g. javascript:, data:, https:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return defaultUrl;

  return trimmed;
}

/**
 * Canonical secure cookie attributes according to OWASP guidelines.
 */
export function getSessionCookieOptions(isProduction: boolean) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(ABSOLUTE_SESSION_LIFETIME_MS / 1000), // 28,800 seconds (8 hours)
  };
}
