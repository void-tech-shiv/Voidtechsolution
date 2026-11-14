import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { GET as enableDraftHandler } from "@/app/api/draft-mode/enable/route";
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

describe("Task 10.3.3: Next.js Draft Mode Preview Subsystem & Indexing Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API Route: /api/draft-mode/enable", () => {
    it("rejects activation with HTTP 401 when preview secret token is missing or invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/draft-mode/enable?secret=wrong_token");
      const res = await enableDraftHandler(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("INVALID_PREVIEW_SECRET");
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it("activates draft mode and sets X-Robots-Tag: noindex, nofollow on valid secret token", async () => {
      const validSecret = process.env.DRAFT_MODE_SECRET || "voidtech_draft_preview_secret_2026";
      const req = new NextRequest(
        `http://localhost:3000/api/draft-mode/enable?secret=${validSecret}&redirect=/services`
      );
      const res = await enableDraftHandler(req);

      expect(res.status).toBe(307); // Next.js redirect
      expect(mockEnable).toHaveBeenCalledTimes(1);
      expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(res.headers.get("Location")).toContain("/services");
    });
  });

  describe("API Route: /api/draft-mode/disable", () => {
    it("disables draft mode and redirects to target", async () => {
      const req = new NextRequest("http://localhost:3000/api/draft-mode/disable?redirect=/pricing");
      const res = await disableDraftHandler(req);

      expect(res.status).toBe(307);
      expect(mockDisable).toHaveBeenCalledTimes(1);
      expect(res.headers.get("Location")).toContain("/pricing");
    });
  });

  describe("DraftModeHudBanner Component", () => {
    it("renders persistent amber warning banner with exit button", () => {
      render(<DraftModeHudBanner />);

      const banner = screen.getByRole("complementary", { name: /draft mode preview active/i });
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveClass("bg-gradient-to-r");

      expect(screen.getByText(/DRAFT MODE PREVIEW ACTIVE:/i)).toBeInTheDocument();
      expect(screen.getByText(/Search indexing blocked/i)).toBeInTheDocument();

      const exitLink = screen.getByRole("link", { name: /Exit Preview/i });
      expect(exitLink).toHaveAttribute("href", "/api/draft-mode/disable");
    });
  });
});
