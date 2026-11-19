import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildTrafficReport, getTrafficReport, normalizeTrafficPeriod,
} from "@/server/analytics/cloudflare-traffic";
import { hasPermission } from "@/server/security/rbac";

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const emptyData = {
  totals: [{ count: 31, sum: { visits: 9 } }],
  daily: [{ count: 31, sum: { visits: 9 }, dimensions: { date: "2026-11-19" } }],
  countries: [{ count: 28, dimensions: { countryName: "IN" } }],
  devices: [
    { count: 26, dimensions: { deviceType: "desktop" } },
    { count: 5, dimensions: { deviceType: "mobile" } },
  ],
  browsers: [{ count: 31, dimensions: { userAgentBrowser: "Chrome" } }],
  operatingSystems: [{ count: 31, dimensions: { userAgentOS: "Windows" } }],
  sources: [
    { count: 20, dimensions: { refererHost: "voidtechsolution.codedev.co.in" } },
    { count: 11, dimensions: { refererHost: "" } },
  ],
  pages: [
    { count: 26, dimensions: { requestPath: "/" } },
    { count: 5, dimensions: { requestPath: "/pricing" } },
    { count: 100, dimensions: { requestPath: "/admin/pricing" } },
  ],
};

describe("Cloudflare Traffic Analytics report", () => {
  beforeEach(() => {
    vi.stubEnv("IS_CLOUDFLARE_WORKER", "false");
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account");
    vi.stubEnv("CLOUDFLARE_ANALYTICS_SITE_TAG", "test-site");
    vi.stubEnv("CLOUDFLARE_ANALYTICS_HOST", "voidtechsolution.codedev.co.in");
    vi.stubEnv("CLOUDFLARE_ANALYTICS_API_TOKEN", "test-token-do-not-use");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses the verified account/site/host filters and admin exclusion", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      data: { viewer: { accounts: [emptyData] } },
      errors: [],
    }));
    vi.stubGlobal("fetch", fetchMock);
    const report = await getTrafficReport("7d");
    expect(report.pageViews).toBe(31);
    expect(report.visits).toBe(9);
    expect(report.devices[0]).toEqual({ label: "desktop", views: 26 });
    expect(report.pages.map((x) => x.label)).not.toContain("/admin/pricing");

    const [url, request] = fetchMock.mock.calls[0] as [string, { body: string; headers: Record<string, string> }];
    expect(url).toBe("https://api.cloudflare.com/client/v4/graphql");
    const body = JSON.parse(request.body);
    expect(body.query).toContain("requestPath_notlike: \"/admin%\"");
    expect(body.query).toContain("bot: 0");
    expect(body.variables).toMatchObject({
      account: "test-account",
      site: "test-site",
      hostname: "voidtechsolution.codedev.co.in",
    });
    expect(request.headers.Authorization).toBe("Bearer test-token-do-not-use");
    expect(request.body).not.toContain("test-token-do-not-use");
    expect(JSON.stringify(report)).not.toContain("test-token-do-not-use");
  });

  it("formats countries, sources and zero/empty periods honestly", () => {
    const report = buildTrafficReport(emptyData, "24h", "2026-11-19T00:00:00Z", "2026-11-20T00:00:00Z");
    expect(report.countries[0].label).toBe("India");
    expect(report.sources.map((x) => x.label)).toEqual(["Internal navigation", "Direct / unknown"]);
    expect(report.daily).toHaveLength(1);
    expect(buildTrafficReport({ totals: [] }, "30d", "", "").pageViews).toBe(0);
    expect(buildTrafficReport({ totals: [] }, "30d", "", "").visits).toBe(0);
  });

  it("rejects unconfigured credentials instead of rendering fake metrics", async () => {
    vi.stubEnv("CLOUDFLARE_ANALYTICS_API_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getTrafficReport("7d")).rejects.toThrow(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("handles API failures and GraphQL errors without disclosing secrets", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({ error: "private upstream" }, 403))
      .mockResolvedValueOnce(response({ errors: [{ message: "private upstream" }] })));
    await expect(getTrafficReport("7d")).rejects.toThrow(/HTTP 403/);
    await expect(getTrafficReport("7d")).rejects.toThrow(/rejected the traffic analytics query/);
  });

  it("allows only explicit date-range values", () => {
    expect(normalizeTrafficPeriod("24h")).toBe("24h");
    expect(normalizeTrafficPeriod("30d")).toBe("30d");
    expect(normalizeTrafficPeriod("garbage")).toBe("7d");
    expect(normalizeTrafficPeriod(undefined)).toBe("7d");
  });
});

describe("Traffic analytics access control", () => {
  it("allows agency admins, not content editors", () => {
    expect(hasPermission("SUPER_ADMIN", "traffic:view")).toBe(true);
    expect(hasPermission("ADMIN", "traffic:view")).toBe(true);
    expect(hasPermission("EDITOR", "traffic:view")).toBe(false);
  });
});
