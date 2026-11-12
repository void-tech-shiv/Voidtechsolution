import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    channel: "msedge",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency",
      DIRECT_URL: "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency",
    },
  },
  projects: [
    {
      name: "mobile-375",
      use: {
        channel: "msedge",
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "mobile-320",
      use: {
        channel: "msedge",
        viewport: { width: 320, height: 568 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      use: {
        channel: "msedge",
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
