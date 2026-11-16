import { defineConfig } from "@playwright/test";

/**
 * Task 10.1.5.2.1 — Dedicated Production Visual Integrity Release Gate Configuration
 *
 * Enforces:
 * 1. Dedicated test port (default 3005) isolated from development port (3000)
 * 2. reuseExistingServer: false (strictly prohibits reusing an existing dev server)
 * 3. Fresh Next.js production server startup and automatic teardown
 * 4. Production environment verification against /api/health
 */

const GATE_PORT = process.env.GATE_PORT || "3005";
const GATE_BASE_URL = `http://localhost:${GATE_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["production-visual-integrity.spec.ts"],
  fullyParallel: false,
  retries: 0,
  workers: 1,
  outputDir: "test-results/gate-artifacts",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/gate", open: "never" }],
  ],
  use: {
    baseURL: GATE_BASE_URL,
    channel: "msedge",
    trace: "on-first-retry",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${GATE_PORT}`,
    url: `${GATE_BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 60 * 1000,
    env: {
      PORT: GATE_PORT,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency",
      DIRECT_URL: "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency",
    },
  },
  projects: [
    {
      name: "gate-chromium",
      use: {
        channel: "msedge",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
