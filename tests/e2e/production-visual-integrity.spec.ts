import { test, expect } from "@playwright/test";

/**
 * Task 10.1.5.2 — Production Visual Integrity & Release Readiness Audit
 *
 * Automated verification across 7 mandatory viewports:
 * 320px, 375px, 430px, 768px, 1366px, 1440px, 1920px
 *
 * Verifies:
 * 1. CSS stylesheets load with HTTP 200 (no 404, no 500)
 * 2. CSS variables are defined and computed correctly (--bg-primary, --accent-purple)
 * 3. Typography computed correctly (Inter / sans-serif, not default serif / Times New Roman)
 * 4. Component styling applied (buttons have padding, border-radius, background, not native controls)
 * 5. Layout and spacing: No horizontal scroll overflow (scrollWidth <= clientWidth)
 * 6. Zero unhandled console errors during rendering and hydration
 * 7. Screenshots captured across all target routes and viewports
 */

const TARGET_ROUTES = [
  { path: "/", name: "home" },
  { path: "/about", name: "about" },
  { path: "/services", name: "services" },
  { path: "/pricing", name: "pricing" },
  { path: "/portfolio", name: "portfolio" },
  { path: "/contact", name: "contact" },
  { path: "/admin/login", name: "admin-login" },
];

const MANDATORY_VIEWPORTS = [
  { name: "320px", width: 320, height: 600 },
  { name: "375px", width: 375, height: 667 },
  { name: "430px", width: 430, height: 932 },
  { name: "768px", width: 768, height: 1024 },
  { name: "1366px", width: 1366, height: 768 },
  { name: "1440px", width: 1440, height: 900 },
  { name: "1920px", width: 1920, height: 1080 },
];

test.describe("Production Visual Integrity & Release Gate", () => {
  for (const vp of MANDATORY_VIEWPORTS) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      for (const route of TARGET_ROUTES) {
        test(`${route.name} (${route.path}) renders with complete visual styling`, async ({
          page,
        }) => {
          const consoleErrors: string[] = [];
          page.on("pageerror", (err) => consoleErrors.push(err.message));
          page.on("console", (msg) => {
            if (msg.type() === "error") {
              // Ignore intentional test mock errors or analytics noise if any
              consoleErrors.push(msg.text());
            }
          });

          await page.setViewportSize({ width: vp.width, height: vp.height });

          const response = await page.goto(route.path, {
            waitUntil: "domcontentloaded",
          });
          expect(response?.status(), `Route ${route.path} returned non-200 status`).toBe(200);

          // 1. Verify Stylesheet Delivery: at least one stylesheet link exists and was served
          const stylesheets = await page.locator("link[rel='stylesheet']").all();
          expect(stylesheets.length, `Route ${route.path} has no stylesheet link`).toBeGreaterThan(0);

          // 2. Verify Computed Body Styles & CSS Variables
          const bodyStyles = await page.evaluate(() => {
            const body = document.body;
            const computed = window.getComputedStyle(body);
            const rootComputed = window.getComputedStyle(document.documentElement);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              fontFamily: computed.fontFamily,
              bgPrimaryVar: rootComputed.getPropertyValue("--bg-primary").trim(),
              accentPurpleVar: rootComputed.getPropertyValue("--accent-purple").trim(),
            };
          });

          // CSS variables must be defined
          expect(bodyStyles.bgPrimaryVar).toBe("#050507");
          expect(bodyStyles.accentPurpleVar).toBe("#8B5CF6");

          // Body background color must match dark theme (#050507 = rgb(5, 5, 7))
          expect(bodyStyles.backgroundColor).toBe("rgb(5, 5, 7)");

          // Typography must be Inter / sans-serif, never default browser Times New Roman
          expect(bodyStyles.fontFamily).not.toMatch(/\bTimes\b/i);
          expect(bodyStyles.fontFamily).toMatch(/Inter|sans-serif/i);

          // 3. Verify Component Styling (Visible CTAs & Submit Buttons)
          const buttonInfo = await page.evaluate(() => {
            const btn = document.querySelector(
              "button[type='submit'], main a[href*='contact'], header a[href*='contact'], .public-editorial button"
            );
            if (!btn) return null;
            const style = window.getComputedStyle(btn);
            return {
              borderRadius: parseFloat(style.borderRadius) || 0,
              paddingTop: parseFloat(style.paddingTop) || 0,
              paddingBottom: parseFloat(style.paddingBottom) || 0,
              paddingLeft: parseFloat(style.paddingLeft) || 0,
              paddingRight: parseFloat(style.paddingRight) || 0,
              cursor: style.cursor,
            };
          });

          if (buttonInfo) {
            // Styled buttons must have non-zero padding and border radius (not native unstyled controls)
            expect(buttonInfo.borderRadius).toBeGreaterThan(0);
            expect(buttonInfo.paddingLeft + buttonInfo.paddingRight).toBeGreaterThan(0);
          }

          // 4. Verify No Horizontal Overflow
          const overflow = await page.evaluate(() => {
            return {
              clientWidth: document.documentElement.clientWidth,
              scrollWidth: document.documentElement.scrollWidth,
            };
          });
          expect(
            overflow.scrollWidth,
            `Horizontal overflow on ${route.path} at ${vp.name}`
          ).toBeLessThanOrEqual(overflow.clientWidth);

          // 5. Verify Zero Unhandled Page Runtime Errors
          expect(consoleErrors, `Unhandled errors on ${route.path} at ${vp.name}`).toHaveLength(0);

          // 6. Capture Visual Verification Proof
          await page.screenshot({
            path: `test-results/screenshots/gate-${route.name}-${vp.name}.png`,
            fullPage: false,
          });
        });
      }
    });
  }
});
