import { test, expect } from "@playwright/test";

const REMEDIATED_ADMIN_ROUTES = [
  { path: "/admin/users", name: "Team & Access Control" },
  { path: "/admin/audit-logs", name: "Audit Trail & Security Logs" },
  { path: "/admin/settings", name: "Platform Settings" },
  { path: "/admin/enquiries", name: "Client Enquiries & Leads" },
  { path: "/admin/services", name: "Services Catalog" },
  { path: "/admin/pricing", name: "Pricing Packages" },
  { path: "/admin/portfolio", name: "Portfolio Prototypes" },
  { path: "/admin/faqs", name: "Knowledgebase FAQs" },
] as const;

test.describe("Admin Console Route Remediation & 404 Verification (E2E)", () => {
  for (const route of REMEDIATED_ADMIN_ROUTES) {
    test(`unauthenticated visit to ${route.path} redirects to login with callbackUrl without 404`, async ({
      page,
    }) => {
      const response = await page.goto(route.path);
      await page.waitForLoadState("domcontentloaded");

      // Verify response status is not 404
      expect(response?.status()).not.toBe(404);

      // Verify redirection to /admin/login with callbackUrl preserved
      expect(page.url()).toContain("/admin/login");
      expect(page.url()).toContain("callbackUrl=");
      expect(page.url()).toContain(encodeURIComponent(route.path));

      // Verify the Admin Console login interface is rendered cleanly without 404 or uncaught exceptions
      await expect(page.getByRole("heading", { name: "Admin Console" })).toBeVisible();
      await expect(page.getByLabel(/Administrator Email/i)).toBeVisible();
      await expect(page.getByLabel(/Master Password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: "Authenticate" })).toBeVisible();

      // Ensure page does NOT contain 404 indicators
      await expect(page.getByText("404", { exact: true })).not.toBeVisible();
      await expect(page.getByText(/This page could not be found/i)).not.toBeVisible();
    });
  }

  test("verifies all 8 admin routes have active route handlers and no Next.js build missing route errors", async ({
    request,
  }) => {
    for (const route of REMEDIATED_ADMIN_ROUTES) {
      // Direct HTTP GET request without cookies
      const res = await request.get(route.path, {
        maxRedirects: 0,
      });

      // Next.js middleware redirects unauthenticated requests with 307 Temporary Redirect
      expect([307, 308, 302, 303]).toContain(res.status());
      const location = res.headers()["location"];
      expect(location).toBeDefined();
      expect(location).toContain("/admin/login");
      expect(location).toContain(encodeURIComponent(route.path));
    }
  });

  test("admin login portal renders without horizontal overflow on mobile viewports", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("domcontentloaded");

    // Check no horizontal scrollbar / overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Horizontal scroll width must not exceed viewport width
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // Verify key UI elements fit inside viewport
    const formCard = page.getByRole("heading", { name: "Admin Console" });
    await expect(formCard).toBeVisible();
  });
});
