import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import {
  GET as enableDraftGetHandler,
  POST as enableDraftPostHandler,
} from "@/app/api/draft-mode/enable/route";
import { GET as disableDraftHandler } from "@/app/api/draft-mode/disable/route";
import { DraftModeHudBanner } from "@/components/layout/draft-mode-hud-banner";
import { NextRequest } from "next/server";

// Mock next/headers draftMode
const mockEnable = vi.fn();
const mockDisable = vi.fn();

vi.mock("next/headers", () => ({
  draftMode: () =>
    Promise.resolve({
      enable: mockEnable,
      disable: mockDisable,
      isEnabled: true,
    }),
}));

describe("Task 10.4.6.1 Finding C: Secure POST-Based Draft Mode Activation & Origin Defense", () => {
  const originalEnv = process.env.DRAFT_MODE_SECRET;
  const TEST_SECRET = "super_secure_draft_mode_test_secret_32_chars";
  const BASE_URL = "http://localhost:3000/api/draft-mode/enable";

  const createValidPostRequest = (body: Record<string, unknown> | string, headers: Record<string, string> = {}) => {
    return new NextRequest(BASE_URL, {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "content-type": "application/json",
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DRAFT_MODE_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    process.env.DRAFT_MODE_SECRET = originalEnv;
  });

  describe("Method & Request Payload Validation", () => {
    it("rejects GET activation with HTTP 405 Method Not Allowed and sets Allow: POST", async () => {
      const res = await enableDraftGetHandler();

      expect(res.status).toBe(405);
      const json = await res.json();
      expect(json.code).toBe("METHOD_NOT_ALLOWED");
      expect(res.headers.get("Allow")).toBe("POST");
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it("rejects malformed non-JSON body with HTTP 400 Bad Request", async () => {
      const req = createValidPostRequest("{ invalid json body");
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("INVALID_REQUEST_BODY");
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it("rejects non-object JSON body (e.g. array or primitive) with HTTP 400", async () => {
      const req = createValidPostRequest([1, 2, 3] as any);
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("INVALID_REQUEST_BODY");
      expect(mockEnable).not.toHaveBeenCalled();
    });
  });

  describe("Origin & CSRF Defense", () => {
    it("rejects cross-origin activation with HTTP 403 Forbidden", async () => {
      const req = createValidPostRequest(
        { secret: TEST_SECRET, redirect: "/services" },
        { origin: "http://evil-attacker.com" }
      );
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe("CSRF_ORIGIN_MISMATCH");
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it("rejects request when Origin header is completely missing", async () => {
      const req = new NextRequest(BASE_URL, {
        method: "POST",
        headers: {
          host: "localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({ secret: TEST_SECRET }),
      });
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe("CSRF_ORIGIN_MISMATCH");
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it("rejects request when Host header does not match trusted host allowlist", async () => {
      const req = createValidPostRequest(
        { secret: TEST_SECRET },
        {
          host: "evil-host-spoof.com",
          origin: "http://evil-host-spoof.com",
        }
      );
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(403);
      expect(mockEnable).not.toHaveBeenCalled();
    });
  });

  describe("Secret Configuration & Authentication", () => {
    it("fails closed with HTTP 500 when DRAFT_MODE_SECRET is missing from environment", async () => {
      delete process.env.DRAFT_MODE_SECRET;

      const req = createValidPostRequest({ secret: "any_token" });
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.code).toBe("PREVIEW_UNAVAILABLE");
      expect(mockEnable).not.toHaveBeenCalled();
      expect(JSON.stringify(json)).not.toContain("DRAFT_MODE_SECRET");
    });

    it("fails closed with HTTP 500 when DRAFT_MODE_SECRET is empty string or whitespace", async () => {
      process.env.DRAFT_MODE_SECRET = "   ";

      const req = createValidPostRequest({ secret: "any_token" });
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.code).toBe("PREVIEW_UNAVAILABLE");
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it("rejects request with HTTP 401 when token is missing in body", async () => {
      const req = createValidPostRequest({ redirect: "/services" });
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("INVALID_PREVIEW_SECRET");
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it("rejects request with HTTP 401 when token is incorrect", async () => {
      const req = createValidPostRequest({
        secret: "invalid_secret_token_123",
        redirect: "/pricing",
      });
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("INVALID_PREVIEW_SECRET");
      expect(mockEnable).not.toHaveBeenCalled();
      // Ensure submitted token value is never echoed in error response
      expect(JSON.stringify(json)).not.toContain("invalid_secret_token_123");
    });

    it("activates draft mode and sets security headers on valid secret POST", async () => {
      const req = createValidPostRequest({
        secret: TEST_SECRET,
        redirect: "/services",
      });
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.redirect).toBe("/services");
      expect(mockEnable).toHaveBeenCalledTimes(1);
      expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(res.headers.get("Location")).toBe("/services");
      // Verify token never appears in redirect destination
      expect(json.redirect).not.toContain(TEST_SECRET);
    });
  });

  describe("Safe Redirect Sanitization", () => {
    it("rejects external URLs, protocol-relative URLs, and backslash evasions", async () => {
      const evilRedirects = [
        "https://attacker.example.com",
        "//attacker.example.com",
        "\\attacker.example.com",
        "/\\attacker.example.com",
        "/%2Fattacker.example.com",
        "/%5Cattacker.example.com",
      ];

      for (const evilUrl of evilRedirects) {
        const req = createValidPostRequest({
          secret: TEST_SECRET,
          redirect: evilUrl,
        });
        const res = await enableDraftPostHandler(req);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.redirect).toBe("/");
        expect(res.headers.get("Location")).toBe("/");
      }
    });

    it("accepts valid internal paths, query strings, and hashes", async () => {
      const validPaths = [
        "/services",
        "/pricing?plan=custom",
        "/about#values",
        "/portfolio/algorithmic-liquidity-engine",
      ];

      for (const validPath of validPaths) {
        const req = createValidPostRequest({
          secret: TEST_SECRET,
          redirect: validPath,
        });
        const res = await enableDraftPostHandler(req);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.redirect).toBe(validPath);
        expect(res.headers.get("Location")).toBe(validPath);
      }
    });

    it("defaults redirect to '/' when redirect is omitted or null", async () => {
      const req = createValidPostRequest({ secret: TEST_SECRET });
      const res = await enableDraftPostHandler(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.redirect).toBe("/");
    });
  });

  describe("API Route: /api/draft-mode/disable", () => {
    it("disables draft mode and redirects safely with no-store headers", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/draft-mode/disable?redirect=https://evil.com"
      );
      const res = await disableDraftHandler(req);

      expect(res.status).toBe(307);
      expect(mockDisable).toHaveBeenCalledTimes(1);
      expect(res.headers.get("Location")).toBe("http://localhost:3000/");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("disables draft mode and redirects to legitimate internal path", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/draft-mode/disable?redirect=/pricing"
      );
      const res = await disableDraftHandler(req);

      expect(res.status).toBe(307);
      expect(mockDisable).toHaveBeenCalledTimes(1);
      expect(res.headers.get("Location")).toBe("http://localhost:3000/pricing");
    });
  });

  describe("DraftModeHudBanner Component", () => {
    it("renders persistent amber warning banner with exit button", () => {
      render(<DraftModeHudBanner />);

      const banner = screen.getByRole("complementary", {
        name: /draft mode preview active/i,
      });
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveClass("bg-gradient-to-r");

      expect(screen.getByText(/DRAFT MODE PREVIEW ACTIVE:/i)).toBeInTheDocument();
      expect(screen.getByText(/Search indexing blocked/i)).toBeInTheDocument();

      const exitLink = screen.getByRole("link", { name: /Exit Preview/i });
      expect(exitLink).toHaveAttribute("href", "/api/draft-mode/disable");
    });
  });
});
