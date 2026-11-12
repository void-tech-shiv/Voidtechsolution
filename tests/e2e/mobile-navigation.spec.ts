import { test, expect, Page } from "@playwright/test";

test.describe("Mobile Responsive Navigation & Hero Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  async function openDrawer(page: Page) {
    const triggerBtn = page.getByRole("button", { name: "Open navigation menu" });
    await expect(triggerBtn).toBeVisible();
    const drawer = page.getByRole("dialog", { name: "Mobile Navigation Menu" });

    await expect(async () => {
      if (!(await drawer.isVisible())) {
        await triggerBtn.click();
      }
      await expect(drawer).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 5000 });

    return { triggerBtn, drawer };
  }

  test("opens and closes mobile navigation drawer via trigger and close button", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile drawer is tested on mobile viewports");

    const { drawer } = await openDrawer(page);

    // Close button inside drawer
    const closeBtn = page.getByRole("button", { name: "Close navigation drawer" });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(drawer).not.toBeVisible();
  });

  test("closes mobile drawer upon pressing Escape key", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile drawer is tested on mobile viewports");

    const { drawer } = await openDrawer(page);

    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
  });

  test("locks background body scroll when drawer is open and restores upon close", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile drawer is tested on mobile viewports");

    const { drawer } = await openDrawer(page);

    // Check body overflow style
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();

    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("navigates to selected link and closes drawer", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile drawer is tested on mobile viewports");

    const { drawer } = await openDrawer(page);

    // Click 'Pricing' link in mobile navigation
    const pricingLink = drawer.getByRole("link", { name: "Pricing" });
    await pricingLink.click();

    await expect(page).toHaveURL(/\/pricing/);
    await expect(drawer).not.toBeVisible();
  });

  test("verifies absence of horizontal scroll across narrow and desktop viewports", async ({ page }) => {
    const viewports = [320, 360, 375, 390, 430, 768, 1024, 1440];

    for (const width of viewports) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      // Verify scrollWidth <= clientWidth
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll, `Horizontal overflow detected at ${width}px`).toBe(false);

      // Verify hero heading fits within viewport
      const heading = page.locator("#hero-headline");
      await expect(heading).toBeVisible();
      const headingBox = await heading.boundingBox();
      expect(headingBox).not.toBeNull();
      if (headingBox) {
        expect(headingBox.width).toBeLessThanOrEqual(width);
      }

      // Verify CTAs are visible and clickable
      const startProjectBtn = page.locator("#hero a[href='/#contact']");
      await expect(startProjectBtn).toBeVisible();
      const exploreBtn = page.locator("#hero a[href='/#services']");
      await expect(exploreBtn).toBeVisible();
    }
  });
});

