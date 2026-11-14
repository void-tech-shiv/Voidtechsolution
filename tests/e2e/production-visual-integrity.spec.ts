import { test, expect } from "@playwright/test";

/**
 * Task 10.1.5.2.1 — Production Visual Integrity & Release Gate Suite
 *
 * Enforces:
 * 1. Dedicated test server verification (production mode via /api/health).
 * 2. 8 routes across 7 mandatory viewports (56 route tests + 1 health/mode test = 57 tests).
 * 3. Actual CSS network response capture: HTTP 200, text/css, size > 1KB.
 * 4. Actual font loading verification via browser Font Loading API + zero failed font requests.
 * 5. Mandatory route-specific CTA assertions: bounding box, padding, border-radius, cursor, valid destination.
 * 6. Dynamic portfolio detail coverage (/portfolio/algorithmic-liquidity-engine).
 * 7. Zero horizontal overflow (scrollWidth <= clientWidth).
 * 8. Zero unhandled runtime/console errors.
 * 9. Visual screenshot artifact capture per route and viewport.
 */

interface CtaRequirement {
  selector: string;
  expectedText?: string;
  isLink?: boolean;
  isButton?: boolean;
  isInput?: boolean;
}

interface TargetRoute {
  path: string;
  name: string;
  ctas: CtaRequirement[];
}

const TARGET_ROUTES: TargetRoute[] = [
  {
    path: "/",
    name: "home",
    ctas: [
      {
        selector: "main a[href='/contact']",
        expectedText: "Start Your Project",
        isLink: true,
        isButton: true,
      },
      {
        selector: "main a[href='/services']",
        expectedText: "Explore Our Services",
        isLink: true,
        isButton: true,
      },
    ],
  },
  {
    path: "/about",
    name: "about",
    ctas: [
      {
        selector: "main a[href='/portfolio']",
        expectedText: "Explore Our Work",
        isLink: true,
        isButton: true,
      },
      {
        selector: "main a[href='/contact']",
        expectedText: "Start Your Project",
        isLink: true,
        isButton: true,
      },
    ],
  },
  {
    path: "/services",
    name: "services",
    ctas: [
      {
        selector: "main a[href='/contact']",
        expectedText: "Start Project Scoping",
        isLink: true,
        isButton: true,
      },
      {
        selector: "main a[href='/pricing']",
        expectedText: "Review Pricing Packages",
        isLink: true,
        isButton: true,
      },
    ],
  },
  {
    path: "/pricing",
    name: "pricing",
    ctas: [
      {
        selector: "main a[href='#packages']",
        expectedText: "View Approved Tiers",
        isLink: true,
        isButton: true,
      },
      {
        selector: "main a[href='#calculator']",
        expectedText: "Open Project Calculator",
        isLink: true,
        isButton: true,
      },
    ],
  },
  {
    path: "/portfolio",
    name: "portfolio",
    ctas: [
      {
        selector: "main a[href='/contact']",
        expectedText: "Start Your Project",
        isLink: true,
        isButton: true,
      },
      {
        selector: "main a[href='/about']",
        expectedText: "Our Engineering Approach",
        isLink: true,
        isButton: true,
      },
      {
        selector: "main a[href^='/portfolio/']",
        isLink: true,
      },
    ],
  },
  {
    path: "/portfolio/algorithmic-liquidity-engine",
    name: "portfolio-detail",
    ctas: [
      {
        selector: "nav[aria-label='Breadcrumb'] a[href='/portfolio']",
        expectedText: "Portfolio",
        isLink: true,
      },
      {
        selector: "main a[href='/contact']",
        expectedText: "Request Architecture Brief",
        isLink: true,
        isButton: true,
      },
      {
        selector: "main a[href='/portfolio']",
        expectedText: "Back to Portfolio",
        isLink: true,
        isButton: true,
      },
    ],
  },
  {
    path: "/contact",
    name: "contact",
    ctas: [
      {
        selector: "main button:has-text('Continue: Technical Specs')",
        isButton: true,
      },
      {
        selector: "main button:has-text('Web Development')",
        isButton: true,
      },
    ],
  },
  {
    path: "/admin/login",
    name: "admin-login",
    ctas: [
      {
        selector: "a[href='/']:has-text('Return to Public Site')",
        isLink: true,
      },
      {
        selector: "button[type='submit']:has-text('Authenticate')",
        isButton: true,
      },
      {
        selector: "input#admin-email, input[type='email']",
        isInput: true,
      },
    ],
  },
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

test.describe("Production Release Gate: Server Isolation & Environment", () => {
  test("Server is running on dedicated port in verified production mode", async ({
    request,
    page,
  }) => {
    // 1. Health check returns production environment
    const healthRes = await request.get("/api/health");
    expect(healthRes.status(), "API health check failed").toBe(200);

    const healthData = await healthRes.json();
    expect(healthData.success).toBe(true);
    expect(
      healthData.data?.environment,
      "Server is not running in production mode!"
    ).toBe("production");

    // 2. Verified absence of Next.js dev server artifacts
    const homeRes = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(homeRes?.status()).toBe(200);

    const html = await page.content();
    expect(html).not.toContain("react-refresh.js");
    expect(html).not.toContain("__next_dev__");
    expect(html).not.toContain("data-next-dev-tools");
  });
});

test.describe("Production Release Gate: Visual Integrity & Route Contracts", () => {
  for (const vp of MANDATORY_VIEWPORTS) {
    test.describe(`Viewport: ${vp.name} (${vp.width}x${vp.height})`, () => {
      for (const route of TARGET_ROUTES) {
        test(`${route.name} (${route.path}) satisfies strict visual & delivery contracts`, async ({
          page,
        }) => {
          const consoleErrors: string[] = [];
          const failedRequests: Array<{ url: string; error: string }> = [];
          const capturedCssResponses: Array<{
            url: string;
            status: number;
            contentType: string;
            size: number;
          }> = [];

          page.on("pageerror", (err) => consoleErrors.push(err.message));
          page.on("console", (msg) => {
            if (msg.type() === "error") {
              consoleErrors.push(msg.text());
            }
          });

          page.on("requestfailed", (req) => {
            failedRequests.push({
              url: req.url(),
              error: req.failure()?.errorText || "unknown",
            });
          });

          page.on("response", async (res) => {
            const url = res.url();
            const contentType = res.headers()["content-type"] || "";

            if (url.includes(".css") || contentType.includes("text/css")) {
              let size = 0;
              try {
                const body = await res.body();
                size = body.length;
              } catch {
                // Ignore if body was already streamed/cached
              }
              capturedCssResponses.push({
                url,
                status: res.status(),
                contentType,
                size,
              });
            }
          });

          await page.setViewportSize({ width: vp.width, height: vp.height });

          const response = await page.goto(route.path, {
            waitUntil: "domcontentloaded",
          });
          expect(
            response?.status(),
            `Route ${route.path} returned non-200 HTTP status`
          ).toBe(200);

          // ---------------------------------------------------------------
          // 1. STYLESHEET DELIVERY ASSERTIONS
          // ---------------------------------------------------------------
          // Must have at least one link rel="stylesheet"
          const stylesheetLinks = await page
            .locator("link[rel='stylesheet']")
            .all();
          expect(
            stylesheetLinks.length,
            `Route ${route.path} has no <link rel='stylesheet'> tags`
          ).toBeGreaterThan(0);

          // Captured CSS network responses must have HTTP 200, text/css, and non-empty payload
          expect(
            capturedCssResponses.length,
            `No CSS network responses were captured on route ${route.path}`
          ).toBeGreaterThan(0);

          for (const css of capturedCssResponses) {
            expect(
              css.status,
              `Stylesheet ${css.url} returned status ${css.status}`
            ).toBe(200);
            expect(
              css.contentType,
              `Stylesheet ${css.url} has invalid Content-Type`
            ).toContain("text/css");
            expect(
              css.size,
              `Stylesheet ${css.url} delivered empty or truncated payload (${css.size} bytes)`
            ).toBeGreaterThan(1000);
          }

          // Zero failed CSS requests
          const failedCss = failedRequests.filter((r) => r.url.includes(".css"));
          expect(
            failedCss,
            `Failed CSS network requests detected on ${route.path}`
          ).toHaveLength(0);

          // Zero failed font requests
          const failedFonts = failedRequests.filter(
            (r) => r.url.includes(".woff") || r.url.includes(".woff2")
          );
          expect(
            failedFonts,
            `Failed font requests detected on ${route.path}`
          ).toHaveLength(0);

          // ---------------------------------------------------------------
          // 2. FONT LOADING API & TYPOGRAPHY ASSERTIONS
          // ---------------------------------------------------------------
          const fontStatus = await page.evaluate(async () => {
            await document.fonts.ready;
            return {
              status: document.fonts.status,
              fontCount: document.fonts.size,
            };
          });
          expect(
            fontStatus.status,
            `document.fonts.status was not 'loaded' on ${route.path}`
          ).toBe("loaded");

          const bodyStyles = await page.evaluate(() => {
            const body = document.body;
            const computed = window.getComputedStyle(body);
            const rootComputed = window.getComputedStyle(
              document.documentElement
            );
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              fontFamily: computed.fontFamily,
              bgPrimaryVar: rootComputed.getPropertyValue("--bg-primary").trim(),
              accentPurpleVar: rootComputed
                .getPropertyValue("--accent-purple")
                .trim(),
            };
          });

          // CSS variables must be strictly defined
          expect(bodyStyles.bgPrimaryVar).toBe("#050507");
          expect(bodyStyles.accentPurpleVar).toBe("#8B5CF6");

          // Body background color must match dark theme (#050507 = rgb(5, 5, 7))
          expect(bodyStyles.backgroundColor).toBe("rgb(5, 5, 7)");

          // Typography must be Inter / sans-serif, never default browser Times New Roman
          expect(bodyStyles.fontFamily).not.toMatch(/\bTimes\b/i);
          expect(bodyStyles.fontFamily).toMatch(/Inter|sans-serif/i);

          // ---------------------------------------------------------------
          // 3. MANDATORY ROUTE-SPECIFIC CTA & INTERACTION CONTRACTS
          // ---------------------------------------------------------------
          for (const ctaReq of route.ctas) {
            const targetLocator = ctaReq.expectedText
              ? page.locator(ctaReq.selector).filter({ hasText: ctaReq.expectedText }).first()
              : page.locator(ctaReq.selector).first();

            await expect(
              targetLocator,
              `Mandatory CTA '${ctaReq.selector}' missing on ${route.path} (${vp.name})`
            ).toBeVisible();

            // Verify bounding box dimensions > 0
            const box = await targetLocator.boundingBox();
            expect(box, `Bounding box null for ${ctaReq.selector}`).not.toBeNull();
            expect(
              box!.width,
              `Width must be > 0 for ${ctaReq.selector}`
            ).toBeGreaterThan(0);
            expect(
              box!.height,
              `Height must be > 0 for ${ctaReq.selector}`
            ).toBeGreaterThan(0);

            // Verify computed styles
            const computedProps = await targetLocator.evaluate((el) => {
              const style = window.getComputedStyle(el);
              return {
                borderRadius: parseFloat(style.borderRadius) || 0,
                paddingTop: parseFloat(style.paddingTop) || 0,
                paddingBottom: parseFloat(style.paddingBottom) || 0,
                paddingLeft: parseFloat(style.paddingLeft) || 0,
                paddingRight: parseFloat(style.paddingRight) || 0,
                cursor: style.cursor,
                href: el.getAttribute("href"),
                tagName: el.tagName.toLowerCase(),
              };
            });

            if (ctaReq.isInput) {
              // Inputs must have non-zero padding, border radius, and touch height
              expect(
                computedProps.borderRadius,
                `Input ${ctaReq.selector} missing border radius`
              ).toBeGreaterThan(0);
              expect(
                computedProps.paddingLeft + computedProps.paddingRight,
                `Input ${ctaReq.selector} missing horizontal padding`
              ).toBeGreaterThan(0);
              expect(
                box!.height,
                `Input ${ctaReq.selector} touch target height must be >= 28px`
              ).toBeGreaterThanOrEqual(28);
            } else if (ctaReq.isButton) {
              // Interactive buttons / styled pills
              expect(
                computedProps.cursor,
                `Button ${ctaReq.selector} cursor must be pointer`
              ).toBe("pointer");
              expect(
                computedProps.borderRadius,
                `Button ${ctaReq.selector} missing border-radius styling`
              ).toBeGreaterThan(0);
              expect(
                computedProps.paddingLeft + computedProps.paddingRight,
                `Button ${ctaReq.selector} missing horizontal padding`
              ).toBeGreaterThan(0);
              expect(
                box!.height,
                `Button ${ctaReq.selector} height must be at least 28px`
              ).toBeGreaterThanOrEqual(28);
            } else {
              // Standard interactive text navigation links
              expect(
                computedProps.cursor,
                `Link ${ctaReq.selector} cursor must be pointer`
              ).toBe("pointer");
              expect(
                box!.height,
                `Link ${ctaReq.selector} height must be > 0`
              ).toBeGreaterThan(0);
            }

            if (ctaReq.isLink) {
              expect(
                computedProps.href,
                `Link ${ctaReq.selector} missing valid destination`
              ).toBeTruthy();
              expect(
                computedProps.href!.startsWith("/") ||
                  computedProps.href!.startsWith("#"),
                `Link ${ctaReq.selector} has invalid internal route (${computedProps.href})`
              ).toBe(true);
            }
          }

          // ---------------------------------------------------------------
          // 4. LAYOUT & HORIZONTAL OVERFLOW ASSERTIONS
          // ---------------------------------------------------------------
          const overflow = await page.evaluate(() => {
            return {
              clientWidth: document.documentElement.clientWidth,
              scrollWidth: document.documentElement.scrollWidth,
            };
          });
          expect(
            overflow.scrollWidth,
            `Horizontal overflow detected on ${route.path} at ${vp.name} (${overflow.scrollWidth} > ${overflow.clientWidth})`
          ).toBeLessThanOrEqual(overflow.clientWidth);

          // ---------------------------------------------------------------
          // 5. RUNTIME ERROR ASSERTIONS
          // ---------------------------------------------------------------
          expect(
            consoleErrors,
            `Unhandled runtime console errors detected on ${route.path} at ${vp.name}`
          ).toHaveLength(0);

          // ---------------------------------------------------------------
          // 6. VISUAL ARTIFACT CAPTURE
          // ---------------------------------------------------------------
          await page.screenshot({
            path: `test-results/screenshots/gate-${route.name}-${vp.name}.png`,
            fullPage: false,
          });
        });
      }
    });
  }
});
