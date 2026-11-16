import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import {
  signSessionCookie,
  SESSION_COOKIE_NAME,
  type SessionCookiePayload,
} from "@/server/security/cookie";

const TEST_SECRET = "test_auth_secret_minimum_32_characters_long_for_security";

describe("Milestone 7.4: Route Protection Middleware", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = TEST_SECRET;
  });

  async function createSignedCookie(
    payloadOverrides?: Partial<SessionCookiePayload>
  ): Promise<string> {
    const payload: SessionCookiePayload = {
      sessionId: "sess_test_123",
      rawToken: "token_abc_456",
      exp: Date.now() + 8 * 60 * 60 * 1000,
      ...payloadOverrides,
    };
    return await signSessionCookie(payload, TEST_SECRET);
  }

  function createRequest(
    url: string,
    options?: { cookieValue?: string; headers?: Record<string, string> }
  ): NextRequest {
    const headers = new Headers(options?.headers || {});
    if (options?.cookieValue) {
      headers.set("cookie", `${SESSION_COOKIE_NAME}=${options.cookieValue}`);
    }
    return new NextRequest(new URL(url, "https://voidtechsolution.com"), {
      headers,
    });
  }

  describe("Unauthenticated UI Access (/admin/*)", () => {
    it("redirects unauthenticated /admin visit to /admin/login with callbackUrl", async () => {
      const request = createRequest("/admin");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBe(
        "https://voidtechsolution.com/admin/login?callbackUrl=%2Fadmin"
      );
    });

    it("preserves path and query parameters in callbackUrl", async () => {
      const request = createRequest("/admin/users?status=active&page=2");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toBe(
        "https://voidtechsolution.com/admin/login?callbackUrl=%2Fadmin%2Fusers%3Fstatus%3Dactive%26page%3D2"
      );
    });

    it("sanitizes open redirect attempts in callbackUrl when redirecting to login", async () => {
      // If an unauthenticated user somehow accessed with an open redirect query
      const request = createRequest("/admin?returnTo=//evil.com");
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get("location");
      expect(location).toContain("/admin/login?callbackUrl=");
      // The callbackUrl must be properly URL-encoded and sanitized relative path
      expect(location).not.toContain("callbackUrl=%2F%2Fevil.com");
    });

    it("redirects when session cookie is tampered", async () => {
      const validCookie = await createSignedCookie();
      const tamperedCookie = validCookie.replace(/a/g, "b");

      const request = createRequest("/admin", { cookieValue: tamperedCookie });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/admin/login");
    });

    it("redirects when session cookie is expired", async () => {
      const expiredCookie = await createSignedCookie({
        exp: Date.now() - 1000, // 1 second ago
      });

      const request = createRequest("/admin", { cookieValue: expiredCookie });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/admin/login");
    });
  });

  describe("Authenticated UI Access (/admin/*)", () => {
    it("allows authenticated request to /admin to proceed with security headers", async () => {
      const validCookie = await createSignedCookie();
      const request = createRequest("/admin", { cookieValue: validCookie });
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin"
      );
    });

    it("allows authenticated request to deep /admin/services path", async () => {
      const validCookie = await createSignedCookie();
      const request = createRequest("/admin/services", {
        cookieValue: validCookie,
      });
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Login Portal Access (/admin/login)", () => {
    it("allows unauthenticated visitors to view /admin/login", async () => {
      const request = createRequest("/admin/login");
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("redirects already-authenticated users from /admin/login to /admin", async () => {
      const validCookie = await createSignedCookie();
      const request = createRequest("/admin/login", {
        cookieValue: validCookie,
      });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://voidtechsolution.com/admin"
      );
    });

    it("redirects authenticated users to sanitized callbackUrl if provided", async () => {
      const validCookie = await createSignedCookie();
      const request = createRequest(
        "/admin/login?callbackUrl=%2Fadmin%2Fusers",
        { cookieValue: validCookie }
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://voidtechsolution.com/admin/users"
      );
    });

    it("sanitizes malicious external callbackUrl for authenticated user redirect", async () => {
      const validCookie = await createSignedCookie();
      const request = createRequest(
        "/admin/login?callbackUrl=https%3A%2F%2Fevil.com",
        { cookieValue: validCookie }
      );
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "https://voidtechsolution.com/admin"
      );
    });
  });

  describe("Protected Administrative API Routes (/api/admin/*)", () => {
    it("rejects unauthenticated API requests with HTTP 401 Unauthorized", async () => {
      const request = createRequest("/api/admin/users");
      const response = await middleware(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain("Valid administrative session required");
      expect(body.code).toBe("UNAUTHORIZED_ADMIN_SESSION");
    });

    it("rejects API requests with tampered cookies with HTTP 401", async () => {
      const validCookie = await createSignedCookie();
      const tamperedCookie = validCookie + "corrupted";

      const request = createRequest("/api/admin/users", {
        cookieValue: tamperedCookie,
      });
      const response = await middleware(request);

      expect(response.status).toBe(401);
    });

    it("allows authenticated API requests to proceed", async () => {
      const validCookie = await createSignedCookie();
      const request = createRequest("/api/admin/users", {
        cookieValue: validCookie,
      });
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });
  });
});
