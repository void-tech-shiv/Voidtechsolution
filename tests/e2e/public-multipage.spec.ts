import { test, expect } from "@playwright/test";

test.describe("Public Website Multi-Page Architecture E2E", () => {
  const publicRoutes = [
    { name: "Home", path: "/", expectedTitle: /VOIDTECH SOLUTION/i },
    { name: "About", path: "/about", expectedTitle: /About/i },
    { name: "Services", path: "/services", expectedTitle: /Services/i },
    { name: "Pricing", path: "/pricing", expectedTitle: /Pricing/i },
    { name: "Portfolio", path: "/portfolio", expectedTitle: /Portfolio|Concept/i },
    { name: "Contact", path: "/contact", expectedTitle: /Contact|Inquiry/i },
  ];

  test("all 6 public pages load successfully with HTTP 200 and correct metadata", async ({ page }) => {
    for (const route of publicRoutes) {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(route.expectedTitle);
    }
  });

  test("desktop header highlights active page link for each route", async ({ page }) => {
    // Only applies to desktop viewports (md:flex >= 768px)
    if (!page.viewportSize() || page.viewportSize()!.width < 768) {
      test.skip();
    }

    for (const route of publicRoutes) {
      await page.goto(route.path);
      const activeLink = page.locator(`header nav[aria-label='Desktop Navigation'] a[href='${route.path}']`);
      await expect(activeLink).toBeVisible();
      await expect(activeLink).toHaveClass(/text-electric-purple/);
    }
  });

  test("services page filters by category tab and performs live keyword search", async ({ page }) => {
    await page.goto("/services");

    // Verify initial count shows 18 services
    await expect(page.locator("h1")).toContainText("Engineering Scalable Software Across 18 Core Tracks.");
    await expect(page.getByRole("button", { name: /All Services/i })).toBeVisible();

    // Click "Mobile" tab
    const mobileTab = page.getByRole("button", { name: "Mobile" });
    await mobileTab.click();
    await expect(page.getByRole("heading", { name: "App Development", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Website Development", level: 3 })).not.toBeVisible();

    // Reset to "All Services"
    await page.getByRole("button", { name: /All Services/i }).click();
    await expect(page.getByRole("heading", { name: "Website Development", level: 3 })).toBeVisible();

    // Search by keyword
    const searchInput = page.getByPlaceholder("Search capabilities or tech...");
    await searchInput.fill("Telegram");
    await expect(page.getByRole("heading", { name: "Telegram Bots", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Website Development", level: 3 })).not.toBeVisible();
  });

  test("clicking 'Inquire for {service.title}' on /services navigates to /contact with query pre-fill", async ({ page }) => {
    await page.goto("/services");

    // Click first service card CTA (Website Development)
    const inquireBtn = page.locator("a[href*='/contact?service=Website%20Development']").first();
    await inquireBtn.click();

    // Verify URL
    await page.waitForURL("**/contact?service=Website%20Development");
    expect(page.url()).toContain("/contact?service=Website%20Development");

    // Verify inquiry focus banner
    await expect(page.getByText("Inquiry Focus:")).toBeVisible();
    await expect(page.locator("strong", { hasText: "Website Development" })).toBeVisible();

    // Click "Continue: Technical Specs" to verify prefilled message
    await page.getByRole("button", { name: "Continue: Technical Specs" }).click();
    const briefTextarea = page.locator("#projectBrief");
    await expect(briefTextarea).toBeVisible();
    await expect(briefTextarea).toHaveValue(/I would like to discuss requirements for Website Development\./);
  });

  test("mobile navigation drawer opens, displays all 6 routes, and navigates", async ({ page }) => {
    // Only applies to mobile viewports
    if (page.viewportSize() && page.viewportSize()!.width >= 768) {
      test.skip();
    }
    await page.goto("/");

    // Open mobile menu with hydration retry
    const menuBtn = page.getByRole("button", { name: "Open navigation menu" });
    const drawer = page.getByRole("dialog", { name: "Mobile Navigation Menu" });
    await expect(async () => {
      if (!(await drawer.isVisible())) {
        await menuBtn.click();
      }
      await expect(drawer).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 5000 });

    // Check all 6 route links exist in drawer
    for (const route of publicRoutes) {
      const drawerLink = drawer.getByRole("link", { name: route.name, exact: true });
      await expect(drawerLink).toBeVisible();
    }

    // Click "Services" in mobile drawer
    const servicesDrawerLink = drawer.getByRole("link", { name: "Services", exact: true });
    await servicesDrawerLink.click();

    // Verify navigated to /services and drawer closed
    await page.waitForURL("**/services");
    expect(page.url()).toContain("/services");
    await expect(page.getByRole("dialog", { name: "Mobile Navigation Menu" })).not.toBeVisible();
  });
});

