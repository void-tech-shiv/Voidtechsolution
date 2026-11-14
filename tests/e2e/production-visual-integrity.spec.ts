import { test, expect } from "@playwright/test";

/**
 * Task 10.1.5.2.2 — Production Visual Integrity & Release Gate Suite
 *
 * Enforces:
 * 1. Dedicated test server verification (production mode via /api/health).
 * 2. 8 routes across 7 mandatory viewports (56 route tests + 1 health/mode test = 57 tests).
 * 3. Finding B: Deterministic CSS network response observation:
 *    - In-flight response processing promises tracked and awaited before assertions.
 *    - Genuine CSS discrimination (distinguishing stylesheet URLs from query params).
 *    - HTTP 200, Content-Type text/css, substantial bundle size (>1KB).
 *    - Zero failed CSS requests with route and asset diagnostics.
 * 4. Finding C: Actual font verification:
 *    - Browser Font Loading API status (document.fonts.ready -> 'loaded').
 *    - Registered font face check for "Inter" in document.fonts.
 *    - document.fonts.check() with CSS font shorthands across weights (400, 600, 700).
 *    - Verification that Inter is actively prioritized by document.body (not generic fallback alone).
 *    - Local font resource responses verified HTTP 200 with zero failed font requests.
 * 5. Mandatory route-specific CTA assertions: bounding box, horizontal padding, border-radius, cursor, valid destination.
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
          const failedRequests: Array<{ url: string; error: string; resourceType: string }> = [];

          // Finding B: Deterministic CSS tracking
          interface CapturedCssResponse {
            url: string;
            pathname: string;
            status: number;
            contentType: string;
            size: number;
            isBundledCss: boolean;
          }

          // Finding C: Deterministic font tracking
          interface CapturedFontResponse {
            url: string;
            pathname: string;
            status: number;
            contentType: string;
            size: number;
          }

          const capturedCssResponses: CapturedCssResponse[] = [];
          const capturedFontResponses: CapturedFontResponse[] = [];
          const responseProcessingPromises: Promise<void>[] = [];

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
              resourceType: req.resourceType(),
            });
          });

          page.on("response", (res) => {
            const url = res.url();
            let pathname = "";
            try {
              pathname = new URL(url).pathname;
            } catch {
              pathname = url;
            }
            const contentType = (res.headers()["content-type"] || "").toLowerCase();

            // Finding B: Distinguish genuine CSS from query parameters containing .css
            const isCss = pathname.endsWith(".css") || contentType.includes("text/css");

            if (isCss) {
              const p = (async () => {
                try {
                  let size = 0;
                  try {
                    const body = await res.body();
                    size = body.length;
                  } catch {
                    const cl = res.headers()["content-length"];
                    if (cl) size = parseInt(cl, 10) || 0;
                  }

                  const isBundledCss = pathname.includes("/_next/static/css/") || size > 1000;
                  capturedCssResponses.push({
                    url,
                    pathname,
                    status: res.status(),
                    contentType,
                    size,
                    isBundledCss,
                  });
                } catch {
                  capturedCssResponses.push({
                    url,
                    pathname,
                    status: res.status(),
                    contentType,
                    size: 0,
                    isBundledCss: false,
                  });
                }
              })();
              responseProcessingPromises.push(p);
            }

            // Finding C: Track font resources (local WOFF2/WOFF files from Next.js font optimization)
            const isFont =
              pathname.endsWith(".woff2") ||
              pathname.endsWith(".woff") ||
              contentType.includes("font/woff2") ||
              contentType.includes("font/woff");

            if (isFont) {
              const fp = (async () => {
                try {
                  let size = 0;
                  try {
                    const body = await res.body();
                    size = body.length;
                  } catch {
                    const cl = res.headers()["content-length"];
                    if (cl) size = parseInt(cl, 10) || 0;
                  }

                  capturedFontResponses.push({
                    url,
                    pathname,
                    status: res.status(),
                    contentType,
                    size,
                  });
                } catch {
                  capturedFontResponses.push({
                    url,
                    pathname,
                    status: res.status(),
                    contentType,
                    size: 0,
                  });
                }
              })();
              responseProcessingPromises.push(fp);
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

          // Finding B: Await all in-flight response processing deterministically
          await Promise.all(responseProcessingPromises);

          // ---------------------------------------------------------------
          // 1. DETERMINISTIC STYLESHEET DELIVERY ASSERTIONS (Finding B)
          // ---------------------------------------------------------------
          const stylesheetLinks = await page
            .locator("link[rel='stylesheet']")
            .all();
          expect(
            stylesheetLinks.length,
            `Route ${route.path} has no <link rel='stylesheet'> tags in DOM`
          ).toBeGreaterThan(0);

          expect(
            capturedCssResponses.length,
            `No genuine CSS network responses were captured on route ${route.path}`
          ).toBeGreaterThan(0);

          // Verify every captured CSS response
          for (const css of capturedCssResponses) {
            expect(
              css.status,
              `Stylesheet '${css.url}' on route ${route.path} returned HTTP status ${css.status}`
            ).toBe(200);
            expect(
              css.contentType,
              `Stylesheet '${css.url}' on route ${route.path} has invalid Content-Type '${css.contentType}'`
            ).toContain("text/css");
            expect(
              css.size,
              `Stylesheet '${css.url}' on route ${route.path} delivered empty payload (0 bytes)`
            ).toBeGreaterThan(0);
          }

          // Enforce presence of at least one substantial bundled Next.js CSS stylesheet
          const hasSubstantialBundle = capturedCssResponses.some(
            (c) => c.isBundledCss && c.size > 1000
          );
          expect(
            hasSubstantialBundle,
            `No substantial (>1KB) bundled stylesheet was delivered on route ${route.path}. Captured: ${JSON.stringify(
              capturedCssResponses
            )}`
          ).toBe(true);

          // Zero failed CSS requests
          const failedCss = failedRequests.filter(
            (r) => r.resourceType === "stylesheet" || r.url.endsWith(".css")
          );
          expect(
            failedCss,
            `Failed CSS network requests detected on ${route.path}: ${JSON.stringify(failedCss)}`
          ).toHaveLength(0);

          // ---------------------------------------------------------------
          // 2. ACTUAL FONT VERIFICATION (Finding C)
          // ---------------------------------------------------------------
          const fontDiagnostics = await page.evaluate(async () => {
            await document.fonts.ready;

            const allFonts: Array<{ family: string; status: string; weight: string }> = [];
            document.fonts.forEach((f) => {
              allFonts.push({ family: f.family, status: f.status, weight: f.weight });
            });

            // Inspect registered font families
            const isInterRegistered = allFonts.some((f) => f.family.includes("Inter"));
            const isJetBrainsRegistered = allFonts.some((f) => f.family.includes("JetBrains Mono"));

            // Check font shorthands across standard typographic weights
            const checkInter16 = document.fonts.check("16px Inter");
            const checkInter400 = document.fonts.check("400 16px Inter");
            const checkInter600 = document.fonts.check("600 16px Inter");
            const checkInter700 = document.fonts.check("700 16px Inter");
            const checkMono16 = document.fonts.check("16px 'JetBrains Mono'");

            const body = document.body;
            const computed = window.getComputedStyle(body);
            const rootComputed = window.getComputedStyle(document.documentElement);

            return {
              fontStatus: document.fonts.status,
              totalFonts: document.fonts.size,
              isInterRegistered,
              isJetBrainsRegistered,
              checkInter16,
              checkInter400,
              checkInter600,
              checkInter700,
              checkMono16,
              bodyFont: computed.fontFamily,
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              bgPrimaryVar: rootComputed.getPropertyValue("--bg-primary").trim(),
              accentPurpleVar: rootComputed.getPropertyValue("--accent-purple").trim(),
            };
          });

          // C.1: Font loading must have settled to 'loaded'
          expect(
            fontDiagnostics.fontStatus,
            `Font loading still pending on route ${route.path} (status: ${fontDiagnostics.fontStatus})`
          ).toBe("loaded");

          // C.2: Inter font face must be registered in the document font set
          expect(
            fontDiagnostics.isInterRegistered,
            `Inter font face is not registered in document.fonts on route ${route.path}`
          ).toBe(true);

          // C.3: document.fonts.check() must confirm Inter is loaded across weights (400, 600, 700)
          expect(
            fontDiagnostics.checkInter16,
            `document.fonts.check('16px Inter') failed on route ${route.path}`
          ).toBe(true);
          expect(
            fontDiagnostics.checkInter400,
            `document.fonts.check('400 16px Inter') failed on route ${route.path}`
          ).toBe(true);
          expect(
            fontDiagnostics.checkInter600,
            `document.fonts.check('600 16px Inter') failed on route ${route.path}`
          ).toBe(true);
          expect(
            fontDiagnostics.checkInter700,
            `document.fonts.check('700 16px Inter') failed on route ${route.path}`
          ).toBe(true);

          // C.4: Body element must actively use Inter as its primary font family (not generic fallback alone)
          expect(
            fontDiagnostics.bodyFont,
            `Body element does not prioritize Inter font on route ${route.path} (computed: ${fontDiagnostics.bodyFont})`
          ).toMatch(/(?:^|,\s*)["']?Inter["']?(?:,\s*|$)/i);

          expect(
            fontDiagnostics.bodyFont,
            `Body element uses fallback Times New Roman or serif on route ${route.path}`
          ).not.toMatch(/\bTimes\b/i);

          // C.5: Local font resources must load with HTTP 200 and zero failures
          const failedFonts = failedRequests.filter(
            (r) => r.resourceType === "font" || r.url.includes(".woff") || r.url.includes(".woff2")
          );
          expect(
            failedFonts,
            `Font resource requests failed on route ${route.path}: ${JSON.stringify(failedFonts)}`
          ).toHaveLength(0);

          for (const fontRes of capturedFontResponses) {
            expect(
              fontRes.status,
              `Font resource '${fontRes.url}' on route ${route.path} returned non-200 status (${fontRes.status})`
            ).toBe(200);
          }

          // C.6: CSS variables and theme tokens
          expect(fontDiagnostics.bgPrimaryVar).toBe("#050507");
          expect(fontDiagnostics.accentPurpleVar).toBe("#8B5CF6");
          expect(fontDiagnostics.backgroundColor).toBe("rgb(5, 5, 7)");

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
