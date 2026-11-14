import { describe, it, expect } from "vitest";

/**
 * Task 10.1.5.2.2 — Verification Helper & Regression Tests
 *
 * Verifies:
 * 1. Deterministic CSS URL classification (discriminating genuine stylesheets from query parameters).
 * 2. Strict typography verification (rejecting generic fallback as proof of font load).
 */

export function isGenuineCssResource(url: string, contentType: string): boolean {
  let pathname = "";
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  const normalizedContentType = contentType.toLowerCase();
  return pathname.endsWith(".css") || normalizedContentType.includes("text/css");
}

export function validateFontFamilyUsage(computedFont: string): {
  usesInter: boolean;
  usesDefaultTimes: boolean;
  isOnlyGenericFallback: boolean;
} {
  const usesInter = /(?:^|,\s*)["']?Inter["']?(?:,\s*|$)/i.test(computedFont);
  const usesDefaultTimes = /\b(?:Times New Roman|Times|serif)\b/i.test(computedFont) && !computedFont.includes("sans-serif");
  const isOnlyGenericFallback = !usesInter && /(?:system-ui|sans-serif)/i.test(computedFont);

  return {
    usesInter,
    usesDefaultTimes,
    isOnlyGenericFallback,
  };
}

describe("Visual Gate Verification Utilities (Findings B & C)", () => {
  describe("isGenuineCssResource (Finding B)", () => {
    it("identifies Next.js bundled stylesheets as genuine CSS", () => {
      expect(
        isGenuineCssResource("http://localhost:3005/_next/static/css/6d65896d291d35a6.css", "text/css; charset=utf-8")
      ).toBe(true);

      expect(
        isGenuineCssResource("http://localhost:3005/_next/static/css/app/layout.css", "text/css")
      ).toBe(true);
    });

    it("rejects non-CSS endpoints that merely include .css in query parameters", () => {
      expect(
        isGenuineCssResource("http://localhost:3005/api/telemetry?file=bundle.css&action=view", "application/json")
      ).toBe(false);

      expect(
        isGenuineCssResource("https://analytics.example.com/track?page=about.css", "image/gif")
      ).toBe(false);
    });

    it("accepts dynamic CSS endpoints with text/css Content-Type even without .css extension", () => {
      expect(
        isGenuineCssResource("http://localhost:3005/api/theme-styles", "text/css")
      ).toBe(true);
    });
  });

  describe("validateFontFamilyUsage (Finding C)", () => {
    it("confirms Inter font is actively configured and prioritized", () => {
      const realNextFont = 'Inter, "Inter Fallback", system-ui, -apple-system, sans-serif';
      const result = validateFontFamilyUsage(realNextFont);

      expect(result.usesInter).toBe(true);
      expect(result.usesDefaultTimes).toBe(false);
      expect(result.isOnlyGenericFallback).toBe(false);
    });

    it("detects and flags when only generic sans-serif fallback is present without Inter", () => {
      const fallbackOnly = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const result = validateFontFamilyUsage(fallbackOnly);

      expect(result.usesInter).toBe(false);
      expect(result.isOnlyGenericFallback).toBe(true);
    });

    it("detects unstyled browser Times / serif typography", () => {
      const unstyled = 'Times New Roman, serif';
      const result = validateFontFamilyUsage(unstyled);

      expect(result.usesInter).toBe(false);
      expect(result.usesDefaultTimes).toBe(true);
    });
  });
});

