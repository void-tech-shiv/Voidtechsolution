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
    email: "master.super@voidtech.test",
    password: "TestSuperSecretPass!2026#",
    name: "Test Master SuperAdmin",
  },
  ADMIN: {
    email: "ops.admin@voidtech.test",
    password: "TestAdminSecretPass!2026#",
    name: "Test Operations Admin",
  },
  EDITOR: {
    email: "content.editor@voidtech.test",
    password: "TestEditorSecretPass!2026#",
    name: "Test Content Editor",
  },
};

/**
 * Ensures test administrator accounts exist in the isolated local test database.
 */
async function ensureTestUsers() {
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
}

/**
 * Creates an active, signed database session for the specified role.
 */
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

test.describe("Authenticated Admin Console & Server-Side RBAC Enforcement (E2E)", () => {
  test.beforeAll(async () => {
    await ensureTestUsers();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.describe("1. Shared Login Portal Verification (/admin/login)", () => {
    test("submitting invalid credentials rejects login with generic error", async ({ page }) => {
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");

      await page.getByLabel(/Administrator Email/i).fill("invalid@voidtech.test");
      await page.getByLabel(/Master Password/i).fill("WrongPassword!123");
      await page.getByRole("button", { name: /Authenticate/i }).click();

      // Expect generic error message without leaking email existence
      const errorAlert = page.getByTestId("auth-error-banner");
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/Invalid email or password/i);

      // Verify user remains on /admin/login
      expect(page.url()).toContain("/admin/login");
    });

    test("submitting valid SUPER_ADMIN credentials authenticates and redirects to /admin", async ({
      page,
    }) => {
      await page.goto("/admin/login");
      await page.waitForLoadState("domcontentloaded");

      await page.getByLabel(/Administrator Email/i).fill(TEST_CREDENTIALS.SUPER_ADMIN.email);
      await page.getByLabel(/Master Password/i).fill(TEST_CREDENTIALS.SUPER_ADMIN.password);
      await page.getByRole("button", { name: /Authenticate/i }).click();

      // Verify redirect to overview dashboard
      await page.waitForURL("/admin");
      expect(page.url()).toContain("/admin");

      // Verify welcome banner renders authenticated identity
      await expect(page.getByText(/Welcome, Test Master SuperAdmin/i)).toBeVisible();
      await expect(page.locator("#admin-main-content").getByText("SUPER_ADMIN", { exact: true })).toBeVisible();
    });
  });

  test.describe("2. SUPER_ADMIN Role: Unrestricted Access Across All 9 Routes", () => {
    test.beforeEach(async ({ context }) => {
      const cookie = await createRoleSessionCookie("SUPER_ADMIN");
      await context.addCookies([
        {
          name: SESSION_COOKIE_NAME,
          value: cookie,
          url: "http://localhost:3000",
        },
      ]);
    });

    test("accesses /admin overview dashboard with full metrics", async ({ page }) => {
      await page.goto("/admin");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByText(/SESSION ACTIVE/i)).toBeVisible();
      await expect(page.locator("#admin-main-content").getByText("SUPER_ADMIN", { exact: true })).toBeVisible();
      await expect(page.getByText(/TLS 1.3 \/ HMAC Secured/i)).toBeVisible();
      await expect(page.getByText(/Catalog Services/i)).toBeVisible();
    });

    test("accesses /admin/users team governance with administrative controls", async ({ page }) => {
      await page.goto("/admin/users");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Team & Access Control" })).toBeVisible();
      await expect(page.getByRole("button", { name: /Add Administrator/i })).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });

    test("accesses /admin/audit-logs immutable audit trail", async ({ page }) => {
      await page.goto("/admin/audit-logs");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Audit Trail & Security Logs" })).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });

    test("accesses /admin/settings platform configuration", async ({ page }) => {
      await page.goto("/admin/settings");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Platform Configuration" })).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });

    test("accesses /admin/enquiries with status management enabled", async ({ page }) => {
      await page.goto("/admin/enquiries");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Client Enquiries & Leads" })).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });

    test("accesses /admin/services catalog", async ({ page }) => {
      await page.goto("/admin/services");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Registered Agency Offerings" })).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });

    test("accesses /admin/pricing packages", async ({ page }) => {
      await page.goto("/admin/pricing");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Approved Pricing Packages" })).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });

    test("accesses /admin/portfolio showcase", async ({ page }) => {
      await page.goto("/admin/portfolio");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Portfolio & Architecture Prototypes" })).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });

    test("accesses /admin/faqs knowledgebase", async ({ page }) => {
      await page.goto("/admin/faqs");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Knowledgebase & FAQ Management" })).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });
  });

  test.describe("3. ADMIN Role: Operational Access & Security Boundary Enforcement", () => {
    test.beforeEach(async ({ context }) => {
      const cookie = await createRoleSessionCookie("ADMIN");
      await context.addCookies([
        {
          name: SESSION_COOKIE_NAME,
          value: cookie,
          url: "http://localhost:3000",
        },
      ]);
    });

    test("accesses /admin overview dashboard", async ({ page }) => {
      await page.goto("/admin");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByText(/SESSION ACTIVE/i)).toBeVisible();
      await expect(page.locator("#admin-main-content").getByText("ADMIN", { exact: true })).toBeVisible();
    });

    test("rejects /admin/users with HTTP 403 Access Denied and zero user leakage", async ({ page }) => {
      await page.goto("/admin/users");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByTestId("admin-access-denied")).toBeVisible();
      await expect(page.getByText("HTTP 403 Forbidden")).toBeVisible();
      await expect(page.getByText("admins:manage")).toBeVisible();
      await expect(page.getByRole("button", { name: /Add Administrator/i })).not.toBeVisible();
    });

    test("rejects /admin/audit-logs with HTTP 403 Access Denied and zero log leakage", async ({ page }) => {
      await page.goto("/admin/audit-logs");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByTestId("admin-access-denied")).toBeVisible();
      await expect(page.getByText("HTTP 403 Forbidden")).toBeVisible();
      await expect(page.getByText("audit_logs:view")).toBeVisible();
    });

    test("rejects /admin/settings with HTTP 403 Access Denied and zero settings leakage", async ({ page }) => {
      await page.goto("/admin/settings");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByTestId("admin-access-denied")).toBeVisible();
      await expect(page.getByText("HTTP 403 Forbidden")).toBeVisible();
      await expect(page.getByText("settings:manage")).toBeVisible();
    });

    test("allows operational routes: /admin/enquiries, /admin/services, /admin/pricing", async ({ page }) => {
      await page.goto("/admin/enquiries");
      await expect(page.getByRole("heading", { name: "Client Enquiries & Leads" })).toBeVisible();

      await page.goto("/admin/services");
      await expect(page.getByRole("heading", { name: "Registered Agency Offerings" })).toBeVisible();

      await page.goto("/admin/pricing");
      await expect(page.getByRole("heading", { name: "Approved Pricing Packages" })).toBeVisible();
    });
  });

  test.describe("4. EDITOR Role: Content Focus with Strict Commercial/Governance Denials", () => {
    test.beforeEach(async ({ context }) => {
      const cookie = await createRoleSessionCookie("EDITOR");
      await context.addCookies([
        {
          name: SESSION_COOKIE_NAME,
          value: cookie,
          url: "http://localhost:3000",
        },
      ]);
    });

    test("rejects /admin/pricing with HTTP 403 Access Denied and zero package leakage", async ({ page }) => {
      await page.goto("/admin/pricing");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByTestId("admin-access-denied")).toBeVisible();
      await expect(page.getByText("HTTP 403 Forbidden")).toBeVisible();
      await expect(page.getByText("pricing:manage")).toBeVisible();
    });

    test("rejects /admin/users and /admin/audit-logs with HTTP 403 Access Denied", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByTestId("admin-access-denied")).toBeVisible();

      await page.goto("/admin/audit-logs");
      await expect(page.getByTestId("admin-access-denied")).toBeVisible();
    });

    test("renders /admin/enquiries in Read-Only mode", async ({ page }) => {
      await page.goto("/admin/enquiries");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByRole("heading", { name: "Client Enquiries & Leads" })).toBeVisible();
      await expect(page.getByText("Read-Only Access")).toBeVisible();
      await expect(page.getByTestId("admin-access-denied")).not.toBeVisible();
    });

    test("allows content routes: /admin/services, /admin/portfolio, /admin/faqs", async ({ page }) => {
      await page.goto("/admin/services");
      await expect(page.getByRole("heading", { name: "Registered Agency Offerings" })).toBeVisible();

      await page.goto("/admin/portfolio");
      await expect(page.getByRole("heading", { name: "Portfolio & Architecture Prototypes" })).toBeVisible();

      await page.goto("/admin/faqs");
      await expect(page.getByRole("heading", { name: "Knowledgebase & FAQ Management" })).toBeVisible();
    });
  });
});

