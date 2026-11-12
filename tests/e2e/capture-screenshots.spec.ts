import { test } from "@playwright/test";

test.describe("Visual Responsive Proofs", () => {
  const viewports = [
    { name: "320px", width: 320, height: 600 },
    { name: "375px", width: 375, height: 667 },
    { name: "768px", width: 768, height: 1024 },
    { name: "1440px", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`captures hero at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `test-results/screenshots/hero-${vp.name}.png`,
        fullPage: false,
      });
    });

    if (vp.width < 768) {
      test(`captures open mobile navigation drawer at ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/");
        const trigger = page.getByRole("button", { name: "Open navigation menu" });
        await trigger.click();
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `test-results/screenshots/drawer-open-${vp.name}.png`,
          fullPage: false,
        });
      });
    }
  }
});

