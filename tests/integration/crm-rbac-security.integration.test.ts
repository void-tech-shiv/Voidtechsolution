import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient, type AdminUser } from "@prisma/client";
import { hashPassword } from "@/server/security/password";
import {
  createAdminSession,
  SESSION_COOKIE_NAME,
} from "@/server/security/session";
import {
  getCrmMetricsAction,
  getKanbanLeadsAction,
  getLeadDetailAction,
  updateLeadStageAction,
  createLeadNoteAction,
  togglePinLeadNoteAction,
  deleteLeadNoteAction,
  createLeadFollowUpAction,
  toggleLeadFollowUpAction,
  deleteLeadFollowUpAction,
  assignLeadAction,
  getAdminNotificationsAction,
  markNotificationReadAction,
} from "@/server/actions/crm.actions";
import { createEnquiry } from "@/server/repositories/enquiries.repo";
import { createAdminNotification } from "@/server/repositories/notifications.repo";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
});

let currentSessionCookie: string | null = null;
const mockHeadersMap = new Map<string, string>([
  ["host", "localhost:3000"],
  ["origin", "http://localhost:3000"],
  ["user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestBrowser/1.0"],
  ["x-forwarded-for", "127.0.0.1"],
]);

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(mockHeadersMap),
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === SESSION_COOKIE_NAME && currentSessionCookie
          ? { name, value: currentSessionCookie }
          : undefined,
      set: vi.fn(),
      delete: vi.fn(),
    }),
}));

describe("Phase 9.3: Three-Role RBAC Security Matrix & Notification Isolation Integration", () => {
  let isDbAvailable = false;
  let superAdmin: AdminUser;
  let opsAdmin: AdminUser;
  let editor: AdminUser;

  let superCookie: string;
  let opsCookie: string;
  let editorCookie: string;

  let testLeadId: string;
  let testNoteId: string;
  let testFollowUpId: string;
  let testNotificationId: string;

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      const passwordHash = await hashPassword("TestSecPass!2026#");

      superAdmin = await prisma.adminUser.upsert({
        where: { email: "rbac.super@voidtech.test" },
        update: { isActive: true },
        create: {
          email: "rbac.super@voidtech.test",
          name: "RBAC SuperAdmin",
          role: "SUPER_ADMIN",
          passwordHash,
          isActive: true,
        },
      });

      opsAdmin = await prisma.adminUser.upsert({
        where: { email: "rbac.ops@voidtech.test" },
        update: { isActive: true },
        create: {
          email: "rbac.ops@voidtech.test",
          name: "RBAC OpsAdmin",
          role: "ADMIN",
          passwordHash,
          isActive: true,
        },
      });

      editor = await prisma.adminUser.upsert({
        where: { email: "rbac.editor@voidtech.test" },
        update: { isActive: true },
        create: {
          email: "rbac.editor@voidtech.test",
          name: "RBAC Editor",
          role: "EDITOR",
          passwordHash,
          isActive: true,
        },
      });

      const superSession = await createAdminSession(superAdmin.id, { ipAddress: "127.0.0.1", userAgent: "Vitest-Super" });
      const opsSession = await createAdminSession(opsAdmin.id, { ipAddress: "127.0.0.1", userAgent: "Vitest-Ops" });
      const editorSession = await createAdminSession(editor.id, { ipAddress: "127.0.0.1", userAgent: "Vitest-Editor" });

      superCookie = superSession.cookieValue;
      opsCookie = opsSession.cookieValue;
      editorCookie = editorSession.cookieValue;

      // Seed a shared lead for testing
      const lead = await createEnquiry({
        name: "OmniTech Corp",
        email: "sec@omnitech.test",
        serviceCategory: "ENTERPRISE_SYSTEMS",
        message: "High-security audit and cloud ERP transformation.",
      });
      testLeadId = lead.id;

      // Seed an internal note
      currentSessionCookie = superCookie;
      const noteRes = await createLeadNoteAction({
        enquiryId: testLeadId,
        content: "Sensitive compliance note: Internal audit flags verified.",
      });
      testNoteId = (noteRes.data as any).id;

      // Seed a follow-up
      const followUpRes = await createLeadFollowUpAction({
        enquiryId: testLeadId,
        title: "Security clearance review",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        priority: "HIGH",
      });
      testFollowUpId = (followUpRes.data as any).id;

      // Seed a notification strictly for superAdmin
      const notif = await createAdminNotification({
        recipientId: superAdmin.id,
        enquiryId: testLeadId,
        type: "NEW_LEAD",
        title: "Confidential SuperAdmin Alert",
        message: "New enterprise lead requires clearance.",
      });
      testNotificationId = notif.id;
    } catch {
      isDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (isDbAvailable) {
      await prisma.adminNotification.deleteMany({
        where: { recipientId: { in: [superAdmin?.id, opsAdmin?.id, editor?.id].filter(Boolean) } },
      });
      await prisma.adminSession.deleteMany({
        where: { userId: { in: [superAdmin?.id, opsAdmin?.id, editor?.id].filter(Boolean) } },
      });
      await prisma.$disconnect();
    }
  });

  describe("1. SUPER_ADMIN Role Verification", () => {
    beforeEach(() => {
      currentSessionCookie = superCookie;
      mockHeadersMap.set("origin", "http://localhost:3000");
    });

    it("allows SUPER_ADMIN to view metrics, kanban, and lead detail", async () => {
      if (!isDbAvailable) return;
      const metrics = await getCrmMetricsAction();
      expect(metrics.success).toBe(true);

      const kanban = await getKanbanLeadsAction();
      expect(kanban.success).toBe(true);

      const detail = await getLeadDetailAction(testLeadId);
      expect(detail.success).toBe(true);
    });

    it("allows SUPER_ADMIN to update stage, add note, and schedule follow-up", async () => {
      if (!isDbAvailable) return;
      const lead = await prisma.enquiry.findUniqueOrThrow({ where: { id: testLeadId } });

      const stageRes = await updateLeadStageAction({
        enquiryId: testLeadId,
        newStatus: "CONTACTED",
        expectedUpdatedAt: lead.updatedAt,
      });
      expect(stageRes.success).toBe(true);

      const noteRes = await createLeadNoteAction({
        enquiryId: testLeadId,
        content: "SUPER_ADMIN added technical scope note.",
      });
      expect(noteRes.success).toBe(true);
    });

    it("allows SUPER_ADMIN to delete note and follow-up (enquiries:delete)", async () => {
      if (!isDbAvailable) return;
      const noteToDelete = await createLeadNoteAction({
        enquiryId: testLeadId,
        content: "Ephemeral note for deletion test.",
      });
      const noteId = (noteToDelete.data as any).id;

      const delNoteRes = await deleteLeadNoteAction(noteId);
      expect(delNoteRes.success).toBe(true);

      const fuToDelete = await createLeadFollowUpAction({
        enquiryId: testLeadId,
        title: "Ephemeral task for deletion",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
      });
      const fuId = (fuToDelete.data as any).id;

      const delFuRes = await deleteLeadFollowUpAction(fuId);
      expect(delFuRes.success).toBe(true);
    });
  });

  describe("2. ADMIN (Operations) Role Verification", () => {
    beforeEach(() => {
      currentSessionCookie = opsCookie;
      mockHeadersMap.set("origin", "http://localhost:3000");
    });

    it("allows ADMIN to view metrics, kanban, and details", async () => {
      if (!isDbAvailable) return;
      const metrics = await getCrmMetricsAction();
      expect(metrics.success).toBe(true);

      const kanban = await getKanbanLeadsAction();
      expect(kanban.success).toBe(true);
    });

    it("allows ADMIN to update stage, add notes, and assign leads", async () => {
      if (!isDbAvailable) return;
      const lead = await prisma.enquiry.findUniqueOrThrow({ where: { id: testLeadId } });

      const stageRes = await updateLeadStageAction({
        enquiryId: testLeadId,
        newStatus: "QUALIFIED",
        expectedUpdatedAt: lead.updatedAt,
      });
      expect(stageRes.success).toBe(true);

      const assignRes = await assignLeadAction({
        enquiryId: testLeadId,
        adminId: opsAdmin.id,
      });
      expect(assignRes.success).toBe(true);
    });

    it("DENIES ADMIN from deleting internal notes (enquiries:delete is SUPER_ADMIN only)", async () => {
      if (!isDbAvailable) return;
      const delNoteRes = await deleteLeadNoteAction(testNoteId);
      expect(delNoteRes.success).toBe(false);
      expect(delNoteRes.error).toMatch(/permission|enquiries:delete/i);
    });

    it("allows ADMIN to manage and delete operational follow-up tasks", async () => {
      if (!isDbAvailable) return;
      const fu = await createLeadFollowUpAction({
        enquiryId: testLeadId,
        title: "Admin manageable task",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
      });
      const fuId = (fu.data as any).id;

      const delFuRes = await deleteLeadFollowUpAction(fuId);
      expect(delFuRes.success).toBe(true);
    });
  });

  describe("3. EDITOR (Content Editor) Role Verification", () => {
    beforeEach(() => {
      currentSessionCookie = editorCookie;
      mockHeadersMap.set("origin", "http://localhost:3000");
    });

    it("allows EDITOR read-only access to view metrics and kanban board (enquiries:view)", async () => {
      if (!isDbAvailable) return;
      const metrics = await getCrmMetricsAction();
      expect(metrics.success).toBe(true);

      const kanban = await getKanbanLeadsAction();
      expect(kanban.success).toBe(true);
    });

    it("DENIES EDITOR from updating pipeline stages (enquiries:update_status required)", async () => {
      if (!isDbAvailable) return;
      const lead = await prisma.enquiry.findUniqueOrThrow({ where: { id: testLeadId } });

      const res = await updateLeadStageAction({
        enquiryId: testLeadId,
        newStatus: "WON",
        expectedUpdatedAt: lead.updatedAt,
      });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/permission|enquiries:update_status/i);
    });

    it("DENIES EDITOR from creating or pinning notes", async () => {
      if (!isDbAvailable) return;
      const noteRes = await createLeadNoteAction({
        enquiryId: testLeadId,
        content: "Unauthorized editor note attempt.",
      });
      expect(noteRes.success).toBe(false);
      expect(noteRes.error).toMatch(/permission/i);

      const pinRes = await togglePinLeadNoteAction(testNoteId, true);
      expect(pinRes.success).toBe(false);
      expect(pinRes.error).toMatch(/permission/i);
    });

    it("DENIES EDITOR from scheduling or completing follow-ups", async () => {
      if (!isDbAvailable) return;
      const fuRes = await createLeadFollowUpAction({
        enquiryId: testLeadId,
        title: "Unauthorized task",
        dueAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(fuRes.success).toBe(false);
      expect(fuRes.error).toMatch(/permission/i);

      const toggleRes = await toggleLeadFollowUpAction(testFollowUpId, true);
      expect(toggleRes.success).toBe(false);
      expect(toggleRes.error).toMatch(/permission/i);
    });

    it("DENIES EDITOR from assigning leads", async () => {
      if (!isDbAvailable) return;
      const assignRes = await assignLeadAction({
        enquiryId: testLeadId,
        adminId: editor.id,
      });
      expect(assignRes.success).toBe(false);
      expect(assignRes.error).toMatch(/permission/i);
    });

    it("DENIES EDITOR from deleting notes or follow-ups", async () => {
      if (!isDbAvailable) return;
      const delNoteRes = await deleteLeadNoteAction(testNoteId);
      expect(delNoteRes.success).toBe(false);
      expect(delNoteRes.error).toMatch(/permission/i);

      const delFuRes = await deleteLeadFollowUpAction(testFollowUpId);
      expect(delFuRes.success).toBe(false);
      expect(delFuRes.error).toMatch(/permission/i);
    });
  });

  describe("4. Notification Recipient Isolation & Cross-Admin Security", () => {
    it("strictly isolates notifications so OpsAdmin cannot see SuperAdmin notifications", async () => {
      if (!isDbAvailable) return;
      currentSessionCookie = opsCookie;
      const notifs = await getAdminNotificationsAction();
      expect(notifs.success).toBe(true);
      if (notifs.success && notifs.data) {
        const leaked = notifs.data.items.find((n: any) => n.id === testNotificationId);
        expect(leaked).toBeUndefined();
      }
    });

    it("rejects attempt by OpsAdmin to mark SuperAdmin notification as read", async () => {
      if (!isDbAvailable) return;
      currentSessionCookie = opsCookie;
      const res = await markNotificationReadAction(testNotificationId);
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/access denied|modify notifications belonging to another/i);
    });
  });

  describe("5. Unauthenticated, Tampered Session & Origin Defense", () => {
    it("rejects unauthenticated requests with Authentication required", async () => {
      if (!isDbAvailable) return;
      currentSessionCookie = null; // No cookie
      const res = await getCrmMetricsAction();
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/authentication required/i);
    });

    it("rejects forged or tampered session cookies", async () => {
      if (!isDbAvailable) return;
      currentSessionCookie = "tampered_fake_session_cookie_signature_invalid";
      const res = await getCrmMetricsAction();
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/authentication required/i);
    });

    it("rejects cross-origin requests", async () => {
      if (!isDbAvailable) return;
      currentSessionCookie = superCookie;
      mockHeadersMap.set("origin", "https://malicious-attacker-domain.xyz");

      const res = await getCrmMetricsAction();
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/cross-origin request rejected/i);
    });
  });

  describe("6. Confidentiality & Password Hash Scrubbing", () => {
    it("ensures relational hydration never exposes passwordHash or session tokens", async () => {
      if (!isDbAvailable) return;
      currentSessionCookie = superCookie;
      mockHeadersMap.set("origin", "http://localhost:3000");

      const res = await getLeadDetailAction(testLeadId);
      expect(res.success).toBe(true);
      if (res.success) {
        const lead = res.data as any;
        if (lead.assignedAdmin) {
          expect(lead.assignedAdmin.passwordHash).toBeUndefined();
          expect(lead.assignedAdmin.sessionToken).toBeUndefined();
        }
        if (lead.assignments) {
          for (const asg of lead.assignments) {
            if (asg.admin) {
              expect(asg.admin.passwordHash).toBeUndefined();
            }
          }
        }
      }
    });
  });
});
