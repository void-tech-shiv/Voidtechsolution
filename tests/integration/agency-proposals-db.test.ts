import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MILESTONES } from "@/server/agency/proposals";

// Never run destructive integration setup on production database connections.
const ciTestDb = process.env.CI === "true" &&
  /(?:localhost|127\.0\.0\.1):5432\//.test(process.env.DATABASE_URL || "");

describe.runIf(ciTestDb)("Agency DB constraints (isolated CI PostgreSQL only)", () => {
  let enquiryId = "";
  let proposalId = "";
  let projectId = "";

  beforeAll(async () => {
    const enquiry = await prisma.enquiry.create({
      data: {
        name: "CI test agency client",
        email: "agency-ci@example.test",
        message: "Database constraint integration test, no real customer.",
        serviceCategory: "WEB_DEVELOPMENT",
        consentGiven: true,
      },
    });
    enquiryId = enquiry.id;
  });

  afterAll(async () => {
    if (projectId) await prisma.agencyProject.deleteMany({ where: { id: projectId } });
    if (proposalId) await prisma.agencyProposal.deleteMany({ where: { id: proposalId } });
    if (enquiryId) await prisma.enquiry.deleteMany({ where: { id: enquiryId } });
  });

  it("stores a quoted proposal with persisted items and accurate INR totals", async () => {
    const proposal = await prisma.agencyProposal.create({
      data: {
        enquiryId,
        title: "CI test website",
        scope: "Test website, discovery and deployment.",
        terms: "Test-only terms, no billing.",
        subtotalInr: 4500,
        discountInr: 500,
        totalInr: 4000,
        items: { create: [{ description: "Website", quantity: 1, unitPriceInr: 4500, lineTotalInr: 4500, orderIndex: 0 }] },
      },
      include: { items: true },
    });
    proposalId = proposal.id;
    expect(proposal.status).toBe("DRAFT");
    expect(proposal.items).toHaveLength(1);
    expect(proposal.totalInr).toBe(4000);
  });

  it("creates project milestones and blocks a second project for the same proposal", async () => {
    await prisma.agencyProposal.update({ where: { id: proposalId }, data: { status: "ACCEPTED" } });
    const first = await prisma.agencyProject.create({
      data: {
        enquiryId,
        proposalId,
        title: "CI test delivery",
        milestones: { create: DEFAULT_MILESTONES.map((title, orderIndex) => ({ title, orderIndex })) },
      },
      include: { milestones: true },
    });
    projectId = first.id;
    expect(first.milestones).toHaveLength(5);
    expect(first.status).toBe("PLANNED");

    await expect(prisma.agencyProject.create({
      data: { enquiryId, proposalId, title: "Second duplicate client project" },
    })).rejects.toMatchObject({ code: "P2002" });
  });

  it("tracks milestone completion without affecting other milestones", async () => {
    const milestone = await prisma.agencyProjectMilestone.findFirstOrThrow({
      where: { projectId }, orderBy: { orderIndex: "asc" },
    });
    await prisma.agencyProjectMilestone.update({
      where: { id: milestone.id }, data: { isCompleted: true, completedAt: new Date() },
    });
    const remaining = await prisma.agencyProjectMilestone.count({
      where: { projectId, isCompleted: false },
    });
    expect(remaining).toBe(4);
  });
});
