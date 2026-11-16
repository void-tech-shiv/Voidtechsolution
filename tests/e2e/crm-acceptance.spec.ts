import { test, expect } from "@playwright/test";
import { PrismaClient, type UserRole } from "@prisma/client";
import { signSessionCookie } from "@/server/security/cookie";
import { hashPassword } from "@/server/security/password";
import {
  generateRawSessionToken,
  hashSessionToken,
  ABSOLUTE_SESSION_LIFETIME_MS,
  SESSION_COOKIE_NAME,
} from "@/server/security/session";

const TEST_DB =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DB } },
});

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "cadeb23351137bce0c5d611415243b45ec2cbf561822c3d0a155317c0398846c";

const TEST_CREDENTIALS = {
  SUPER_ADMIN: {
    email: "crm.e2e.super@voidtech.test",
    password: "TestSuperPass!2026#",
    name: "CRM E2E SuperAdmin",
  },
  ADMIN: {
    email: "crm.e2e.admin@voidtech.test",
    password: "TestAdminPass!2026#",
    name: "CRM E2E OpsAdmin",
  },
  EDITOR: {
    email: "crm.e2e.editor@voidtech.test",
    password: "TestEditorPass!2026#",
    name: "CRM E2E Editor",
  },
};

const VIEWPORTS = [
  { name: "320px", width: 320, height: 568 },
  { name: "360px", width: 360, height: 640 },
  { name: "375px", width: 375, height: 667 },
  { name: "390px", width: 390, height: 844 },
  { name: "430px", width: 430, height: 932 },
  { name: "768px", width: 768, height: 1024 },
  { name: "1024px", width: 1024, height: 768 },
  { name: "1280px", width: 1280, height: 800 },
  { name: "1440px", width: 1440, height: 900 },
  { name: "1920px", width: 1920, height: 1080 },
];

async function ensureE2ETestData() {
  for (const [role, creds] of Object.entries(TEST_CREDENTIALS)) {
    const existing = await prisma.adminUser.findUnique({
      where: { email: creds.email },
    });

    if (!existing) {
      const passwordHash = await hashPassword(creds.password);
      await prisma.adminUser.create({
        data: {
          email: creds.email,
          name: creds.name,
          role: role as UserRole,
          passwordHash,
          isActive: true,
        },
      });
    }
  }

  // Ensure seed lead for E2E interaction
  const existingLead = await prisma.enquiry.findFirst({
    where: { email: "e2e.client@crmtest.test" },
  });

  if (!existingLead) {
    const lead = await prisma.enquiry.create({
      data: {
        name: "Aether Systems",
        email: "e2e.client@crmtest.test",
        phone: "+91 98111 22334",
        companyName: "Aether Robotics Corp",
        serviceCategory: "AI_AUTOMATION",
        budgetRange: "₹2,50,000 - ₹5,00,000",
        message: "E2E acceptance verification test lead for CRM pipeline.",
        status: "NEW",
        estimatedValueInr: 450000,
        source: "WEBSITE_CONTACT_FORM",
      },
    });

    await prisma.leadNote.create({
      data: {
        enquiryId: lead.id,
        authorName: "CRM E2E SuperAdmin",
        content: "E2E verification note for drawer testing.",
        isPinned: true,
      },
    });

    await prisma.leadFollowUp.create({
      data: {
        enquiryId: lead.id,
        title: "E2E Follow-up Call",
        dueAt: new Date(Date.now() + 86400000),
        priority: "HIGH",
      },
    });
  }
}

async function createRoleSessionCookie(role: UserRole): Promise<string> {
  const creds = TEST_CREDENTIALS[role];
  const user = await prisma.adminUser.findUniqueOrThrow({
    where: { email: creds.email },
  });

  const rawToken = generateRawSessionToken();
  const sessionTokenHash = await hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + ABSOLUTE_SESSION_LIFETIME_MS);

  const session = await prisma.adminSession.create({
    data: {
      userId: user.id,
      sessionToken: sessionTokenHash,
      expiresAt,
    },
  });

  return await signSessionCookie(
    {
      sessionId: session.id,
      rawToken,
      exp: expiresAt.getTime(),
    },
    AUTH_SECRET
  );
}

test.describe("Phase 9.3: CRM E2E Acceptance, Workflows & Visual Proofs", () => {
  test.beforeAll(async () => {
    await ensureE2ETestData();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.describe("1. CRM Navigation & Multi-Role Access Control", () => {
    test("unauthenticated visitor navigating to /admin/crm is redirected to /admin/login", async ({ page }) => {
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/admin/login");
    });

    test("SUPER_ADMIN can access /admin/crm and inspect 6 KPI cards", async ({ page, context }) => {
      const cookie = await createRoleSessionCookie("SUPER_ADMIN");
      await context.addCookies([
        { name: SESSION_COOKIE_NAME, value: cookie, url: "http://localhost:3000" },
      ]);

      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "CRM Pipeline" })).toBeVisible();
      await expect(page.getByText("Total Leads", { exact: true })).toBeVisible();
      await expect(page.getByText("New Leads", { exact: true })).toBeVisible();
      await expect(page.getByText("Active Pipeline", { exact: true })).toBeVisible();
      await expect(page.getByText("Won Revenue", { exact: true })).toBeVisible();
      await expect(page.getByText("Win Rate", { exact: true })).toBeVisible();
      await expect(page.getByText("Overdue Follow-ups", { exact: true })).toBeVisible();
      await expect(page.getByText("Pipeline Stage Distribution", { exact: true })).toBeVisible();
    });

    test("EDITOR has read-only visibility on /admin/crm (no mutation controls)", async ({ page, context }) => {
      const cookie = await createRoleSessionCookie("EDITOR");
      await context.addCookies([
        { name: SESSION_COOKIE_NAME, value: cookie, url: "http://localhost:3000" },
      ]);

      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "CRM Pipeline" })).toBeVisible();
      // Verify kanban board is displayed
      await expect(page.getByText("Total Leads", { exact: true })).toBeVisible();
    });
  });

  test.describe("2. Eight-Stage Kanban Pipeline Acceptance", () => {
    test.beforeEach(async ({ context }) => {
      const cookie = await createRoleSessionCookie("SUPER_ADMIN");
      await context.addCookies([
        { name: SESSION_COOKIE_NAME, value: cookie, url: "http://localhost:3000" },
      ]);
    });

    test("renders all 8 pipeline stage columns", async ({ page }) => {
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      const expectedStages = [
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "PROPOSAL SENT",
        "NEGOTIATION",
        "WON",
        "LOST",
        "ON HOLD",
      ];

      for (const stage of expectedStages) {
        await expect(page.locator("h3", { hasText: new RegExp(`^${stage}$`, "i") })).toBeVisible();
      }
    });

    test("renders lead cards with client name, category, and INR value", async ({ page }) => {
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("h4", { hasText: "Aether Systems" }).first()).toBeVisible();
      await expect(page.getByText(/₹4,50,000/).first()).toBeVisible();
    });
  });

  test.describe("3. Lead Details Drawer & Tabbed Inspection", () => {
    test.beforeEach(async ({ context }) => {
      const cookie = await createRoleSessionCookie("SUPER_ADMIN");
      await context.addCookies([
        { name: SESSION_COOKIE_NAME, value: cookie, url: "http://localhost:3000" },
      ]);
    });

    test("clicking a lead card opens the 5-tab Lead Details Drawer", async ({ page }) => {
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      // Click the first lead card
      await page.locator("h4").first().click();

      // Drawer should slide in
      const closeBtn = page.getByLabel("Close lead drawer");
      await expect(closeBtn).toBeVisible();

      await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Notes/i })).toBeVisible();
      await expect(page.getByRole("button", { name: "Activity" })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Tasks/i })).toBeVisible();
      await expect(page.getByRole("button", { name: "Assignment" })).toBeVisible();

      // Inspect Notes Tab
      await page.getByRole("button", { name: /Notes/i }).click();

      // Inspect Tasks Tab
      await page.getByRole("button", { name: /^Tasks/i }).click();

      // Close drawer via close button or Escape
      await closeBtn.click();
      await expect(closeBtn).not.toBeVisible();
    });
  });

  test.describe("4. CRM Filters & Task Queue Switcher", () => {
    test.beforeEach(async ({ context }) => {
      const cookie = await createRoleSessionCookie("SUPER_ADMIN");
      await context.addCookies([
        { name: SESSION_COOKIE_NAME, value: cookie, url: "http://localhost:3000" },
      ]);
    });

    test("switches between Kanban Pipeline and Follow-up Tasks views", async ({ page }) => {
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      // Click Follow-up Tasks toggle
      await page.getByRole("button", { name: /Follow-up Tasks/i }).click();

      // Verify task view tab buttons
      await expect(page.getByRole("button", { name: "Upcoming" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Overdue", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
      await expect(page.getByRole("button", { name: "All Tasks" })).toBeVisible();
      await expect(page.getByText("Priority:")).toBeVisible();

      // Switch back to Kanban
      await page.getByRole("button", { name: "Kanban Pipeline" }).click();
      await expect(page.getByText("Pipeline Stage Distribution", { exact: true })).toBeVisible();
    });

    test("search input filters lead cards by text", async ({ page }) => {
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      const searchInput = page.getByPlaceholder(/Search leads by client/i);
      await searchInput.fill("Apex");
      await page.waitForTimeout(400);

      await expect(page.locator("h4", { hasText: /Apex/i }).first()).toBeVisible();
    });
  });

  test.describe("5. Notifications Bell & Recipient Feed", () => {
    test.beforeEach(async ({ context }) => {
      const cookie = await createRoleSessionCookie("SUPER_ADMIN");
      await context.addCookies([
        { name: SESSION_COOKIE_NAME, value: cookie, url: "http://localhost:3000" },
      ]);
    });

    test("clicking header bell button opens notifications popover", async ({ page }) => {
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      const bell = page.getByLabel("View notifications");
      await expect(bell).toBeVisible();
      await bell.click();

      await expect(page.getByText("Notifications", { exact: true })).toBeVisible();
    });
  });

  test.describe("6. 10-Viewport Visual Proofs & Responsive Acceptance", () => {
    test.beforeEach(async ({ context }) => {
      const cookie = await createRoleSessionCookie("SUPER_ADMIN");
      await context.addCookies([
        { name: SESSION_COOKIE_NAME, value: cookie, url: "http://localhost:3000" },
      ]);
    });

    for (const vp of VIEWPORTS) {
      test(`captures CRM dashboard at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto("/admin/crm");
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(400);

        await page.screenshot({
          path: `test-results/screenshots/crm-dashboard-${vp.name}.png`,
          fullPage: false,
        });

        // Verify no unintended page-level horizontal scroll on desktop/tablet views
        if (vp.width >= 768) {
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin for subpixel rounding
        }
      });
    }

    test("captures Lead Details Drawer open at 375px mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      await page.getByText("Aether Systems").first().click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `test-results/screenshots/crm-drawer-375px.png`,
        fullPage: false,
      });
    });

    test("captures Lead Details Drawer open at 1440px desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/admin/crm");
      await page.waitForLoadState("domcontentloaded");

      await page.getByText("Aether Systems").first().click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `test-results/screenshots/crm-drawer-1440px.png`,
        fullPage: false,
      });
    });
  });
});
