import { describe, it, expect } from "vitest";
import {
  sanitizeCallbackUrl,
  signSessionCookie,
  verifySessionCookie,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/server/security/cookie";

const TEST_SECRET = "super_secure_32_char_test_secret_for_cookies";

describe("Milestone 7.4: Edge-Safe Session Cookie Engine", () => {
  describe("sanitizeCallbackUrl (Open Redirect Protection)", () => {
    it("returns /admin for null, undefined, or empty string", () => {
      expect(sanitizeCallbackUrl(null)).toBe("/admin");
      expect(sanitizeCallbackUrl(undefined)).toBe("/admin");
      expect(sanitizeCallbackUrl("")).toBe("/admin");
      expect(sanitizeCallbackUrl("   ")).toBe("/admin");
    });

    it("allows valid relative paths within the application", () => {
      expect(sanitizeCallbackUrl("/admin")).toBe("/admin");
      expect(sanitizeCallbackUrl("/admin/users")).toBe("/admin/users");
      expect(sanitizeCallbackUrl("/admin/enquiries?status=NEW")).toBe(
        "/admin/enquiries?status=NEW"
      );
      expect(sanitizeCallbackUrl("/admin/services/edit/123")).toBe(
        "/admin/services/edit/123"
      );
    });

    it("rejects absolute URLs with protocol/scheme", () => {
      expect(sanitizeCallbackUrl("https://evil.com")).toBe("/admin");
      expect(sanitizeCallbackUrl("http://evil.com/admin")).toBe("/admin");
      expect(sanitizeCallbackUrl("ftp://evil.com")).toBe("/admin");
      expect(sanitizeCallbackUrl("javascript:alert(1)")).toBe("/admin");
      expect(sanitizeCallbackUrl("data:text/html,<script></script>")).toBe(
        "/admin"
      );
    });

    it("rejects protocol-relative URLs (//evil.com)", () => {
      expect(sanitizeCallbackUrl("//evil.com")).toBe("/admin");
      expect(sanitizeCallbackUrl("//evil.com/admin")).toBe("/admin");
      expect(sanitizeCallbackUrl("///evil.com")).toBe("/admin");
    });

    it("rejects Windows backslash bypasses (/\\evil.com)", () => {
      expect(sanitizeCallbackUrl("/\\evil.com")).toBe("/admin");
      expect(sanitizeCallbackUrl("/\\/evil.com")).toBe("/admin");
    });

    it("rejects paths with CR/LF or tab control characters (HTTP response splitting)", () => {
      expect(sanitizeCallbackUrl("/admin\r\nSet-Cookie: evil=1")).toBe("/admin");
      expect(sanitizeCallbackUrl("/admin\nLocation: evil.com")).toBe("/admin");
      expect(sanitizeCallbackUrl("/admin\tattack")).toBe("/admin");
    });

    it("allows custom default return URL when fallback provided", () => {
      expect(sanitizeCallbackUrl(null, "/custom-fallback")).toBe(
        "/custom-fallback"
      );
      expect(sanitizeCallbackUrl("https://evil.com", "/custom-fallback")).toBe(
        "/custom-fallback"
      );
    });
  });

  describe("signSessionCookie & verifySessionCookie", () => {
    it("correctly signs and verifies valid session payload", async () => {
      const payload = {
        sessionId: "sess_edge_123",
        rawToken: "token_edge_abc",
        exp: Date.now() + 10000,
      };

      const signed = await signSessionCookie(payload, TEST_SECRET);
      expect(signed).toContain(".");

      const verified = await verifySessionCookie(signed, TEST_SECRET);
      expect(verified).not.toBeNull();
      expect(verified?.sessionId).toBe(payload.sessionId);
      expect(verified?.rawToken).toBe(payload.rawToken);
      expect(verified?.exp).toBe(payload.exp);
    });

    it("rejects signature signed with different secret", async () => {
      const payload = {
        sessionId: "sess_edge_123",
        rawToken: "token_edge_abc",
        exp: Date.now() + 10000,
      };

      const signed = await signSessionCookie(payload, TEST_SECRET);
      const verified = await verifySessionCookie(signed, "different_secret_key_32_characters_long");
      expect(verified).toBeNull();
    });

    it("rejects cryptographically expired payload", async () => {
      const payload = {
        sessionId: "sess_edge_123",
        rawToken: "token_edge_abc",
        exp: Date.now() - 5000, // Expired
      };

      const signed = await signSessionCookie(payload, TEST_SECRET);
      const verified = await verifySessionCookie(signed, TEST_SECRET);
      expect(verified).toBeNull();
    });

    it("rejects tampered signature", async () => {
      const payload = {
        sessionId: "sess_edge_123",
        rawToken: "token_edge_abc",
        exp: Date.now() + 10000,
      };

      const signed = await signSessionCookie(payload, TEST_SECRET);
      const [data, sig = ""] = signed.split(".");
      const tamperedSig = sig.slice(0, -2) + "00";
      const verified = await verifySessionCookie(`${data}.${tamperedSig}`, TEST_SECRET);
      expect(verified).toBeNull();
    });

    it("rejects malformed cookie values", async () => {
      expect(await verifySessionCookie("", TEST_SECRET)).toBeNull();
      expect(await verifySessionCookie("nosignature", TEST_SECRET)).toBeNull();
      expect(await verifySessionCookie("invalid.data.with.many.parts", TEST_SECRET)).toBeNull();
    });
  });

  describe("getSessionCookieOptions", () => {
    it("returns correct security flags in production mode", () => {
      const opts = getSessionCookieOptions(true);
      expect(opts.name).toBe(SESSION_COOKIE_NAME);
      expect(opts.httpOnly).toBe(true);
      expect(opts.secure).toBe(true);
      expect(opts.sameSite).toBe("lax");
      expect(opts.path).toBe("/");
      expect(opts.maxAge).toBe(28800); // 8 hours in seconds
    });

    it("allows non-secure cookie only in local development mode", () => {
      const opts = getSessionCookieOptions(false);
      expect(opts.httpOnly).toBe(true);
      expect(opts.secure).toBe(false);
      expect(opts.sameSite).toBe("lax");
    });
  });
});
