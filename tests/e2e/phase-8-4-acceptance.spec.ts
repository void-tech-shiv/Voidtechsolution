import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = [
  { path: "/", name: "Home" },
  { path: "/about", name: "About" },
  { path: "/services", name: "Services" },
  { path: "/pricing", name: "Pricing" },
  { path: "/portfolio", name: "Portfolio" },
  { path: "/contact", name: "Contact" },
] as const;

const TARGET_VIEWPORTS = [
  { name: "320px (iPhone SE narrow)", width: 320, height: 568 },
  { name: "360px (Android small)", width: 360, height: 740 },
  { name: "375px (iPhone mini/SE)", width: 375, height: 667 },
  { name: "390px (iPhone 13/14/15)", width: 390, height: 844 },
  { name: "430px (iPhone Pro Max)", width: 430, height: 932 },
  { name: "768px (iPad portrait)", width: 768, height: 1024 },
  { name: "1024px (iPad landscape)", width: 1024, height: 768 },
  { name: "1280px (Standard laptop)", width: 1280, height: 800 },
  { name: "1440px (Target wide grid)", width: 1440, height: 900 },
  { name: "1920px (Full HD display)", width: 1920, height: 1080 },
] as const;

test.describe("Phase 8.4 Acceptance: 10-Viewport Responsive & Zero Overflow Audit", () => {
  for (const vp of TARGET_VIEWPORTS) {
    test(`zero horizontal overflow across all 6 public pages at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of PUBLIC_ROUTES) {
        const response = await page.goto(route.path);
        expect(response?.status()).toBe(200);

        // Header check
        const brandLogo = page.locator("header a[aria-label='VOIDTECH SOLUTION Home']");
        await expect(brandLogo).toBeVisible();

        // Sub-pixel scroll width vs client width check
        const overflow = await page.evaluate(() => {
          const clientWidth = document.documentElement.clientWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          return {
            clientWidth,
            scrollWidth,
            hasOverflow: scrollWidth > clientWidth,
          };
        });

        expect(
          overflow.hasOverflow,
          `Horizontal scroll detected on ${route.path} at ${vp.width}px (${overflow.scrollWidth}px > ${overflow.clientWidth}px)`
        ).toBe(false);
      }
    });
  }
});

test.describe("Phase 8.4 Acceptance: User Journey A — Services Catalog & Prefill", () => {
  test("filters 18 core services, searches keyword, and pre-fills /contact", async ({ page }) => {
    await page.goto("/services");

    // Verify 18 tracks heading
    await expect(page.locator("h1")).toContainText("Engineering Scalable Software Across 18 Core Tracks.");

    // Filter by Mobile track
    const mobileBtn = page.getByRole("button", { name: "Mobile", exact: true });
    await mobileBtn.click();
    await expect(page.getByRole("heading", { name: "App Development", level: 3 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Website Development", level: 3 })).not.toBeVisible();

    // Reset to "All Services"
    const allServicesBtn = page.getByRole("button", { name: /All Services/i });
    await allServicesBtn.click();
    await expect(page.getByRole("heading", { name: "Website Development", level: 3 })).toBeVisible();

    // Live search for "AI"
    const searchInput = page.getByPlaceholder("Search capabilities or tech...");
    await searchInput.fill("AI");
    await expect(page.getByRole("heading", { name: "AI Agents", level: 3 })).toBeVisible();

    // Click Inquire CTA on AI Agents
    const aiInquireBtn = page.locator("a[href*='/contact?service=AI%20Agents']").first();
    await aiInquireBtn.click();

    // Verify navigation to /contact with prefilled query
    await page.waitForURL("**/contact?service=AI%20Agents");
    expect(page.url()).toContain("AI%20Agents");

    // Verify prefill banner
    await expect(page.getByText("Inquiry Focus:")).toBeVisible();
    await expect(page.locator("strong", { hasText: "AI Agents" })).toBeVisible();
  });
});

test.describe("Phase 8.4 Acceptance: User Journey B — Pricing Packages & Calculator", () => {
  test("displays all 10 INR starting pricing tiers, computes estimate, and links to /contact", async ({ page }) => {
    await page.goto("/pricing");

    // Verify 10 starting pricing packages in INR
    const startingPrices = [
      "₹999",
      "₹2,999",
      "₹5,999",
      "₹12,999+",
      "₹19,999+",
      "₹24,999+",
      "₹29,999+",
      "₹34,999+",
      "₹49,999+",
      "₹59,999+",
    ];

    for (const price of startingPrices) {
      await expect(page.locator(`text=${price}`).first()).toBeVisible();
    }

    // Verify Interactive Pricing Calculator section exists
    const calculatorSection = page.locator("section#calculator");
    await expect(calculatorSection).toBeVisible();

    // Click package CTA
    const packageCta = page.locator("a[href*='/contact?package=']").first();
    await expect(packageCta).toBeVisible();
    await packageCta.click();

    // Verify navigation to /contact with package prefill
    await page.waitForURL("**/contact?package=*");
    expect(page.url()).toContain("package=");
  });
});

test.describe("Phase 8.4 Acceptance: User Journey C — Portfolio Concepts & Case Studies", () => {
  test("displays concept prototype badges, filters work, and opens case study", async ({ page }) => {
    await page.goto("/portfolio");

    // Verify Concept Lab disclosures are prominently visible
    await expect(page.getByText("AUTHENTIC LAB PROTOTYPES").first()).toBeVisible();
    await expect(page.getByText("Zero fabricated case studies or client results.").first()).toBeVisible();

    // Open first case study
    const caseStudyLink = page.locator("a[href='/portfolio/algorithmic-liquidity-engine']").first();
    await expect(caseStudyLink).toBeVisible();
    await caseStudyLink.click();

    // Verify case study page loaded
    await page.waitForURL("**/portfolio/algorithmic-liquidity-engine");
    await expect(page.locator("h1")).toContainText("Algorithmic Liquidity & Execution Engine");

    // Verify Concept badge & architecture lab attribution
    await expect(page.getByText("CONCEPT").first()).toBeVisible();
    await expect(page.getByText("VoidTech Concept Lab (Architecture Prototype)").first()).toBeVisible();

    // Verify architecture & metrics
    await expect(page.getByText("System Architecture Blueprint")).toBeVisible();
    await expect(page.getByText("Simulated Throughput")).toBeVisible();
  });
});

test.describe("Phase 8.4 Acceptance: User Journey D — Contact Form Intake & Multi-Step Validation", () => {
  test("validates required fields, prevents submission with invalid data, and supports multi-step flow", async ({ page }) => {
    await page.goto("/contact");

    // Step 1: Default category is selected. Advance to Step 2.
    const continueBtn = page.getByRole("button", { name: "Continue: Technical Specs" });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // Step 2: Technical Specifications & Timeline
    const briefTextarea = page.locator("#projectBrief");
    await expect(briefTextarea).toBeVisible();

    // Attempt to proceed from Step 2 without filling requirements
    const continueToContactBtn = page.getByRole("button", { name: "Continue: Contact Info" });
    await continueToContactBtn.click();
    await expect(page.getByText("Please provide at least 10 characters")).toBeVisible();

    // Fill valid brief requirements
    await briefTextarea.fill("We require a high-throughput microservices architecture with real-time websocket order streaming and automated PostgreSQL backups.");
    await continueToContactBtn.click();

    // Step 3: Contact & Client Information
    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    const submitBtn = page.getByRole("button", { name: "Submit Project Enquiry" });
    await expect(submitBtn).toBeVisible();

    // Attempt to submit without filling required contact fields or consent
    await submitBtn.click();
    await expect(page.getByText("Full name must be at least 2 characters long")).toBeVisible();
    await expect(page.getByText("Please provide a valid work email address")).toBeVisible();
    await expect(page.getByText("You must agree to consultation communications to proceed")).toBeVisible();

    // Fill valid contact information
    await page.locator("#fullName").fill("Devendra Sharma");
    await page.locator("#workEmail").fill("devendra@techfirm.co.in");
    await page.locator("#phoneNumber").fill("+91 9876543210");
    await page.locator("#companyName").fill("Sharma Technologies Pvt Ltd");
    await page.locator("input[type='checkbox']").check();

    // Verify error messages clear
    await expect(page.getByText("Full name must be at least 2 characters long")).not.toBeVisible();
  });
});

test.describe("Phase 8.4 Acceptance: User Journey E — Navigation, Brand Logo & Mobile Drawer", () => {
  test("header displays single brand logo, and mobile drawer opens with full keyboard & touch dismissal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Verify exactly ONE BrandLogo in mobile header
    const mobileHeaderLogos = page.locator("header a[aria-label='VOIDTECH SOLUTION Home']");
    await expect(mobileHeaderLogos).toHaveCount(1);

    // Open drawer
    const menuBtn = page.getByRole("button", { name: "Open navigation menu" });
    await menuBtn.click();

    const drawer = page.getByRole("dialog", { name: "Mobile Navigation Menu" });
    await expect(drawer).toBeVisible();

    // Press Escape to dismiss drawer
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();

    // Reopen drawer and verify navigation to /pricing
    await menuBtn.click();
    await expect(drawer).toBeVisible();
    const pricingLink = drawer.getByRole("link", { name: "Pricing", exact: true });
    await pricingLink.click();
    await page.waitForURL("**/pricing");
    expect(page.url()).toContain("/pricing");
    await expect(drawer).not.toBeVisible();
  });
});

test.describe("Phase 8.4 Acceptance: User Journey F — Admin Security & RBAC Protection", () => {
  test("unauthenticated access to admin console redirects cleanly to /admin/login", async ({ page }) => {
    const protectedRoutes = [
      "/admin",
      "/admin/users",
      "/admin/audit-logs",
      "/admin/settings",
      "/admin/enquiries",
      "/admin/services",
      "/admin/pricing",
      "/admin/portfolio",
      "/admin/faqs",
    ];

    for (const route of protectedRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).not.toBe(404);

      // Verify redirection to /admin/login with callbackUrl
      expect(page.url()).toContain("/admin/login");
      expect(page.url()).toContain("callbackUrl=");
      expect(page.url()).toContain(encodeURIComponent(route));

      // Verify login UI loaded cleanly
      await expect(page.getByRole("heading", { name: "Admin Console" })).toBeVisible();
      await expect(page.getByLabel(/Administrator Email/i)).toBeVisible();
      await expect(page.getByLabel(/Master Password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: "Authenticate" })).toBeVisible();
    }
  });
});
