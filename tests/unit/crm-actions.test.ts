import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCrmMetricsAction,
  getKanbanLeadsAction,
  updateLeadStageAction,
  createLeadNoteAction,
  deleteLeadNoteAction,
  createLeadFollowUpAction,
  toggleLeadFollowUpAction,
  assignLeadAction,
  getAdminNotificationsAction,
} from "@/server/actions/crm.actions";
import * as authActions from "@/server/actions/auth.actions";
import * as originModule from "@/server/security/origin";
import * as enquiriesRepo from "@/server/repositories/enquiries.repo";
import * as notesRepo from "@/server/repositories/lead-notes.repo";
import * as followupsRepo from "@/server/repositories/lead-followups.repo";
import * as assignmentsRepo from "@/server/repositories/lead-assignments.repo";
import * as activitiesRepo from "@/server/repositories/lead-activities.repo";
import * as notificationsRepo from "@/server/repositories/notifications.repo";
import * as auditModule from "@/server/security/audit";
import { prisma } from "@/lib/prisma";
import type { AdminUser, UserRole } from "@prisma/client";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve(
      new Map<string, string>([
        ["host", "localhost:3000"],
        ["origin", "http://localhost:3000"],
      ])
    ),
}));

// Mock repositories and security
vi.mock("@/server/security/origin", () => ({
  validateRequestOrigin: vi.fn(),
}));

vi.mock("@/server/actions/auth.actions", () => ({
  getCurrentAdmin: vi.fn(),
}));

vi.mock("@/server/security/audit", () => ({
  recordAuditEvent: vi.fn().mockResolvedValue({ id: "audit_1" }),
}));

vi.mock("@/server/repositories/enquiries.repo", () => ({
  getEnquiries: vi.fn(),
  getEnquiryById: vi.fn(),
  updateEnquiryStatus: vi.fn(),
  getEnquiryStats: vi.fn(),
  ConcurrencyConflictError: class ConcurrencyConflictError extends Error {
    readonly code = "CONFLICT_DETECTED";
  },
}));

vi.mock("@/server/repositories/lead-notes.repo", () => ({
  createLeadNote: vi.fn(),
  togglePinLeadNote: vi.fn(),
  deleteLeadNote: vi.fn(),
}));

vi.mock("@/server/repositories/lead-followups.repo", () => ({
  createLeadFollowUp: vi.fn(),
  toggleFollowUpComplete: vi.fn(),
  deleteLeadFollowUp: vi.fn(),
}));

vi.mock("@/server/repositories/lead-assignments.repo", () => ({
  assignLeadToAdmin: vi.fn(),
  unassignLead: vi.fn(),
}));

vi.mock("@/server/repositories/lead-activities.repo", () => ({
  createLeadActivity: vi.fn().mockResolvedValue({ id: "act_1" }),
}));

vi.mock("@/server/repositories/notifications.repo", () => ({
  createAdminNotification: vi.fn().mockResolvedValue({ id: "notif_1" }),
  getAdminNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    enquiry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    leadFollowUp: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    adminUser: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

function createMockAdmin(role: UserRole = "ADMIN", isActive = true): AdminUser {
  return {
    id: `admin_${role.toLowerCase()}`,
    name: `${role} User`,
    email: `${role.toLowerCase()}@voidtech.com`,
    passwordHash: "secret_hash",
    role,
    isActive,
    lastLoginAt: null,
    createdAt: new Date("2026-11-01"),
    updatedAt: new Date("2026-11-01"),
  };
}

describe("Phase 9.2: CRM Server Actions, OCC & RBAC Policy Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(originModule.validateRequestOrigin).mockReturnValue(true);
    vi.mocked(authActions.getCurrentAdmin).mockResolvedValue({
      user: createMockAdmin("ADMIN"),
      sessionToken: "session_token",
    } as any);
  });

  describe("Security & Pre-flight Authentication", () => {
    it("rejects cross-origin requests silently", async () => {
      vi.mocked(originModule.validateRequestOrigin).mockReturnValue(false);
      const res = await getCrmMetricsAction();
      expect(res.success).toBe(false);
      expect(res.error).toBe("Cross-origin request rejected.");
    });

    it("rejects unauthenticated requests", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue(null);
      const res = await getCrmMetricsAction();
      expect(res.success).toBe(false);
      expect(res.error).toBe("Authentication required.");
    });

    it("rejects deactivated administrators immediately", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue({
        user: createMockAdmin("ADMIN", false),
        sessionToken: "session_token",
      } as any);
      const res = await getCrmMetricsAction();
      expect(res.success).toBe(false);
      expect(res.error).toBe("Authentication required.");
    });
  });

  describe("KPI Calculations & Stage Aggregation Engine", () => {
    it("computes active pipeline value, won revenue, and win-rate accurately", async () => {
      vi.mocked(prisma.enquiry.findMany).mockResolvedValue([
        { id: "1", status: "NEW", estimatedValueInr: 100000, budgetRange: null },
        { id: "2", status: "CONTACTED", estimatedValueInr: 150000, budgetRange: null },
        { id: "3", status: "QUALIFIED", estimatedValueInr: 250000, budgetRange: null },
        { id: "4", status: "WON", estimatedValueInr: 500000, budgetRange: null },
        { id: "5", status: "LOST", estimatedValueInr: 200000, budgetRange: null },
      ] as any);

      vi.mocked(prisma.leadFollowUp.count).mockResolvedValue(3);

      const res = await getCrmMetricsAction();
      expect(res.success).toBe(true);
      expect(res.data?.totalLeads).toBe(5);
      expect(res.data?.newLeads).toBe(1);
      // Active = NEW (100k) + CONTACTED (150k) + QUALIFIED (250k) = 500,000
      expect(res.data?.activePipelineValueInr).toBe(500000);
      expect(res.data?.wonRevenueInr).toBe(500000);
      // Win Rate = WON (1) / (WON 1 + LOST 1) * 100 = 50%
      expect(res.data?.winRatePercentage).toBe(50);
      expect(res.data?.overdueFollowUpsCount).toBe(3);
    });

    it("handles zero terminal leads without division by zero or NaN", async () => {
      vi.mocked(prisma.enquiry.findMany).mockResolvedValue([
        { id: "1", status: "NEW", estimatedValueInr: 50000, budgetRange: null },
      ] as any);
      vi.mocked(prisma.leadFollowUp.count).mockResolvedValue(0);

      const res = await getCrmMetricsAction();
      expect(res.success).toBe(true);
      expect(res.data?.winRatePercentage).toBe(0);
    });
  });

  describe("Kanban Pipeline & Stage Transitions", () => {
    it("returns all eight approved Kanban stages with counts", async () => {
      vi.mocked(prisma.enquiry.findMany).mockResolvedValue([
        { id: "1", name: "Alice", status: "NEW", estimatedValueInr: 50000 },
        { id: "2", name: "Bob", status: "WON", estimatedValueInr: 200000 },
      ] as any);

      const res = await getKanbanLeadsAction();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(8);
      expect(res.data?.map((col) => col.stage)).toEqual([
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "PROPOSAL_SENT",
        "NEGOTIATION",
        "WON",
        "LOST",
        "ON_HOLD",
      ]);
      expect(res.data?.find((c) => c.stage === "NEW")?.count).toBe(1);
      expect(res.data?.find((c) => c.stage === "WON")?.totalValueInr).toBe(200000);
    });

    it("denies EDITOR from moving a lead stage (RBAC enforcement)", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue({
        user: createMockAdmin("EDITOR"),
        sessionToken: "session_token",
      } as any);

      const res = await updateLeadStageAction({
        enquiryId: "enq_1",
        newStatus: "QUALIFIED",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/forbidden|permission/i);
      expect(enquiriesRepo.updateEnquiryStatus).not.toHaveBeenCalled();
    });

    it("requires a non-empty lostReason when transitioning to LOST", async () => {
      const res = await updateLeadStageAction({
        enquiryId: "enq_1",
        newStatus: "LOST",
        lostReason: "",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/lostReason is mandatory/i);
      expect(enquiriesRepo.updateEnquiryStatus).not.toHaveBeenCalled();
    });

    it("detects OCC conflicts and returns machine-readable CONFLICT_DETECTED code", async () => {
      vi.mocked(enquiriesRepo.getEnquiryById).mockResolvedValue({
        id: "enq_1",
        status: "NEW",
        updatedAt: new Date("2026-11-13T01:00:00Z"),
      } as any);

      const ConcurrencyConflictError = (enquiriesRepo as any).ConcurrencyConflictError;
      vi.mocked(enquiriesRepo.updateEnquiryStatus).mockRejectedValue(
        new ConcurrencyConflictError("Concurrency conflict: Enquiry was modified by another administrator.")
      );

      const res = await updateLeadStageAction({
        enquiryId: "enq_1",
        newStatus: "CONTACTED",
        expectedUpdatedAt: new Date("2026-11-13T00:50:00Z"),
      });

      expect(res.success).toBe(false);
      expect(res.code).toBe("CONFLICT_DETECTED");
      expect(res.error).toMatch(/Conflict/);
    });

    it("records immutable activity and audit event on successful stage update", async () => {
      vi.mocked(enquiriesRepo.getEnquiryById).mockResolvedValue({
        id: "enq_1",
        status: "NEW",
        updatedAt: new Date(),
      } as any);

      vi.mocked(enquiriesRepo.updateEnquiryStatus).mockResolvedValue({
        id: "enq_1",
        status: "CONTACTED",
        assignedAdminId: "admin_other",
        name: "Test Client",
      } as any);

      const res = await updateLeadStageAction({
        enquiryId: "enq_1",
        newStatus: "CONTACTED",
      });

      expect(res.success).toBe(true);
      expect(activitiesRepo.createLeadActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          enquiryId: "enq_1",
          type: "STATUS_CHANGE",
        })
      );
      expect(auditModule.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LEAD_STAGE_UPDATED",
          entityId: "enq_1",
        })
      );
      expect(notificationsRepo.createAdminNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: "admin_other",
          type: "STATUS_CHANGED",
        })
      );
    });
  });

  describe("Internal Notes Security & Governance", () => {
    it("denies EDITOR from creating internal notes", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue({
        user: createMockAdmin("EDITOR"),
        sessionToken: "session_token",
      } as any);

      const res = await createLeadNoteAction({
        enquiryId: "enq_1",
        content: "Private evaluation",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/forbidden|permission/i);
    });

    it("allows ADMIN to create notes with activity tracking", async () => {
      vi.mocked(notesRepo.createLeadNote).mockResolvedValue({
        id: "note_1",
        enquiryId: "enq_1",
        content: "Private technical review",
        isPinned: false,
      } as any);

      const res = await createLeadNoteAction({
        enquiryId: "enq_1",
        content: "Private technical review",
      });

      expect(res.success).toBe(true);
      expect(activitiesRepo.createLeadActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "NOTE_ADDED",
        })
      );
    });

    it("restricts note deletion strictly to SUPER_ADMIN (ADMIN denied)", async () => {
      // ADMIN role
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue({
        user: createMockAdmin("ADMIN"),
        sessionToken: "session_token",
      } as any);

      const res = await deleteLeadNoteAction("note_1");
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/forbidden|permission/i);
      expect(notesRepo.deleteLeadNote).not.toHaveBeenCalled();
    });

    it("allows SUPER_ADMIN to delete notes to preserve audit governance", async () => {
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue({
        user: createMockAdmin("SUPER_ADMIN"),
        sessionToken: "session_token",
      } as any);

      vi.mocked(notesRepo.deleteLeadNote).mockResolvedValue({
        id: "note_1",
        enquiryId: "enq_1",
      } as any);

      const res = await deleteLeadNoteAction("note_1");
      expect(res.success).toBe(true);
      expect(notesRepo.deleteLeadNote).toHaveBeenCalledWith("note_1");
    });
  });

  describe("Follow-Up Management & In-App Notifications", () => {
    it("schedules follow-up tasks and dispatches notification if assigned to another admin", async () => {
      vi.mocked(followupsRepo.createLeadFollowUp).mockResolvedValue({
        id: "task_1",
        enquiryId: "enq_1",
        title: "Call client",
        priority: "HIGH",
        dueAt: new Date("2026-11-20T10:00:00Z"),
      } as any);

      const res = await createLeadFollowUpAction({
        enquiryId: "enq_1",
        title: "Call client",
        dueAt: "2026-11-20T10:00:00Z",
        priority: "HIGH",
        assignedToId: "admin_colleague",
      });

      expect(res.success).toBe(true);
      expect(notificationsRepo.createAdminNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: "admin_colleague",
          type: "FOLLOWUP_DUE",
        })
      );
    });

    it("toggles follow-up completion status", async () => {
      vi.mocked(followupsRepo.toggleFollowUpComplete).mockResolvedValue({
        id: "task_1",
        enquiryId: "enq_1",
        title: "Call client",
        isCompleted: true,
      } as any);

      const res = await toggleLeadFollowUpAction("task_1", true);
      expect(res.success).toBe(true);
      expect(activitiesRepo.createLeadActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "FOLLOWUP_COMPLETED",
        })
      );
    });

    it("enforces recipient isolation for in-app notifications", async () => {
      const currentAdmin = createMockAdmin("ADMIN");
      vi.mocked(authActions.getCurrentAdmin).mockResolvedValue({
        user: currentAdmin,
        sessionToken: "session_token",
      } as any);

      vi.mocked(notificationsRepo.getAdminNotifications).mockResolvedValue([
        { id: "notif_1", recipientId: currentAdmin.id, title: "Lead Assigned" },
      ] as any);
      vi.mocked(notificationsRepo.getUnreadNotificationCount).mockResolvedValue(1);

      const res = await getAdminNotificationsAction();
      expect(res.success).toBe(true);
      expect(notificationsRepo.getAdminNotifications).toHaveBeenCalledWith(
        currentAdmin.id,
        false,
        30
      );
      expect(notificationsRepo.getUnreadNotificationCount).toHaveBeenCalledWith(
        currentAdmin.id
      );
    });
  });

  describe("Deal Assignment & Team Governance", () => {
    it("assigns lead to an active administrator with notification and audit logging", async () => {
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue({
        id: "admin_target",
        name: "Target Engineer",
        email: "target@voidtech.com",
      } as any);

      vi.mocked(assignmentsRepo.assignLeadToAdmin).mockResolvedValue({
        id: "asg_1",
        enquiryId: "enq_1",
        adminId: "admin_target",
      } as any);

      const res = await assignLeadAction({
        enquiryId: "enq_1",
        adminId: "admin_target",
        notes: "Assigned for cloud enterprise expertise",
      });

      expect(res.success).toBe(true);
      expect(assignmentsRepo.assignLeadToAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          enquiryId: "enq_1",
          adminId: "admin_target",
        })
      );
      expect(notificationsRepo.createAdminNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: "admin_target",
          type: "LEAD_ASSIGNED",
        })
      );
      expect(auditModule.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LEAD_ASSIGNED",
          entityId: "enq_1",
        })
      );
    });
  });
});
