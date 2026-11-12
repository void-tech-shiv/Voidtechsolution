import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { AdminAccessDenied } from "@/components/admin/admin-access-denied";
import {
  updateEnquiryStatusAction,
  appendEnquiryNoteAction,
  deleteEnquiryAction,
  updateSiteSettingAction,
  toggleServiceActiveAction,
  createFaqAction,
  togglePricingPackageActiveAction,
} from "@/server/actions/admin-content.actions";
import * as authActions from "@/server/actions/auth.actions";
import * as enquiriesRepo from "@/server/repositories/enquiries.repo";
import * as settingsRepo from "@/server/repositories/settings.repo";
import * as servicesRepo from "@/server/repositories/services.repo";
import * as faqRepo from "@/server/repositories/faq.repo";
import * as auditModule from "@/server/security/audit";
import { prisma } from "@/lib/prisma";
import type { AdminUser, UserRole } from "@prisma/client";

// Mock next/headers
const mockHeaders = new Map<string, string>([
  ["host", "localhost:3000"],
  ["origin", "http://localhost:3000"],
]);

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(mockHeaders),
}));

// Mock repositories and security
vi.mock("@/server/actions/auth.actions", () => ({
  getCurrentAdmin: vi.fn(),
}));

vi.mock("@/server/repositories/enquiries.repo", () => ({
  updateEnquiryStatus: vi.fn(),
  appendEnquiryNote: vi.fn(),
  deleteEnquiry: vi.fn(),
}));

vi.mock("@/server/repositories/settings.repo", () => ({
  setSetting: vi.fn(),
}));

vi.mock("@/server/repositories/services.repo", () => ({
  updateService: vi.fn(),
}));

vi.mock("@/server/repositories/faq.repo", () => ({
  createFaq: vi.fn(),
}));

vi.mock("@/server/security/audit", () => ({
  recordAuditEvent: vi.fn(),
  AUDIT_ACTIONS: {
    ENQUIRY_STATUS_UPDATED: "ENQUIRY_STATUS_UPDATED",
    ENQUIRY_DELETED: "ENQUIRY_DELETED",
    SETTINGS_UPDATED: "SETTINGS_UPDATED",
  },
}));

const mockSuperAdminUser: AdminUser = {
  id: "usr_super_1",
  email: "super@voidtechsolution.com",
  passwordHash: "hash",
  name: "Super Admin",
  role: "SUPER_ADMIN" as UserRole,
  isActive: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdminUser: AdminUser = {
  id: "usr_admin_1",
  email: "admin@voidtechsolution.com",
  passwordHash: "hash",
  name: "Admin User",
  role: "ADMIN" as UserRole,
  isActive: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEditorUser: AdminUser = {
  id: "usr_editor_1",
  email: "editor@voidtechsolution.com",
  passwordHash: "hash",
  name: "Editor User",
  role: "EDITOR" as UserRole,
  isActive: true,
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Admin Access Denied Component", () => {
  it("renders default 403 Forbidden state and Return link", () => {
    render(<AdminAccessDenied />);

    expect(screen.getByTestId("admin-access-denied")).toBeInTheDocument();
    expect(screen.getByText("HTTP 403 Forbidden")).toBeInTheDocument();
    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(
      screen.getByText("You do not have the required permissions to access this administrative console section.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to Overview/i })).toHaveAttribute("href", "/admin");
  });

  it("renders contextual role and required permission badges", () => {
    render(
      <AdminAccessDenied
        role="EDITOR"
        requiredPermission="settings:manage"
        title="Settings Restricted"
      />
    );

    expect(screen.getByText("Settings Restricted")).toBeInTheDocument();
    expect(screen.getByText("Active Role:")).toBeInTheDocument();
    expect(screen.getByText("EDITOR")).toBeInTheDocument();
    expect(screen.getByText("Required Permission:")).toBeInTheDocument();
    expect(screen.getByText("settings:manage")).toBeInTheDocument();
  });
});

describe("Admin Content Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.set("host", "localhost:3000");
    mockHeaders.set("origin", "http://localhost:3000");
  });

  describe("updateEnquiryStatusAction", () => {
    it("rejects untrusted origin", async () => {
      mockHeaders.set("origin", "https://malicious-attacker.com");
      const res = await updateEnquiryStatusAction("enq_1", "IN_REVIEW");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Cross-origin request rejected");
    });

    it("rejects unauthenticated request", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce(null);
      const res = await updateEnquiryStatusAction("enq_1", "IN_REVIEW");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Authentication required.");
    });

    it("rejects EDITOR role due to missing enquiries:update_status permission", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockEditorUser,
        session: { id: "sess_1" } as any,
      });

      const res = await updateEnquiryStatusAction("enq_1", "IN_REVIEW");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Forbidden");
    });

    it("allows ADMIN and records audit log", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockAdminUser,
        session: { id: "sess_1" } as any,
      });

      vi.mocked(enquiriesRepo.updateEnquiryStatus).mockResolvedValueOnce({
        id: "enq_1",
        status: "IN_REVIEW",
        email: "client@example.com",
      } as any);

      const res = await updateEnquiryStatusAction("enq_1", "IN_REVIEW");
      expect(res.success).toBe(true);
      expect(enquiriesRepo.updateEnquiryStatus).toHaveBeenCalledWith("enq_1", "IN_REVIEW", undefined);
      expect(auditModule.recordAuditEvent).toHaveBeenCalled();
    });
  });

  describe("appendEnquiryNoteAction", () => {
    it("allows ADMIN to append notes", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockAdminUser,
        session: { id: "sess_1" } as any,
      });

      vi.mocked(enquiriesRepo.appendEnquiryNote).mockResolvedValueOnce({
        id: "enq_1",
        internalNotes: "Reviewed proposal",
      } as any);

      const res = await appendEnquiryNoteAction("enq_1", "Reviewed proposal");
      expect(res.success).toBe(true);
      expect(enquiriesRepo.appendEnquiryNote).toHaveBeenCalledWith(
        "enq_1",
        "Reviewed proposal",
        "Admin User"
      );
    });

    it("rejects EDITOR from appending notes", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockEditorUser,
        session: { id: "sess_1" } as any,
      });

      const res = await appendEnquiryNoteAction("enq_1", "Note");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Forbidden");
    });
  });

  describe("deleteEnquiryAction", () => {
    it("rejects ADMIN role (only SUPER_ADMIN has enquiries:delete)", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockAdminUser,
        session: { id: "sess_1" } as any,
      });

      const res = await deleteEnquiryAction("enq_1");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Forbidden");
    });

    it("allows SUPER_ADMIN to delete enquiry and logs audit event", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockSuperAdminUser,
        session: { id: "sess_1" } as any,
      });

      vi.mocked(enquiriesRepo.deleteEnquiry).mockResolvedValueOnce({
        id: "enq_1",
        email: "client@example.com",
      } as any);

      const res = await deleteEnquiryAction("enq_1");
      expect(res.success).toBe(true);
      expect(enquiriesRepo.deleteEnquiry).toHaveBeenCalledWith("enq_1");
      expect(auditModule.recordAuditEvent).toHaveBeenCalled();
    });
  });

  describe("updateSiteSettingAction", () => {
    it("rejects ADMIN role (only SUPER_ADMIN has settings:manage)", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockAdminUser,
        session: { id: "sess_1" } as any,
      });

      const res = await updateSiteSettingAction("site_name", "VOIDTECH");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Forbidden");
    });

    it("allows SUPER_ADMIN to update setting", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockSuperAdminUser,
        session: { id: "sess_1" } as any,
      });

      vi.mocked(settingsRepo.setSetting).mockResolvedValueOnce({
        key: "site_name",
        value: "VOIDTECH SOLUTION",
      } as any);

      const res = await updateSiteSettingAction("site_name", "VOIDTECH SOLUTION");
      expect(res.success).toBe(true);
      expect(settingsRepo.setSetting).toHaveBeenCalledWith(
        "site_name",
        "VOIDTECH SOLUTION",
        undefined
      );
    });
  });

  describe("toggleServiceActiveAction", () => {
    it("allows EDITOR role (services:manage is granted to EDITOR, ADMIN, SUPER_ADMIN)", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockEditorUser,
        session: { id: "sess_1" } as any,
      });

      vi.mocked(servicesRepo.updateService).mockResolvedValueOnce({
        id: "srv_1",
        isActive: false,
      } as any);

      const res = await toggleServiceActiveAction("srv_1", false);
      expect(res.success).toBe(true);
      expect(servicesRepo.updateService).toHaveBeenCalledWith("srv_1", { isActive: false });
    });
  });

  describe("createFaqAction", () => {
    it("validates required question and answer fields", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockAdminUser,
        session: { id: "sess_1" } as any,
      });

      const res = await createFaqAction("", "", "General");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Question and answer are required");
    });

    it("allows EDITOR to create FAQ", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockEditorUser,
        session: { id: "sess_1" } as any,
      });

      vi.mocked(faqRepo.createFaq).mockResolvedValueOnce({
        id: "faq_1",
        question: "What is VOIDTECH?",
        answer: "A software agency.",
        category: "General",
      } as any);

      const res = await createFaqAction("What is VOIDTECH?", "A software agency.", "General");
      expect(res.success).toBe(true);
      expect(faqRepo.createFaq).toHaveBeenCalled();
    });
  });

  describe("togglePricingPackageActiveAction", () => {
    it("rejects EDITOR role (pricing:manage restricted from EDITOR)", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockEditorUser,
        session: { id: "sess_1" } as any,
      });

      const res = await togglePricingPackageActiveAction("pkg_1", false);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Forbidden");
    });

    it("allows ADMIN to toggle pricing package status", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValueOnce({
        user: mockAdminUser,
        session: { id: "sess_1" } as any,
      });

      vi.spyOn(prisma.pricingPackage, "update").mockResolvedValueOnce({
        id: "pkg_1",
        isActive: false,
      } as any);

      const res = await togglePricingPackageActiveAction("pkg_1", false);
      expect(res.success).toBe(true);
      expect(prisma.pricingPackage.update).toHaveBeenCalledWith({
        where: { id: "pkg_1" },
        data: { isActive: false },
      });
    });
  });
});
