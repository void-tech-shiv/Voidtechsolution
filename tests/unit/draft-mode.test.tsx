import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import {
  GET as enableDraftHandler,
  safeInternalRedirectPath,
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

describe("Task 10.4.6 Finding A: Draft Mode Security & Safe Redirect Remediation", () => {
  const originalEnv = process.env.DRAFT_MODE_SECRET;
  const TEST_SECRET = "super_secure_draft_mode_test_secret_32_chars";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DRAFT_MODE_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    process.env.DRAFT_MODE_SECRET = originalEnv;
  });

  describe("A.1 & A.2: Secret Configuration & Authentication Enforcement", () => {
    it("fails closed with HTTP 500 when DRAFT_MODE_SECRET is missing from environment", async () => {
      delete process.env.DRAFT_MODE_SECRET;

      const req = new NextRequest(
        "http://localhost:3000/api/draft-mode/enable?secret=any_token"
      );
      const res = await enableDraftHandler(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.code).toBe("PREVIEW_UNAVAILABLE");
      expect(mockEnable).not.toHaveBeenCalled();
      // Ensure no environment or secret leak
      expect(JSON.stringify(json)).not.toContain("DRAFT_MODE_SECRET");
    });

    it("fails closed with HTTP 500 when DRAFT_MODE_SECRET is empty string or whitespace", async () => {
      process.env.DRAFT_MODE_SECRET = "   ";

      const req = new NextRequest(
        "http://localhost:3000/api/draft-mode/enable?secret=any_token"
      );
      const res = await enableDraftHandler(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.code).toBe("PREVIEW_UNAVAILABLE");
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it("rejects request with HTTP 401 when token is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/draft-mode/enable");
      const res = await enableDraftHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("INVALID_PREVIEW_SECRET");
      expect(mockEnable).not.toHaveBeenCalled();
      expect(res.headers.get("Cache-Control")).toContain("no-store");
    });

    it("rejects request with HTTP 401 when token is incorrect", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/draft-mode/enable?secret=invalid_attempt_123"
      );
      const res = await enableDraftHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("INVALID_PREVIEW_SECRET");
      expect(mockEnable).not.toHaveBeenCalled();
      // Ensure submitted token value is never echoed in error response
      expect(JSON.stringify(json)).not.toContain("invalid_attempt_123");
    });

    it("activates draft mode and sets security headers on valid secret token", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/draft-mode/enable?secret=${TEST_SECRET}&redirect=/services`
      );
      const res = await enableDraftHandler(req);

      expect(res.status).toBe(307); // Next.js redirect
      expect(mockEnable).toHaveBeenCalledTimes(1);
      expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(res.headers.get("Location")).toContain("/services");
    });
  });

  describe("A.3: Open Redirect Prevention & Path Sanitization", () => {
    const baseUrl = "http://localhost:3000/api/draft-mode/enable";

    it("rejects external absolute URLs and falls back to '/'", () => {
      expect(safeInternalRedirectPath("https://attacker.example.com", baseUrl)).toBe("/");
      expect(safeInternalRedirectPath("http://evil.com/path", baseUrl)).toBe("/");
    });

    it("rejects protocol-relative URLs and falls back to '/'", () => {
      expect(safeInternalRedirectPath("//attacker.example.com", baseUrl)).toBe("/");
      expect(safeInternalRedirectPath("//google.com", baseUrl)).toBe("/");
    });

    it("rejects backslash-based redirect evasions and falls back to '/'", () => {
      expect(safeInternalRedirectPath("\\attacker.example.com", baseUrl)).toBe("/");
      expect(safeInternalRedirectPath("/\\attacker.example.com", baseUrl)).toBe("/");
      expect(safeInternalRedirectPath("/path\\to\\danger", baseUrl)).toBe("/");
    });

    it("rejects encoded slash and backslash bypass attempts", () => {
      expect(safeInternalRedirectPath("/%2Fattacker.example.com", baseUrl)).toBe("/");
      expect(safeInternalRedirectPath("/%5Cattacker.example.com", baseUrl)).toBe("/");
    });

    it("accepts valid internal paths, query strings, and hash fragments", () => {
      expect(safeInternalRedirectPath("/services", baseUrl)).toBe("/services");
      expect(safeInternalRedirectPath("/pricing?plan=custom", baseUrl)).toBe("/pricing?plan=custom");
      expect(safeInternalRedirectPath("/about#values", baseUrl)).toBe("/about#values");
    });

    it("falls back to '/' when redirect is omitted, empty, or whitespace", () => {
      expect(safeInternalRedirectPath(null, baseUrl)).toBe("/");
      expect(safeInternalRedirectPath("", baseUrl)).toBe("/");
      expect(safeInternalRedirectPath("   ", baseUrl)).toBe("/");
    });

    it("enable route redirects safely to '/' when attacker supplies evil redirect", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/draft-mode/enable?secret=${TEST_SECRET}&redirect=https://evil.com`
      );
      const res = await enableDraftHandler(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("Location")).toBe("http://localhost:3000/");
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
