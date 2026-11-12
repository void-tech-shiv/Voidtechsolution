import { test, expect } from "@playwright/test";

const routes = ["/", "/about", "/services", "/pricing", "/portfolio", "/contact"];
const viewports = [320, 768, 1280, 1920];

test.describe("Public design responsive smoke", () => {
  for (const width of viewports) {
    test("public routes remain usable at " + width + "px", async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        const response = await page.goto(route);
        expect(response?.status(), route).toBe(200);
        await expect(page.locator("header").getByRole("link", { name: "VOIDTECH SOLUTION Home" })).toBeVisible();
        if (width >= 640) await expect(page.locator("header").getByRole("link", { name: "Start Your Project" })).toBeVisible();
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("h1")).toBeVisible();
        if (route === "/services" && width === 1280 && testInfo.project.name === "desktop") {
          const headerInfo = await page.locator("header").evaluate((element) => {
            const brand = element.querySelector("a[aria-label='VOIDTECH SOLUTION Home']")!;
            const cta = element.querySelector("a[href='/contact']")!;
            const rect = (node: Element) => {
              const { x, y, width, height } = node.getBoundingClientRect();
              return { x, y, width, height, display: getComputedStyle(node).display, visibility: getComputedStyle(node).visibility };
            };
            return { brand: rect(brand), cta: rect(cta), header: rect(element) };
          });
          console.log("HEADER INFO", JSON.stringify(headerInfo));
          await page.locator("header").screenshot({ path: testInfo.outputPath("service-header.png") });
        }
        if (width === 1280 && testInfo.project.name === "desktop") {
          const name = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
          await page.screenshot({ path: testInfo.outputPath("public-" + name + ".png") });
        }
        const metrics = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          page: document.documentElement.scrollWidth,
          titleBrandCount: document.title.match(/VOIDTECH SOLUTION/g)?.length ?? 0,
          headingFont: getComputedStyle(document.querySelector("h1")!).fontFamily,
        }));
        expect(metrics.page, "horizontal overflow on " + route + " at " + width + "px").toBeLessThanOrEqual(metrics.viewport);
        expect(metrics.titleBrandCount, "duplicate brand in title on " + route).toBeLessThanOrEqual(1);
        expect(metrics.headingFont, "display heading still monospace on " + route).not.toMatch(/JetBrains|monospace/i);
        if (route === "/portfolio") {
          const detailHref = await page.locator("main a[href^='/portfolio/']").first().getAttribute("href");
          if (detailHref) {
            await page.goto(detailHref);
            await expect(page.locator("h1")).toHaveCount(1);
            const detailFont = await page.locator("h1").evaluate((element) => getComputedStyle(element).fontFamily);
            expect(detailFont, "case-study display heading still monospace").not.toMatch(/JetBrains|monospace/i);
            await expect(page.locator("a button, button a")).toHaveCount(0);
          }
          await page.goto(route);
        }
        await expect(page.locator("a button, button a")).toHaveCount(0);
        if (width >= 768) await expect(page.locator("header nav[aria-label='Desktop Navigation'] a[aria-current='page']")).toHaveCount(1);
      }
    });
  }

  test("contact form controls keep mobile-safe 16px text", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/contact");
    await page.getByRole("button", { name: "Continue: Technical Specs" }).click();
    const input = page.locator("#projectBrief");
    await expect(input).toBeVisible();
    await expect(input).toHaveCSS("font-size", "16px");
  });
});
