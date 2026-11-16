import { test, expect } from "@playwright/test";

test.describe("Milestone 7.4: Admin Authentication & Route Protection E2E", () => {
  test("redirects unauthenticated visit to /admin to /admin/login with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // URL must be redirected to /admin/login?callbackUrl=%2Fadmin
    expect(page.url()).toContain("/admin/login");
    expect(page.url()).toContain("callbackUrl=");

    // Verify Admin Console Card is rendered
    await expect(page.getByRole("heading", { name: "Admin Console" })).toBeVisible();
    await expect(page.getByLabel(/Administrator Email/i)).toBeVisible();
    await expect(page.getByLabel(/Master Password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Authenticate" })).toBeVisible();
  });

  test("renders security disclaimers and navigation to return to public site", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("domcontentloaded");

    // Restricted portal notice
    await expect(page.getByText(/RESTRICTED PORTAL:/i)).toBeVisible();

    // Link back to public site
    const returnLink = page.getByRole("link", { name: /Return to Public Site/i });
    await expect(returnLink).toBeVisible();
    await returnLink.click();
    await page.waitForURL("**/");

    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("validates required fields on client before submission", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("domcontentloaded");

    const submitBtn = page.getByRole("button", { name: "Authenticate" });
    await submitBtn.click();

    const alert = page.getByTestId("auth-error-banner");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Email address is required.");
  });

  test("validates password length threshold before submission", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByLabel(/Administrator Email/i).fill("admin@voidtechsolution.com");
    await page.getByLabel(/Master Password/i).fill("short");

    const submitBtn = page.getByRole("button", { name: "Authenticate" });
    await submitBtn.click();

    const alert = page.getByTestId("auth-error-banner");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Password must be at least 8 characters.");
  });

  test("rejects invalid credentials with generic anti-enumeration failure alert", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("domcontentloaded");

    await page.getByLabel(/Administrator Email/i).fill("nonexistent@voidtechsolution.com");
    await page.getByLabel(/Master Password/i).fill("InvalidPassword123!");

    const submitBtn = page.getByRole("button", { name: "Authenticate" });
    await submitBtn.click();

    // Should display generic authentication failure without disclosing whether the user exists
    const alert = page.getByTestId("auth-error-banner");
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText("Invalid email or password.");
  });

  test("toggles password visibility between password and text input types", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("domcontentloaded");

    const passwordInput = page.getByLabel(/Master Password/i);
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = page.getByLabel("Show password");
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    const hideBtn = page.getByLabel("Hide password");
    await hideBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});
