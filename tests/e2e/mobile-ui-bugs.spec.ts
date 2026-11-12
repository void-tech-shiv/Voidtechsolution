import { test, expect } from "@playwright/test";

test.describe("Mobile UI Bug Fixes & Responsive Polish Verification", () => {
  // Test across critical mobile viewports: 320px, 360px, 375px, 390px, 430px
  const mobileWidths = [320, 360, 375, 390, 430];

  for (const width of mobileWidths) {
    test(`[${width}px] BUG 1: Exactly ONE visible brand logo and ONE menu/close control in mobile header`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 667 });
      await page.goto("/contact");

      // Verify header is visible
      const header = page.locator("header");
      await expect(header).toBeVisible();

      // Ensure exactly ONE BrandLogo in the header
      const headerLogos = header.locator("a[aria-label='VOIDTECH SOLUTION Home']");
      await expect(headerLogos).toHaveCount(1);
      await expect(headerLogos.first()).toBeVisible();

      // Ensure exactly ONE menu button in the header
      const menuButton = header.locator("button[aria-controls='mobile-nav-drawer']");
      await expect(menuButton).toHaveCount(1);
      await expect(menuButton).toBeVisible();
      await expect(menuButton).toHaveAttribute("aria-expanded", "false");

      // Verify logo and menu button are on the same horizontal row
      const logoBox = await headerLogos.first().boundingBox();
      const buttonBox = await menuButton.boundingBox();
      expect(logoBox).not.toBeNull();
      expect(buttonBox).not.toBeNull();
      if (logoBox && buttonBox) {
        expect(Math.abs(logoBox.y - buttonBox.y)).toBeLessThan(16);
      }

      // Open drawer
      await menuButton.click();
      await expect(menuButton).toHaveAttribute("aria-expanded", "true");

      // When open, the mobile drawer portal is mounted
      const drawer = page.locator("#mobile-nav-drawer");
      await expect(drawer).toBeVisible();

      // Verify there is still strictly ONE visible BrandLogo in the header (at top:0)
      const allVisibleLogos = page.locator("header a[aria-label='VOIDTECH SOLUTION Home']");
      await expect(allVisibleLogos).toHaveCount(1);
      await expect(allVisibleLogos.first()).toBeVisible();

      // Ensure drawer panel does NOT render a duplicate brand logo inside #mobile-nav-drawer
      const drawerLogos = drawer.locator("a[aria-label='VOIDTECH SOLUTION Home'], div[aria-label='VOIDTECH SOLUTION Home']");
      await expect(drawerLogos).toHaveCount(0);

      // Verify exactly ONE close button in the header (the toggled trigger)
      await expect(menuButton).toHaveAttribute("aria-label", "Close navigation drawer");

      // Close the drawer by clicking the toggle button
      await menuButton.click();
      await expect(drawer).toBeHidden();
    });

    test(`[${width}px] BUG 2: Continue: Technical Specs button text and arrow stay on ONE line`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 667 });
      await page.goto("/contact");

      // Locate the step 1 button
      const continueBtn = page.locator("button:has-text('Continue: Technical Specs')");
      await expect(continueBtn).toBeVisible();

      // Verify button height is at least 44px for touch accessibility (WCAG 2.5.5 target size)
      const btnBox = await continueBtn.boundingBox();
      expect(btnBox).not.toBeNull();
      expect(btnBox!.height).toBeGreaterThanOrEqual(44);

      // Inspect text span and arrow SVG inside the button
      const textSpan = continueBtn.locator("span.whitespace-nowrap").first();
      const arrowSvg = continueBtn.locator("svg");

      await expect(textSpan).toBeVisible();
      await expect(arrowSvg).toBeVisible();

      const innerHtml = await continueBtn.innerHTML();
      console.log("continueBtn innerHTML:", innerHtml);

      const textBox = await textSpan.boundingBox();
      const arrowBox = await arrowSvg.boundingBox();
      console.log("Boxes:", { textBox, arrowBox });

      expect(textBox).not.toBeNull();
      expect(arrowBox).not.toBeNull();

      if (textBox && arrowBox) {
        // Text is at left, arrow is at right of text
        expect(arrowBox.x).toBeGreaterThanOrEqual(textBox.x + textBox.width - 2);

        // Arrow MUST be on the exact same horizontal line as the text, NOT wrapped below it!
        const verticalDiff = Math.abs(arrowBox.y + arrowBox.height / 2 - (textBox.y + textBox.height / 2));
        expect(verticalDiff).toBeLessThan(8); // within 8px of exact vertical center alignment
      }
    });

    test(`[${width}px] BUG 4: Zero horizontal scrolling or page overflow on /contact`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 667 });
      await page.goto("/contact");

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    });
  }

  test("BUG 5: Mobile navigation drawer behavior (Escape, Backdrop, Links, Scroll Lock)", async ({
    page,
  }) => {
    // 1. Mobile viewport test: Scroll lock and Escape dismissal
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/contact");

    const menuButton = page.locator("header button[aria-controls='mobile-nav-drawer']");
    const drawer = page.locator("#mobile-nav-drawer");

    // Open drawer
    await menuButton.click();
    await expect(drawer).toBeVisible();

    // Verify body scroll is locked
    const isScrollLocked = await page.evaluate(() => {
      return document.body.style.overflow === "hidden";
    });
    expect(isScrollLocked).toBe(true);

    // Escape key closes drawer
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    // Verify body scroll restored
    const isScrollRestored = await page.evaluate(() => {
      return document.body.style.overflow !== "hidden";
    });
    expect(isScrollRestored).toBe(true);

    // 2. Open drawer again and close via navigation link click
    await menuButton.click();
    await expect(drawer).toBeVisible();

    const servicesLink = drawer.locator("a[href='/services']");
    await servicesLink.click();
    await expect(page).toHaveURL("/services");
    await expect(drawer).toBeHidden();

    // 3. Tablet viewport (680px) test: Backdrop click dismiss
    await page.setViewportSize({ width: 680, height: 800 });
    await page.goto("/contact");

    const tabletMenuBtn = page.locator("header button[aria-controls='mobile-nav-drawer']");
    await tabletMenuBtn.click();
    await expect(drawer).toBeVisible();

    // On 680px screen, drawer panel is sm:max-w-sm (384px) anchored at right:0.
    // Left side (x = 0 to 296px) is the exposed backdrop overlay.
    // Click on x=100, y=200 to dismiss via backdrop.
    await page.mouse.click(100, 200);
    await expect(drawer).toBeHidden();
  });
});
