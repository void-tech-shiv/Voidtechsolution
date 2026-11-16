import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient, type AdminUser, type EnquiryStatus } from "@prisma/client";
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
  createLeadFollowUpAction,
  toggleLeadFollowUpAction,
  assignLeadAction,
  getAdminNotificationsAction,
} from "@/server/actions/crm.actions";
import { createEnquiry } from "@/server/repositories/enquiries.repo";

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

describe("Phase 9.3: Real PostgreSQL Lead Lifecycle & Commercial Outcomes Integration", () => {
  let isDbAvailable = false;
  let superAdmin: AdminUser;
  let opsAdmin: AdminUser;
  let superCookie: string;
  let opsCookie: string;

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      // Ensure test administrators exist in test database
      const superHash = await hashPassword("SuperPass123!@#");
      const opsHash = await hashPassword("OpsPass123!@#");

      superAdmin = await prisma.adminUser.upsert({
        where: { email: "lifecycle.super@voidtech.test" },
        update: { isActive: true },
        create: {
          email: "lifecycle.super@voidtech.test",
          name: "Lifecycle SuperAdmin",
          role: "SUPER_ADMIN",
          passwordHash: superHash,
          isActive: true,
        },
      });

      opsAdmin = await prisma.adminUser.upsert({
        where: { email: "lifecycle.ops@voidtech.test" },
        update: { isActive: true },
        create: {
          email: "lifecycle.ops@voidtech.test",
          name: "Lifecycle OpsAdmin",
          role: "ADMIN",
          passwordHash: opsHash,
          isActive: true,
        },
      });

      // Create valid sessions
      const superSession = await createAdminSession(superAdmin.id, {
        ipAddress: "127.0.0.1",
        userAgent: "Vitest-Super",
      });
      const opsSession = await createAdminSession(opsAdmin.id, {
        ipAddress: "127.0.0.1",
        userAgent: "Vitest-Ops",
      });

      superCookie = superSession.cookieValue;
      opsCookie = opsSession.cookieValue;
    } catch {
      isDbAvailable = false;
      console.warn("Local PostgreSQL test database not reachable. Skipping test suite.");
    }
  });

  afterAll(async () => {
    if (isDbAvailable) {
      // Cleanup synthetic test records
      await prisma.adminNotification.deleteMany({
        where: { recipientId: { in: [superAdmin?.id, opsAdmin?.id].filter(Boolean) } },
      });
      await prisma.adminSession.deleteMany({
        where: { userId: { in: [superAdmin?.id, opsAdmin?.id].filter(Boolean) } },
      });
      await prisma.$disconnect();
    }
  });

  beforeEach(() => {
    currentSessionCookie = superCookie;
  });

  it("1. Public Enquiry Submission & CRM Inbound Intake in NEW Stage", async () => {
    if (!isDbAvailable) return;

    // Simulate enquiry intake
    const enquiry = await createEnquiry({
      name: "Acme Cybernetics",
      email: "contact@acmecyber.test",
      phone: "+91 98765 43210",
      companyName: "Acme Industries",
      serviceCategory: "ENTERPRISE_SYSTEMS",
      budgetRange: "₹2,50,000 - ₹5,00,000",
      message: "Need full-stack enterprise automation system with real-time analytics.",
    });

    expect(enquiry.id).toBeDefined();
    expect(enquiry.status).toBe("NEW");
    expect(enquiry.assignedAdminId).toBeNull();
    expect(enquiry.source).toBe("WEBSITE_CONTACT_FORM");

    // Verify metrics reflect new lead
    const metricsRes = await getCrmMetricsAction();
    expect(metricsRes.success).toBe(true);
    if (metricsRes.success && metricsRes.data) {
      expect(metricsRes.data.newLeads).toBeGreaterThanOrEqual(1);
    }

    // Verify Kanban columns include the lead in NEW stage
    const kanbanRes = await getKanbanLeadsAction({ search: "Acme Cybernetics" });
    expect(kanbanRes.success).toBe(true);
    if (kanbanRes.success && kanbanRes.data) {
      const newCol = kanbanRes.data.find((c) => c.stage === "NEW");
      expect(newCol).toBeDefined();
      const card = newCol?.leads.find((l) => l.id === enquiry.id);
      expect(card).toBeDefined();
      expect(card?.name).toBe("Acme Cybernetics");
    }
  });

  it("2. Lead Assignment to Operations Admin & Notification Dispatch", async () => {
    if (!isDbAvailable) return;

    const lead = await createEnquiry({
      name: "Nexus Labs",
      email: "hello@nexuslabs.test",
      serviceCategory: "AI_AUTOMATION",
      message: "Autonomous agent system for supply chain optimization.",
    });

    // Assign lead to opsAdmin
    const assignRes = await assignLeadAction({
      enquiryId: lead.id,
      adminId: opsAdmin.id,
      notes: "Lead matches AI/automation focus; assigned to Operations team.",
    });

    expect(assignRes.success).toBe(true);

    // Verify assignment in database
    const updatedLead = await prisma.enquiry.findUnique({
      where: { id: lead.id },
      include: { assignments: true, assignedAdmin: true },
    });
    expect(updatedLead?.assignedAdminId).toBe(opsAdmin.id);
    expect(updatedLead?.assignedAdmin?.name).toBe("Lifecycle OpsAdmin");
    expect(updatedLead?.assignments.length).toBe(1);
    expect(updatedLead?.assignments[0]?.isActive).toBe(true);

    // Verify notification was dispatched to OpsAdmin
    currentSessionCookie = opsCookie;
    const notifs = await getAdminNotificationsAction();
    expect(notifs.success).toBe(true);
    if (notifs.success && notifs.data) {
      const assignmentNotif = notifs.data.items.find(
        (n: any) => n.enquiryId === lead.id && n.title === "New Lead Assigned"
      );
      expect(assignmentNotif).toBeDefined();
      expect(assignmentNotif?.isRead).toBe(false);
    }
  });

  it("3. Internal Notes Creation, Pinning, and Activity Logging", async () => {
    if (!isDbAvailable) return;

    const lead = await createEnquiry({
      name: "Solaris FinTech",
      email: "leads@solarisft.test",
      serviceCategory: "FINTECH_PAYMENTS",
      message: "UPI & escrow routing engine with sub-50ms latency.",
    });

    currentSessionCookie = superCookie;
    const noteRes = await createLeadNoteAction({
      enquiryId: lead.id,
      content: "Client confirmed Series A funding; budget confirmed at ₹4.5L minimum.",
      isPinned: false,
    });

    expect(noteRes.success).toBe(true);
    const noteId = (noteRes.data as any)?.id;
    expect(noteId).toBeDefined();

    // Toggle pin
    const pinRes = await togglePinLeadNoteAction(noteId, true);
    expect(pinRes.success).toBe(true);

    // Verify note is pinned in database
    const savedNote = await prisma.leadNote.findUnique({
      where: { id: noteId },
    });
    expect(savedNote?.isPinned).toBe(true);
    expect(savedNote?.authorName).toBe("Lifecycle SuperAdmin");

    // Verify activity was logged
    const activities = await prisma.leadActivity.findMany({
      where: { enquiryId: lead.id },
    });
    const noteActivity = activities.find((a) => a.type === "NOTE_ADDED");
    expect(noteActivity).toBeDefined();
  });

  it("4. Follow-Up Task Scheduling & nextFollowUpAt Cache Synchronization", async () => {
    if (!isDbAvailable) return;

    const lead = await createEnquiry({
      name: "HyperScale Cloud",
      email: "ops@hyperscale.test",
      serviceCategory: "CLOUD_HOSTING",
      message: "Multi-region Kubernetes deployment architecture.",
    });

    const dueDate = new Date(Date.now() + 86400000 * 2); // 2 days in future
    const taskRes = await createLeadFollowUpAction({
      enquiryId: lead.id,
      title: "Architecture Review & Demo Call",
      description: "Review staging cluster topology and SLAs.",
      dueAt: dueDate.toISOString(),
      priority: "HIGH",
    });

    expect(taskRes.success).toBe(true);
    const taskId = (taskRes.data as any)?.id;
    expect(taskId).toBeDefined();

    // Verify enquiry nextFollowUpAt was synchronized to match the task due date
    const updatedLead = await prisma.enquiry.findUnique({
      where: { id: lead.id },
    });
    expect(updatedLead?.nextFollowUpAt).toBeDefined();
    expect(new Date(updatedLead!.nextFollowUpAt!).getTime()).toBe(dueDate.getTime());

    // Complete the task
    const toggleRes = await toggleLeadFollowUpAction(taskId, true);
    expect(toggleRes.success).toBe(true);

    const completedTask = await prisma.leadFollowUp.findUnique({
      where: { id: taskId },
    });
    expect(completedTask?.isCompleted).toBe(true);
    expect(completedTask?.completedAt).toBeDefined();

    // Verify nextFollowUpAt is cleared because no other pending tasks exist
    const finalLead = await prisma.enquiry.findUnique({
      where: { id: lead.id },
    });
    expect(finalLead?.nextFollowUpAt).toBeNull();
  });

  it("5. Progressive Pipeline Lifecycle: NEW -> CONTACTED -> QUALIFIED -> PROPOSAL_SENT -> NEGOTIATION", async () => {
    if (!isDbAvailable) return;

    const lead = await createEnquiry({
      name: "Quantum Retailers",
      email: "director@quantumretail.test",
      serviceCategory: "WEB_DEVELOPMENT",
      message: "Headless omnichannel storefront with Next.js.",
    });

    currentSessionCookie = superCookie;
    const stages: EnquiryStatus[] = ["CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"];

    let currentUpdatedAt = lead.updatedAt;

    for (const targetStage of stages) {
      const res = await updateLeadStageAction({
        enquiryId: lead.id,
        newStatus: targetStage,
        expectedUpdatedAt: currentUpdatedAt,
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect((res.data as any).status).toBe(targetStage);
        currentUpdatedAt = new Date((res.data as any).updatedAt);
      }
    }

    // Verify all stage transitions generated immutable activities
    const activities = await prisma.leadActivity.findMany({
      where: { enquiryId: lead.id, type: "STATUS_CHANGE" },
      orderBy: { createdAt: "asc" },
    });
    expect(activities.length).toBe(4);
    expect((activities[0]?.metadata as any)?.to).toBe("CONTACTED");
    expect((activities[3]?.metadata as any)?.to).toBe("NEGOTIATION");
  });

  it("6. Scenario A: WON Commercial Outcome & Revenue Recognition", async () => {
    if (!isDbAvailable) return;

    const lead = await createEnquiry({
      name: "Zenith Global Logistics",
      email: "cio@zenithglobal.test",
      serviceCategory: "ENTERPRISE_SYSTEMS",
      message: "Global warehouse tracking and predictive dispatch software.",
    });

    const leadUpdated = await prisma.enquiry.update({
      where: { id: lead.id },
      data: { status: "NEGOTIATION", estimatedValueInr: 600000 },
    });

    const res = await updateLeadStageAction({
      enquiryId: lead.id,
      newStatus: "WON",
      expectedUpdatedAt: leadUpdated.updatedAt,
      estimatedValueInr: 600000,
    });

    expect(res.success).toBe(true);

    const dbLead = await prisma.enquiry.findUnique({
      where: { id: lead.id },
    });
    expect(dbLead?.status).toBe("WON");

    // Verify metrics calculate won revenue
    const metrics = await getCrmMetricsAction();
    expect(metrics.success).toBe(true);
    if (metrics.success && metrics.data) {
      expect(metrics.data.wonRevenueInr).toBeGreaterThanOrEqual(600000);
      expect(metrics.data.winRatePercentage).toBeGreaterThan(0);
    }
  });

  it("7. Scenario B: LOST Commercial Outcome with Mandatory lostReason Invariant", async () => {
    if (!isDbAvailable) return;

    const lead = await createEnquiry({
      name: "Starlight Hospitality",
      email: "booking@starlight.test",
      serviceCategory: "MOBILE_DEVELOPMENT",
      message: "Mobile guest booking and keyless entry mobile app.",
    });

    const leadUpdated = await prisma.enquiry.update({
      where: { id: lead.id },
      data: { status: "QUALIFIED", estimatedValueInr: 250000 },
    });

    // Attempt moving to LOST without lostReason -> Must be rejected
    const invalidRes = await updateLeadStageAction({
      enquiryId: lead.id,
      newStatus: "LOST",
      expectedUpdatedAt: leadUpdated.updatedAt,
      lostReason: "   ", // whitespace only
    });

    expect(invalidRes.success).toBe(false);
    expect(invalidRes.error).toMatch(/lostReason/i);

    // Provide valid lostReason -> Must succeed
    const validRes = await updateLeadStageAction({
      enquiryId: lead.id,
      newStatus: "LOST",
      expectedUpdatedAt: leadUpdated.updatedAt,
      lostReason: "Competitor pricing 30% lower; client went with local vendor.",
    });

    expect(validRes.success).toBe(true);

    const savedLead = await prisma.enquiry.findUnique({
      where: { id: lead.id },
    });
    expect(savedLead?.status).toBe("LOST");
    expect(savedLead?.lostReason).toContain("Competitor pricing 30% lower");
  });

  it("8. Scenario C: ON_HOLD Commercial Outcome", async () => {
    if (!isDbAvailable) return;

    const lead = await createEnquiry({
      name: "Delta Robotics",
      email: "ceo@deltarobotics.test",
      serviceCategory: "AI_AUTOMATION",
      message: "Warehouse AMR fleet controller software.",
    });

    const leadUpdated = await prisma.enquiry.update({
      where: { id: lead.id },
      data: { status: "CONTACTED", estimatedValueInr: 400000 },
    });

    const holdRes = await updateLeadStageAction({
      enquiryId: lead.id,
      newStatus: "ON_HOLD",
      expectedUpdatedAt: leadUpdated.updatedAt,
    });

    expect(holdRes.success).toBe(true);

    const dbLead = await prisma.enquiry.findUnique({
      where: { id: lead.id },
    });
    expect(dbLead?.status).toBe("ON_HOLD");
  });

  it("9. Complete Lead Details Drawer Relational Hydration", async () => {
    if (!isDbAvailable) return;

    const lead = await createEnquiry({
      name: "Apex Healthcare",
      email: "tech@apexhealth.test",
      companyName: "Apex Healthcare Pvt Ltd",
      serviceCategory: "ENTERPRISE_SYSTEMS",
      message: "Electronic health records and diagnostic patient portal.",
      referenceUrl: "https://voidtechsolution.codedev.co.in/services?utm_source=google-ads",
    });

    await prisma.enquiry.update({
      where: { id: lead.id },
      data: { estimatedValueInr: 750000 },
    });

    // Add note
    await createLeadNoteAction({
      enquiryId: lead.id,
      content: "HIPAA compliance audit required for architecture.",
      isPinned: true,
    });

    // Add follow-up
    await createLeadFollowUpAction({
      enquiryId: lead.id,
      title: "Send compliance documentation",
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      priority: "URGENT",
    });

    // Fetch full lead details
    const detailRes = await getLeadDetailAction(lead.id);
    expect(detailRes.success).toBe(true);
    if (detailRes.success) {
      const data = detailRes.data as any;
      expect(data.name).toBe("Apex Healthcare");
      expect(data.companyName).toBe("Apex Healthcare Pvt Ltd");
      expect(data.source).toBe("WEBSITE_CONTACT_FORM");
      expect(data.referenceUrl).toContain("utm_source=google-ads");
      expect(data.notes.length).toBe(1);
      expect(data.notes[0].isPinned).toBe(true);
      expect(data.followUps.length).toBe(1);
      expect(data.followUps[0].priority).toBe("URGENT");
      expect(data.activities.length).toBeGreaterThanOrEqual(2);
    }
  });
});
