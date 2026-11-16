import { describe, it, expect, vi } from "vitest";
import {
  sanitizeErrorMessage,
  logFallbackEvent,
  FALLBACK_HEADER_NAME,
  FALLBACK_HEADER_VALUE,
} from "@/lib/cms/fallback-handler";

describe("Task 10.1.12: 5-Scenario Static Fallback Integration & Sanitized Logging", () => {
  it("sanitizes postgresql connection strings and credentials from error logs", () => {
    const rawError = new Error(
      "FATAL: Connection to postgresql://postgres:supersecretpassword@neon.tech:5432/voidtech failed with ECONNREFUSED"
    );
    const sanitized = sanitizeErrorMessage(rawError);

    expect(sanitized).not.toContain("supersecretpassword");
    expect(sanitized).not.toContain("neon.tech");
    expect(sanitized).toContain("postgresql://[REDACTED]@[REDACTED]");
  });

  it("sanitizes password and token query parameters", () => {
    const rawError = "Error connecting with ?password=myadminsecret&token=abc123xyz";
    const sanitized = sanitizeErrorMessage(rawError);

    expect(sanitized).not.toContain("myadminsecret");
    expect(sanitized).not.toContain("abc123xyz");
    expect(sanitized).toContain("password=[REDACTED]");
    expect(sanitized).toContain("token=[REDACTED]");
  });

  it("emits structured JSON log for Scenario 1: Database Unavailable", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logFallbackEvent({
      level: "WARN",
      event: "CMS_FALLBACK_TRIGGERED",
      scenario: "DB_UNAVAILABLE",
      entity: "services",
      error: new Error("postgresql://user:pass@host/db Connection timeout"),
    });

    expect(warnSpy).toHaveBeenCalled();
    const logCall = warnSpy.mock.calls[0]?.[0];
    expect(logCall).toBeDefined();
    expect(logCall).toContain("[CMS_FALLBACK]");
    expect(logCall).toContain('"scenario":"DB_UNAVAILABLE"');
    expect(logCall).not.toContain("pass");

    warnSpy.mockRestore();
  });

  it("emits structured JSON log for Scenario 2: Empty Table", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logFallbackEvent({
      level: "INFO",
      event: "CMS_EMPTY_TABLE_FALLBACK",
      scenario: "EMPTY_TABLE",
      entity: "pricing_packages",
    });

    expect(infoSpy).toHaveBeenCalled();
    const logCall = infoSpy.mock.calls[0]?.[0];
    expect(logCall).toBeDefined();
    expect(logCall).toContain('"event":"CMS_EMPTY_TABLE_FALLBACK"');
    expect(logCall).toContain('"entity":"pricing_packages"');


    infoSpy.mockRestore();
  });

  it("defines standard HTTP headers for source attribution", () => {
    expect(FALLBACK_HEADER_NAME).toBe("X-Voidtech-Content-Source");
    expect(FALLBACK_HEADER_VALUE).toBe("static-fallback");
  });
});
