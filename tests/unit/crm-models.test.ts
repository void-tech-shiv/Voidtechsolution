import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createLeadNote,
  getLeadNotes,
  togglePinLeadNote,
  deleteLeadNote,
} from "@/server/repositories/lead-notes.repo";
import {
  createLeadFollowUp,
  getLeadFollowUps,
  getOverdueFollowUps,
  toggleFollowUpComplete,
  deleteLeadFollowUp,
} from "@/server/repositories/lead-followups.repo";
import {
  createLeadActivity,
  getLeadActivities,
} from "@/server/repositories/lead-activities.repo";
import {
  assignLeadToAdmin,
  unassignLead,
  getActiveAssignment,
  getLeadAssignmentHistory,
} from "@/server/repositories/lead-assignments.repo";
import {
  createAdminNotification,
  getAdminNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/server/repositories/notifications.repo";
import {
  getEnquiryById,
  updateEnquiryStatus,
  getEnquiries,
  getEnquiryStats,
} from "@/server/repositories/enquiries.repo";
import { EnquiryStatus } from "@prisma/client";

describe("Phase 9.1: CRM Lead Management & Pipeline Repositories", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. LEAD NOTES REPOSITORY
  // ============================================================================
  describe("LeadNotesRepo", () => {
    it("creates an internal lead note with author attribution", async () => {
      const mockCreated = {
        id: "note_123",
        enquiryId: "enq_001",
        authorId: "admin_1",
        authorName: "Shivanshu",
        content: "Client confirmed interest in Full-Stack Web Development tier.",
        isPinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.leadNote, "create").mockResolvedValueOnce(mockCreated as any);

      const note = await createLeadNote({
        enquiryId: "enq_001",
        authorId: "admin_1",
        authorName: "Shivanshu",
        content: "Client confirmed interest in Full-Stack Web Development tier.",
      });

      expect(note.id).toBe("note_123");
      expect(note.authorName).toBe("Shivanshu");
      expect(note.content).toContain("Full-Stack Web Development");
      expect(prisma.leadNote.create).toHaveBeenCalledWith({
        data: {
          enquiryId: "enq_001",
          authorId: "admin_1",
          authorName: "Shivanshu",
          content: "Client confirmed interest in Full-Stack Web Development tier.",
          isPinned: false,
        },
      });
    });

    it("retrieves notes with pinned notes sorted first, then newest", async () => {
      const mockNotes = [
        {
          id: "note_pin",
          enquiryId: "enq_001",
          content: "CRITICAL: Custom NDA required before kick-off.",
          isPinned: true,
          createdAt: new Date("2026-11-10T10:00:00Z"),
        },
        {
          id: "note_recent",
          enquiryId: "enq_001",
          content: "Spoke with client on phone.",
          isPinned: false,
          createdAt: new Date("2026-11-12T15:00:00Z"),
        },
      ];

      vi.spyOn(prisma.leadNote, "findMany").mockResolvedValueOnce(mockNotes as any);

      const notes = await getLeadNotes("enq_001");
      expect(notes).toHaveLength(2);
      expect(notes[0].isPinned).toBe(true);
      expect(prisma.leadNote.findMany).toHaveBeenCalledWith({
        where: { enquiryId: "enq_001" },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      });
    });

    it("toggles the pinned status of a lead note", async () => {
      vi.spyOn(prisma.leadNote, "update").mockResolvedValueOnce({
        id: "note_123",
        isPinned: true,
      } as any);

      const updated = await togglePinLeadNote("note_123", true);
      expect(updated.isPinned).toBe(true);
      expect(prisma.leadNote.update).toHaveBeenCalledWith({
        where: { id: "note_123" },
        data: { isPinned: true },
      });
    });

    it("deletes a lead note by id", async () => {
      vi.spyOn(prisma.leadNote, "delete").mockResolvedValueOnce({
        id: "note_123",
      } as any);

      await deleteLeadNote("note_123");
      expect(prisma.leadNote.delete).toHaveBeenCalledWith({
        where: { id: "note_123" },
      });
    });
  });

  // ============================================================================
  // 2. LEAD FOLLOW-UPS REPOSITORY
  // ============================================================================
  describe("LeadFollowUpsRepo", () => {
    it("creates a follow-up and automatically updates enquiry.nextFollowUpAt", async () => {
      const dueAt = new Date("2026-11-15T10:00:00Z");
      const mockFollowUp = {
        id: "fu_1",
        enquiryId: "enq_001",
        assignedToId: "admin_1",
        title: "Proposal Review Call",
        description: "Review enterprise cloud architecture plan.",
        priority: "HIGH",
        dueAt,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.leadFollowUp, "create").mockResolvedValueOnce(mockFollowUp as any);
      vi.spyOn(prisma.enquiry, "update").mockResolvedValueOnce({} as any);

      const result = await createLeadFollowUp({
        enquiryId: "enq_001",
        assignedToId: "admin_1",
        title: "Proposal Review Call",
        description: "Review enterprise cloud architecture plan.",
        priority: "HIGH",
        dueAt,
      });

      expect(result.id).toBe("fu_1");
      expect(result.priority).toBe("HIGH");
      expect(prisma.enquiry.update).toHaveBeenCalledWith({
        where: { id: "enq_001" },
        data: { nextFollowUpAt: dueAt },
      });
    });

    it("queries overdue follow-ups (dueAt < now and isCompleted = false)", async () => {
      const mockOverdue = [
        {
          id: "fu_overdue_1",
          enquiryId: "enq_001",
          dueAt: new Date("2026-11-01T00:00:00Z"),
          isCompleted: false,
          title: "Follow up call",
        },
      ];

      vi.spyOn(prisma.leadFollowUp, "findMany").mockResolvedValueOnce(mockOverdue as any);

      const overdue = await getOverdueFollowUps();
      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe("fu_overdue_1");

      const callArgs = vi.mocked(prisma.leadFollowUp.findMany).mock.calls[0][0];
      expect(callArgs?.where?.isCompleted).toBe(false);
      expect(callArgs?.where?.dueAt).toBeDefined();
    });

    it("toggles follow-up complete state and sets completedAt timestamp", async () => {
      vi.spyOn(prisma.leadFollowUp, "update").mockResolvedValueOnce({
        id: "fu_1",
        isCompleted: true,
        completedAt: new Date(),
      } as any);

      const updated = await toggleFollowUpComplete("fu_1", true);
      expect(updated.isCompleted).toBe(true);
      expect(prisma.leadFollowUp.update).toHaveBeenCalledWith({
        where: { id: "fu_1" },
        data: {
          isCompleted: true,
          completedAt: expect.any(Date),
          completedById: null,
        },
      });
    });

    it("deletes a follow-up record", async () => {
      vi.spyOn(prisma.leadFollowUp, "delete").mockResolvedValueOnce({
        id: "fu_1",
      } as any);

      await deleteLeadFollowUp("fu_1");
      expect(prisma.leadFollowUp.delete).toHaveBeenCalledWith({
        where: { id: "fu_1" },
      });
    });
  });

  // ============================================================================
  // 3. LEAD ACTIVITIES REPOSITORY
  // ============================================================================
  describe("LeadActivitiesRepo", () => {
    it("creates an immutable activity log entry with metadata", async () => {
      const mockActivity = {
        id: "act_1",
        enquiryId: "enq_001",
        actorId: "admin_1",
        actorName: "Lead Manager",
        type: "STATUS_CHANGE",
        description: "Status changed from QUALIFIED to PROPOSAL_SENT",
        metadata: { from: "QUALIFIED", to: "PROPOSAL_SENT" },
        createdAt: new Date(),
      };

      vi.spyOn(prisma.leadActivity, "create").mockResolvedValueOnce(mockActivity as any);

      const activity = await createLeadActivity({
        enquiryId: "enq_001",
        actorId: "admin_1",
        actorName: "Lead Manager",
        type: "STATUS_CHANGE",
        description: "Status changed from QUALIFIED to PROPOSAL_SENT",
        metadata: { from: "QUALIFIED", to: "PROPOSAL_SENT" },
      });

      expect(activity.type).toBe("STATUS_CHANGE");
      expect(activity.actorName).toBe("Lead Manager");
      expect(activity.description).toContain("PROPOSAL_SENT");
    });

    it("retrieves lead activities with pagination default limit", async () => {
      const mockList = [
        { id: "act_2", type: "PROPOSAL_SENT", createdAt: new Date("2026-11-12T12:00:00Z") },
        { id: "act_1", type: "QUALIFIED", createdAt: new Date("2026-11-10T12:00:00Z") },
      ];

      vi.spyOn(prisma.leadActivity, "findMany").mockResolvedValueOnce(mockList as any);

      const activities = await getLeadActivities("enq_001");
      expect(activities).toHaveLength(2);
      expect(prisma.leadActivity.findMany).toHaveBeenCalledWith({
        where: { enquiryId: "enq_001" },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    });
  });

  // ============================================================================
  // 4. LEAD ASSIGNMENTS REPOSITORY
  // ============================================================================
  describe("LeadAssignmentsRepo", () => {
    it("assigns lead to active admin atomically deactivating previous assignment", async () => {
      const mockTx = {
        adminUser: {
          findUnique: vi.fn().mockResolvedValue({
            id: "admin_2",
            name: "Shivanshu",
            email: "shivanshu@voidtechsolution.com",
            isActive: true,
            role: "ADMIN",
          }),
        },
        leadAssignment: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          create: vi.fn().mockResolvedValue({
            id: "asgn_2",
            enquiryId: "enq_001",
            adminId: "admin_2",
            assignedById: "super_1",
            assignedByName: "Super Admin",
            isActive: true,
          }),
        },
        enquiry: {
          update: vi.fn().mockResolvedValue({}),
        },
      };

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(async (cb: any) => {
        return cb(mockTx);
      });

      const assignment = await assignLeadToAdmin({
        enquiryId: "enq_001",
        adminId: "admin_2",
        assignedById: "super_1",
        assignedByName: "Super Admin",
        notes: "Reassigning enterprise account.",
      });

      expect(assignment.id).toBe("asgn_2");
      expect(assignment.isActive).toBe(true);
      expect(mockTx.leadAssignment.updateMany).toHaveBeenCalledWith({
        where: { enquiryId: "enq_001", isActive: true },
        data: { isActive: false, unassignedAt: expect.any(Date) },
      });
      expect(mockTx.enquiry.update).toHaveBeenCalledWith({
        where: { id: "enq_001" },
        data: { assignedAdminId: "admin_2" },
      });
    });

    it("rejects assignment to an inactive administrator", async () => {
      const mockTx = {
        adminUser: {
          findUnique: vi.fn().mockResolvedValue({
            id: "admin_inactive",
            name: "Deactivated Admin",
            isActive: false,
            role: "ADMIN",
          }),
        },
      };

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(async (cb: any) => {
        return cb(mockTx);
      });

      await expect(
        assignLeadToAdmin({
          enquiryId: "enq_001",
          adminId: "admin_inactive",
        })
      ).rejects.toThrow(/Cannot assign lead to deactivated administrator/);
    });

    it("unassigns lead and clears enquiry.assignedAdminId", async () => {
      const mockTx = {
        leadAssignment: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        enquiry: {
          update: vi.fn().mockResolvedValue({}),
        },
      };

      vi.spyOn(prisma, "$transaction").mockImplementationOnce(async (cb: any) => {
        return cb(mockTx);
      });

      await unassignLead("enq_001");
      expect(mockTx.leadAssignment.updateMany).toHaveBeenCalledWith({
        where: { enquiryId: "enq_001", isActive: true },
        data: { isActive: false, unassignedAt: expect.any(Date) },
      });
      expect(mockTx.enquiry.update).toHaveBeenCalledWith({
        where: { id: "enq_001" },
        data: { assignedAdminId: null },
      });
    });

    it("retrieves the active assignment with admin relations", async () => {
      const mockAssignment = {
        id: "asgn_1",
        enquiryId: "enq_001",
        adminId: "admin_1",
        isActive: true,
        admin: {
          id: "admin_1",
          name: "Assigned Dev",
          email: "dev@voidtechsolution.com",
          role: "ADMIN",
        },
      };

      vi.spyOn(prisma.leadAssignment, "findFirst").mockResolvedValueOnce(mockAssignment as any);

      const active = await getActiveAssignment("enq_001");
      expect(active?.id).toBe("asgn_1");
      expect(active?.admin?.name).toBe("Assigned Dev");
      expect(prisma.leadAssignment.findFirst).toHaveBeenCalledWith({
        where: { enquiryId: "enq_001", isActive: true },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });
  });

  // ============================================================================
  // 5. NOTIFICATIONS REPOSITORY & RECIPIENT ISOLATION
  // ============================================================================
  describe("NotificationsRepo & Recipient Isolation", () => {
    it("creates a notification strictly for the target recipientId", async () => {
      const mockNotif = {
        id: "notif_1",
        recipientId: "admin_target",
        title: "New Lead Assigned",
        message: "You have been assigned enquiry ENQ-100.",
        type: "LEAD_ASSIGNED",
        enquiryId: "enq_100",
        isRead: false,
        createdAt: new Date(),
      };

      vi.spyOn(prisma.adminNotification, "create").mockResolvedValueOnce(mockNotif as any);

      const result = await createAdminNotification({
        recipientId: "admin_target",
        title: "New Lead Assigned",
        message: "You have been assigned enquiry ENQ-100.",
        type: "LEAD_ASSIGNED",
        enquiryId: "enq_100",
      });

      expect(result.id).toBe("notif_1");
      expect(result.recipientId).toBe("admin_target");
      expect(prisma.adminNotification.create).toHaveBeenCalledWith({
        data: {
          recipientId: "admin_target",
          title: "New Lead Assigned",
          message: "You have been assigned enquiry ENQ-100.",
          type: "LEAD_ASSIGNED",
          enquiryId: "enq_100",
          isRead: false,
        },
      });
    });

    it("strictly isolates queries by recipientId preventing cross-admin data leakage", async () => {
      vi.spyOn(prisma.adminNotification, "findMany").mockResolvedValueOnce([]);

      await getAdminNotifications("admin_isolated", false, 50);

      expect(prisma.adminNotification.findMany).toHaveBeenCalledWith({
        where: { recipientId: "admin_isolated" },
        take: 50,
        orderBy: { createdAt: "desc" },
      });
    });

    it("counts unread notifications strictly for the requesting recipient", async () => {
      vi.spyOn(prisma.adminNotification, "count").mockResolvedValueOnce(3);

      const count = await getUnreadNotificationCount("admin_test");
      expect(count).toBe(3);
      expect(prisma.adminNotification.count).toHaveBeenCalledWith({
        where: { recipientId: "admin_test", isRead: false },
      });
    });

    it("verifies recipient ownership when marking a notification as read", async () => {
      vi.spyOn(prisma.adminNotification, "findUnique").mockResolvedValueOnce({
        id: "notif_1",
        recipientId: "admin_owner",
      } as any);

      vi.spyOn(prisma.adminNotification, "update").mockResolvedValueOnce({
        id: "notif_1",
        recipientId: "admin_owner",
        isRead: true,
        readAt: new Date(),
      } as any);

      const updated = await markNotificationAsRead("notif_1", "admin_owner");
      expect(updated.isRead).toBe(true);
      expect(prisma.adminNotification.update).toHaveBeenCalledWith({
        where: { id: "notif_1" },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it("rejects marking notification as read when recipientId does not match", async () => {
      vi.spyOn(prisma.adminNotification, "findUnique").mockResolvedValueOnce({
        id: "notif_1",
        recipientId: "other_admin",
      } as any);

      await expect(
        markNotificationAsRead("notif_1", "intruder_admin")
      ).rejects.toThrow(/Access denied/);
    });

    it("bulk marks all notifications as read for a specific recipient", async () => {
      vi.spyOn(prisma.adminNotification, "updateMany").mockResolvedValueOnce({ count: 5 });

      const count = await markAllNotificationsAsRead("admin_owner");
      expect(count).toBe(5);
      expect(prisma.adminNotification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: "admin_owner", isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });

  // ============================================================================
  // 6. ENQUIRIES REPOSITORY CRM EXTENSIONS & OCC
  // ============================================================================
  describe("EnquiriesRepo CRM Extensions", () => {
    it("hydrates relations and ensures passwordHash is NEVER exposed in assignedAdmin projection", async () => {
      const mockEnquiryWithRelations = {
        id: "enq_rel_1",
        name: "Enterprise Client",
        email: "client@corp.com",
        status: "QUALIFIED" as EnquiryStatus,
        assignedAdmin: {
          id: "admin_1",
          name: "Lead Lead",
          email: "lead@voidtechsolution.com",
          role: "ADMIN",
          isActive: true,
        },
        notes: [
          { id: "note_1", content: "Initial brief approved." },
        ],
        followUps: [
          { id: "fu_1", title: "Follow up call", dueAt: new Date() },
        ],
        activities: [
          { id: "act_1", type: "STATUS_CHANGE" },
        ],
        assignments: [
          { id: "asgn_1", isActive: true },
        ],
      };

      vi.spyOn(prisma.enquiry, "findUnique").mockResolvedValueOnce(mockEnquiryWithRelations as any);

      const result = await getEnquiryById("enq_rel_1", true);
      expect(result).toBeDefined();
      expect(result?.notes).toHaveLength(1);
      expect(result?.followUps).toHaveLength(1);
      expect(result?.assignedAdmin).toBeDefined();
      expect(result?.assignedAdmin?.name).toBe("Lead Lead");
      // Security Invariant: passwordHash must not be in the selection
      expect((result?.assignedAdmin as any)?.passwordHash).toBeUndefined();

      const callArgs = vi.mocked(prisma.enquiry.findUnique).mock.calls[0][0];
      const adminSelect = callArgs?.include?.assignedAdmin?.select;
      expect(adminSelect).toBeDefined();
      expect(adminSelect.passwordHash).toBeUndefined();
      expect(adminSelect.id).toBe(true);
      expect(adminSelect.email).toBe(true);
    });

    it("enforces Optimistic Concurrency Control (OCC) throwing error when expectedUpdatedAt mismatches", async () => {
      const serverDate = new Date("2026-11-13T01:00:00Z");
      const clientStaleDate = new Date("2026-11-13T00:30:00Z");

      vi.spyOn(prisma.enquiry, "findUnique").mockResolvedValueOnce({
        id: "enq_occ",
        status: "NEW",
        email: "lead@test.com",
        updatedAt: serverDate,
      } as any);

      await expect(
        updateEnquiryStatus("enq_occ", "QUALIFIED", {
          expectedUpdatedAt: clientStaleDate,
        })
      ).rejects.toThrow(/Concurrency conflict/);
    });

    it("succeeds OCC check when expectedUpdatedAt matches server state", async () => {
      const matchingDate = new Date("2026-11-13T01:00:00Z");

      vi.spyOn(prisma.enquiry, "findUnique").mockResolvedValueOnce({
        id: "enq_occ_match",
        status: "NEW",
        email: "lead@test.com",
        updatedAt: matchingDate,
      } as any);

      vi.spyOn(prisma.enquiry, "update").mockResolvedValueOnce({
        id: "enq_occ_match",
        status: "QUALIFIED",
        email: "lead@test.com",
        updatedAt: new Date("2026-11-13T01:05:00Z"),
      } as any);

      const updated = await updateEnquiryStatus("enq_occ_match", "QUALIFIED", {
        expectedUpdatedAt: matchingDate,
      });

      expect(updated.status).toBe("QUALIFIED");
      expect(prisma.enquiry.update).toHaveBeenCalledWith({
        where: { id: "enq_occ_match" },
        data: {
          status: "QUALIFIED",
        },
      });
    });

    it("computes metrics across all 8 CRM stages", async () => {
      vi.spyOn(prisma.enquiry, "groupBy").mockResolvedValueOnce([
        { status: "NEW", _count: { status: 10 } },
        { status: "CONTACTED", _count: { status: 8 } },
        { status: "QUALIFIED", _count: { status: 5 } },
        { status: "PROPOSAL_SENT", _count: { status: 4 } },
        { status: "NEGOTIATION", _count: { status: 3 } },
        { status: "WON", _count: { status: 6 } },
        { status: "LOST", _count: { status: 2 } },
        { status: "ON_HOLD", _count: { status: 1 } },
      ] as any);

      const stats = await getEnquiryStats();
      expect(stats.NEW).toBe(10);
      expect(stats.CONTACTED).toBe(8);
      expect(stats.QUALIFIED).toBe(5);
      expect(stats.PROPOSAL_SENT).toBe(4);
      expect(stats.NEGOTIATION).toBe(3);
      expect(stats.WON).toBe(6);
      expect(stats.LOST).toBe(2);
      expect(stats.ON_HOLD).toBe(1);
    });

    it("filters enquiries by assignedAdminId and hasOverdueFollowUp", async () => {
      vi.spyOn(prisma.enquiry, "findMany").mockResolvedValueOnce([]);
      vi.spyOn(prisma.enquiry, "count").mockResolvedValueOnce(0);

      await getEnquiries({
        assignedAdminId: "admin_filter_1",
        hasOverdueFollowUp: true,
      });

      const findCall = vi.mocked(prisma.enquiry.findMany).mock.calls[0][0];
      expect(findCall?.where?.assignedAdminId).toBe("admin_filter_1");
      expect(findCall?.where?.followUps).toBeDefined();
    });
  });
});
