import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminDashboardOverviewPage from "@/app/admin/(dashboard)/page";
import AdminUsersPage from "@/app/admin/(dashboard)/users/page";
import AdminAuditLogsPage from "@/app/admin/(dashboard)/audit-logs/page";
import AdminSettingsPage from "@/app/admin/(dashboard)/settings/page";
import AdminEnquiriesPage from "@/app/admin/(dashboard)/enquiries/page";
import AdminServicesPage from "@/app/admin/(dashboard)/services/page";
import AdminPricingPage from "@/app/admin/(dashboard)/pricing/page";
import AdminPortfolioPage from "@/app/admin/(dashboard)/portfolio/page";
import AdminFaqsPage from "@/app/admin/(dashboard)/faqs/page";
import * as authActions from "@/server/actions/auth.actions";
import * as usersRepo from "@/server/repositories/users.repo";
import * as auditSecurity from "@/server/security/audit";
import * as settingsRepo from "@/server/repositories/settings.repo";
import * as enquiriesRepo from "@/server/repositories/enquiries.repo";
import * as servicesRepo from "@/server/repositories/services.repo";
import * as pricingRepo from "@/server/repositories/pricing.repo";
import * as portfolioRepo from "@/server/repositories/portfolio.repo";
import * as faqRepo from "@/server/repositories/faq.repo";
import { prisma } from "@/lib/prisma";
import type { AdminUser, AdminSession, UserRole } from "@prisma/client";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  usePathname: () => "/admin",
}));

// Mock repositories and actions
vi.mock("@/server/actions/auth.actions", () => ({
  getCurrentAdmin: vi.fn(),
}));

vi.mock("@/server/repositories/users.repo", () => ({
  getAllAdmins: vi.fn(),
}));

vi.mock("@/server/security/audit", () => ({
  getAuditHistory: vi.fn(),
}));

vi.mock("@/server/repositories/settings.repo", () => ({
  getAllSettings: vi.fn(),
}));

vi.mock("@/server/repositories/enquiries.repo", () => ({
  getEnquiries: vi.fn(),
  getEnquiryStats: vi.fn(),
}));

vi.mock("@/server/repositories/services.repo", () => ({
  getAllServices: vi.fn(),
}));

vi.mock("@/server/repositories/pricing.repo", () => ({
  getAllPricingPackages: vi.fn(),
}));

vi.mock("@/server/repositories/portfolio.repo", () => ({
  getAllProjects: vi.fn(),
}));

vi.mock("@/server/repositories/faq.repo", () => ({
  getAllFaqs: vi.fn(),
}));

function mockSession(role: UserRole): { user: AdminUser; session: AdminSession } {
  return {
    user: {
      id: `usr_${role.toLowerCase()}`,
      email: `${role.toLowerCase()}@voidtechsolution.com`,
      name: `${role} Operator`,
      role,
      passwordHash: "hash",
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: `sess_${role.toLowerCase()}`,
      userId: `usr_${role.toLowerCase()}`,
      sessionToken: "hash",
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      lastActiveAt: new Date(),
      createdAt: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "TestAgent",
    },
  };
}

describe("Authenticated Admin Pages & Server-Side RBAC Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock repository returns
    vi.mocked(usersRepo.getAllAdmins).mockResolvedValue([
      { id: "usr_1", email: "admin@voidtech.test", name: "Admin One", role: "ADMIN", isActive: true, createdAt: new Date(), lastLoginAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(auditSecurity.getAuditHistory).mockResolvedValue({ logs: [], total: 0 });
    vi.mocked(settingsRepo.getAllSettings).mockResolvedValue({
      site_name: "VOIDTECH SOLUTION",
      site_tagline: "Build. Launch. Grow Online.",
      contact_email: "contact@voidtechsolution.com",
      enquiry_auto_reply: "true",
      maintenance_mode: "false",
    });
    vi.mocked(enquiriesRepo.getEnquiries).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    });
    vi.mocked(enquiriesRepo.getEnquiryStats).mockResolvedValue({
      NEW: 0,
      IN_REVIEW: 0,
      CONTACTED: 0,
      CONVERTED: 0,
      ARCHIVED: 0,
    });
    vi.mocked(servicesRepo.getAllServices).mockResolvedValue([]);
    vi.mocked(pricingRepo.getAllPricingPackages).mockResolvedValue([]);
    vi.mocked(portfolioRepo.getAllProjects).mockResolvedValue([]);
    vi.mocked(faqRepo.getAllFaqs).mockResolvedValue([]);

    vi.spyOn(prisma.enquiry, "count").mockResolvedValue(0);
    vi.spyOn(prisma.service, "count").mockResolvedValue(0);
    vi.spyOn(prisma.pricingPackage, "count").mockResolvedValue(0);
    vi.spyOn(prisma.adminUser, "count").mockResolvedValue(1);
  });

  describe("SUPER_ADMIN Role: Unrestricted Access to All 9 Routes", () => {
    beforeEach(() => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue(mockSession("SUPER_ADMIN"));
    });

    it("renders /admin Overview page with metrics and operational status", async () => {
      const page = await AdminDashboardOverviewPage();
      render(page);

      expect(screen.getByText(/VOIDTECH SOLUTION administrative console/i)).toBeInTheDocument();
      expect(screen.getByText("Welcome, SUPER_ADMIN Operator")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("renders /admin/users Team & Access Control with administrative controls", async () => {
      const page = await AdminUsersPage();
      render(page);

      expect(screen.getByText("Team & Access Control")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add Administrator/i })).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("renders /admin/audit-logs Security Audit Trail", async () => {
      const page = await AdminAuditLogsPage();
      render(page);

      expect(screen.getByText("Audit Trail & Security Logs")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("renders /admin/settings Platform Configuration", async () => {
      const page = await AdminSettingsPage();
      render(page);

      expect(screen.getByText("Platform Configuration")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("renders /admin/enquiries Client Enquiries Pipeline with full controls", async () => {
      const page = await AdminEnquiriesPage();
      render(page);

      expect(screen.getByText("Client Enquiries & Leads")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("renders /admin/services Agency Offerings Catalog", async () => {
      const page = await AdminServicesPage();
      render(page);

      expect(screen.getByText("Registered Agency Offerings")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("renders /admin/pricing Commercial Pricing Packages", async () => {
      const page = await AdminPricingPage();
      render(page);

      expect(screen.getByText("Approved Pricing Packages")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("renders /admin/portfolio Portfolio Case Studies & Concept Lab", async () => {
      const page = await AdminPortfolioPage();
      render(page);

      expect(screen.getByText("Portfolio & Architecture Prototypes")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("renders /admin/faqs Knowledgebase FAQs", async () => {
      const page = await AdminFaqsPage();
      render(page);

      expect(screen.getByText("Knowledgebase & FAQ Management")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add Question/i })).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });
  });

  describe("ADMIN Role: Operational Access with Strict Security Isolation", () => {
    beforeEach(() => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue(mockSession("ADMIN"));
    });

    it("renders /admin Overview page cleanly", async () => {
      const page = await AdminDashboardOverviewPage();
      render(page);

      expect(screen.getByText(/VOIDTECH SOLUTION administrative console/i)).toBeInTheDocument();
      expect(screen.getByText("Welcome, ADMIN Operator")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("rejects /admin/users with HTTP 403 Access Denied and zero user leakage", async () => {
      const page = await AdminUsersPage();
      render(page);

      expect(screen.getByTestId("admin-access-denied")).toBeInTheDocument();
      expect(screen.getByText("HTTP 403 Forbidden")).toBeInTheDocument();
      expect(screen.getByText("admins:manage")).toBeInTheDocument();
      expect(usersRepo.getAllAdmins).not.toHaveBeenCalled();
    });

    it("rejects /admin/audit-logs with HTTP 403 Access Denied and zero log leakage", async () => {
      const page = await AdminAuditLogsPage();
      render(page);

      expect(screen.getByTestId("admin-access-denied")).toBeInTheDocument();
      expect(screen.getByText("HTTP 403 Forbidden")).toBeInTheDocument();
      expect(screen.getByText("audit_logs:view")).toBeInTheDocument();
      expect(auditSecurity.getAuditHistory).not.toHaveBeenCalled();
    });

    it("rejects /admin/settings with HTTP 403 Access Denied and zero setting leakage", async () => {
      const page = await AdminSettingsPage();
      render(page);

      expect(screen.getByTestId("admin-access-denied")).toBeInTheDocument();
      expect(screen.getByText("HTTP 403 Forbidden")).toBeInTheDocument();
      expect(screen.getByText("settings:manage")).toBeInTheDocument();
      expect(settingsRepo.getAllSettings).not.toHaveBeenCalled();
    });

    it("allows /admin/enquiries, /admin/services, /admin/pricing, /admin/portfolio, /admin/faqs", async () => {
      const enquiries = await AdminEnquiriesPage();
      render(enquiries);
      expect(screen.getByText("Client Enquiries & Leads")).toBeInTheDocument();

      const services = await AdminServicesPage();
      render(services);
      expect(screen.getByText("Registered Agency Offerings")).toBeInTheDocument();

      const pricing = await AdminPricingPage();
      render(pricing);
      expect(screen.getByText("Approved Pricing Packages")).toBeInTheDocument();

      const portfolio = await AdminPortfolioPage();
      render(portfolio);
      expect(screen.getByText("Portfolio & Architecture Prototypes")).toBeInTheDocument();

      const faqs = await AdminFaqsPage();
      render(faqs);
      expect(screen.getByText("Knowledgebase & FAQ Management")).toBeInTheDocument();
    });
  });

  describe("EDITOR Role: Content Focus with Commercial and Governance Restrictions", () => {
    beforeEach(() => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue(mockSession("EDITOR"));
    });

    it("rejects /admin/pricing with HTTP 403 Access Denied and zero package leakage", async () => {
      const page = await AdminPricingPage();
      render(page);

      expect(screen.getByTestId("admin-access-denied")).toBeInTheDocument();
      expect(screen.getByText("HTTP 403 Forbidden")).toBeInTheDocument();
      expect(screen.getByText("pricing:manage")).toBeInTheDocument();
      expect(pricingRepo.getAllPricingPackages).not.toHaveBeenCalled();
    });

    it("rejects /admin/users with HTTP 403 Access Denied", async () => {
      const page = await AdminUsersPage();
      render(page);
      expect(screen.getByTestId("admin-access-denied")).toBeInTheDocument();
    });

    it("rejects /admin/audit-logs with HTTP 403 Access Denied", async () => {
      const page = await AdminAuditLogsPage();
      render(page);
      expect(screen.getByTestId("admin-access-denied")).toBeInTheDocument();
    });

    it("rejects /admin/settings with HTTP 403 Access Denied", async () => {
      const page = await AdminSettingsPage();
      render(page);
      expect(screen.getByTestId("admin-access-denied")).toBeInTheDocument();
    });

    it("renders /admin/enquiries in read-only mode without status updater or delete button", async () => {
      const page = await AdminEnquiriesPage();
      render(page);

      expect(screen.getByText("Client Enquiries & Leads")).toBeInTheDocument();
      expect(screen.getByText(/Read-Only Access/i)).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-denied")).not.toBeInTheDocument();
    });

    it("allows content routes: /admin/services, /admin/portfolio, /admin/faqs", async () => {
      const services = await AdminServicesPage();
      render(services);
      expect(screen.getByText("Registered Agency Offerings")).toBeInTheDocument();

      const portfolio = await AdminPortfolioPage();
      render(portfolio);
      expect(screen.getByText("Portfolio & Architecture Prototypes")).toBeInTheDocument();

      const faqs = await AdminFaqsPage();
      render(faqs);
      expect(screen.getByText("Knowledgebase & FAQ Management")).toBeInTheDocument();
    });
  });
});
