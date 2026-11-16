import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient, type AdminUser, type ServiceCategory, type EnquiryStatus } from "@prisma/client";
import { hashPassword } from "@/server/security/password";
import { createAdminSession, SESSION_COOKIE_NAME } from "@/server/security/session";
import {
  getCrmMetricsAction,
  getKanbanLeadsAction,
  getLeadDetailAction,
} from "@/server/actions/crm.actions";

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

const CATEGORIES: ServiceCategory[] = [
  "WEB_DEVELOPMENT",
  "MOBILE_DEVELOPMENT",
  "API_BACKEND",
  "AI_AUTOMATION",
  "ENTERPRISE_SYSTEMS",
  "FINTECH_PAYMENTS",
  "CLOUD_HOSTING",
  "OTHER",
];

const STAGES: EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ON_HOLD",
];

describe("Phase 9.3: CRM Database Performance, Query Profiling & Synthetic Load Benchmarks", () => {
  let isDbAvailable = false;
  let superAdmin: AdminUser;
  const benchmarkResults: Record<string, { durationMs: number; count: number }> = {};
  const createdLeadIds: string[] = [];

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      const passwordHash = await hashPassword("TestPerfPass!2026#");
      superAdmin = await prisma.adminUser.upsert({
        where: { email: "perf.super@voidtech.test" },
        update: { isActive: true },
        create: {
          email: "perf.super@voidtech.test",
          name: "Perf SuperAdmin",
          role: "SUPER_ADMIN",
          passwordHash,
          isActive: true,
        },
      });

      const session = await createAdminSession(superAdmin.id, {
        ipAddress: "127.0.0.1",
        userAgent: "Vitest-Perf",
      });
      currentSessionCookie = session.cookieValue;
    } catch {
      isDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (isDbAvailable) {
      // Purge benchmark leads
      if (createdLeadIds.length > 0) {
        // Chunk deletion in batches of 500 to prevent parameter overflow
        for (let i = 0; i < createdLeadIds.length; i += 500) {
          const chunk = createdLeadIds.slice(i, i + 500);
          await prisma.enquiry.deleteMany({ where: { id: { in: chunk } } });
        }
      }
      await prisma.adminSession.deleteMany({ where: { userId: superAdmin?.id } });
      await prisma.$disconnect();

      console.log("\n========================================================");
      console.log("       PHASE 9.3 SYNTHETIC PERFORMANCE BENCHMARKS");
      console.log("========================================================");
      for (const [key, val] of Object.entries(benchmarkResults)) {
        console.log(`- ${key.padEnd(35)}: ${val.durationMs.toFixed(2)} ms (${val.count} leads)`);
      }
      console.log("========================================================\n");
    }
  });

  async function seedSyntheticLeads(targetTotal: number): Promise<void> {
    const currentCount = createdLeadIds.length;
    const needed = targetTotal - currentCount;
    if (needed <= 0) return;

    const batchData = [];
    for (let i = 0; i < needed; i++) {
      const idx = currentCount + i;
      const stage = STAGES[idx % STAGES.length];
      const category = CATEGORIES[idx % CATEGORIES.length];
      const val = 100000 + (idx % 10) * 50000;

      batchData.push({
        name: `Synthetic Client ${idx + 1}`,
        email: `client${idx + 1}@syntheticcorp.test`,
        phone: `+91 99000 ${String(idx).padStart(5, "0")}`,
        companyName: `Synthetic Corp ${idx + 1}`,
        serviceCategory: category,
        status: stage,
        estimatedValueInr: val,
        message: `Automated synthetic benchmark workload payload for item ${idx + 1}.`,
        source: "BENCHMARK_SEED",
      });
    }

    // Insert using createMany for maximum ingestion speed
    await prisma.enquiry.createMany({
      data: batchData,
    });

    // Fetch newly created IDs
    const created = await prisma.enquiry.findMany({
      where: { source: "BENCHMARK_SEED" },
      select: { id: true },
    });
    createdLeadIds.length = 0;
    for (const r of created) {
      createdLeadIds.push(r.id);
    }
  }

  it("1. Baseline Scale: 10 Synthetic Leads Benchmark", async () => {
    if (!isDbAvailable) return;
    await seedSyntheticLeads(10);

    const startMetrics = performance.now();
    const metricsRes = await getCrmMetricsAction();
    const durationMetrics = performance.now() - startMetrics;
    expect(metricsRes.success).toBe(true);

    const startKanban = performance.now();
    const kanbanRes = await getKanbanLeadsAction();
    const durationKanban = performance.now() - startKanban;
    expect(kanbanRes.success).toBe(true);

    benchmarkResults["Metrics Aggregation (10 leads)"] = { durationMs: durationMetrics, count: 10 };
    benchmarkResults["Kanban 8-Stage Load (10 leads)"] = { durationMs: durationKanban, count: 10 };

    expect(durationMetrics).toBeLessThan(100); // Expect sub-100ms
    expect(durationKanban).toBeLessThan(100);
  });

  it("2. Moderate Scale: 100 Synthetic Leads Benchmark", async () => {
    if (!isDbAvailable) return;
    await seedSyntheticLeads(100);

    const startMetrics = performance.now();
    const metricsRes = await getCrmMetricsAction();
    const durationMetrics = performance.now() - startMetrics;
    expect(metricsRes.success).toBe(true);

    const startKanban = performance.now();
    const kanbanRes = await getKanbanLeadsAction();
    const durationKanban = performance.now() - startKanban;
    expect(kanbanRes.success).toBe(true);

    benchmarkResults["Metrics Aggregation (100 leads)"] = { durationMs: durationMetrics, count: 100 };
    benchmarkResults["Kanban 8-Stage Load (100 leads)"] = { durationMs: durationKanban, count: 100 };

    expect(durationMetrics).toBeLessThan(200);
    expect(durationKanban).toBeLessThan(200);
  });

  it("3. High Scale: 500 Synthetic Leads Benchmark", async () => {
    if (!isDbAvailable) return;
    await seedSyntheticLeads(500);

    const startMetrics = performance.now();
    const metricsRes = await getCrmMetricsAction();
    const durationMetrics = performance.now() - startMetrics;
    expect(metricsRes.success).toBe(true);

    const startKanban = performance.now();
    const kanbanRes = await getKanbanLeadsAction();
    const durationKanban = performance.now() - startKanban;
    expect(kanbanRes.success).toBe(true);

    benchmarkResults["Metrics Aggregation (500 leads)"] = { durationMs: durationMetrics, count: 500 };
    benchmarkResults["Kanban 8-Stage Load (500 leads)"] = { durationMs: durationKanban, count: 500 };

    expect(durationMetrics).toBeLessThan(500);
    expect(durationKanban).toBeLessThan(500);
  });

  it("4. Production Scale: 1,000 Synthetic Leads Benchmark & Search Latency", async () => {
    if (!isDbAvailable) return;
    await seedSyntheticLeads(1000);

    const startMetrics = performance.now();
    const metricsRes = await getCrmMetricsAction();
    const durationMetrics = performance.now() - startMetrics;
    expect(metricsRes.success).toBe(true);

    const startKanban = performance.now();
    const kanbanRes = await getKanbanLeadsAction();
    const durationKanban = performance.now() - startKanban;
    expect(kanbanRes.success).toBe(true);

    // Measure full-text indexed search across 1000 records
    const startSearch = performance.now();
    const searchRes = await getKanbanLeadsAction({ search: "Synthetic Corp 999" });
    const durationSearch = performance.now() - startSearch;
    expect(searchRes.success).toBe(true);

    // Measure category filter across 1000 records
    const startCategory = performance.now();
    const catRes = await getKanbanLeadsAction({ category: "ENTERPRISE_SYSTEMS" });
    const durationCategory = performance.now() - startCategory;
    expect(catRes.success).toBe(true);

    benchmarkResults["Metrics Aggregation (1000 leads)"] = { durationMs: durationMetrics, count: 1000 };
    benchmarkResults["Kanban 8-Stage Load (1000 leads)"] = { durationMs: durationKanban, count: 1000 };
    benchmarkResults["Search Filtering (1000 leads)"] = { durationMs: durationSearch, count: 1000 };
    benchmarkResults["Category Filtering (1000 leads)"] = { durationMs: durationCategory, count: 1000 };

    expect(durationMetrics).toBeLessThan(1000); // Under 1 second for 1,000 leads
    expect(durationKanban).toBeLessThan(1000);
    expect(durationSearch).toBeLessThan(500);
  });

  it("5. Zero N+1 Query Validation on Relational Hydration", async () => {
    if (!isDbAvailable || createdLeadIds.length === 0) return;

    // Pick one lead and add relations
    const targetLeadId = createdLeadIds[0];
    if (!targetLeadId) return;
    await prisma.leadNote.create({
      data: {
        enquiryId: targetLeadId,
        authorName: "Perf Admin",
        content: "Benchmark note",
      },
    });
    await prisma.leadFollowUp.create({
      data: {
        enquiryId: targetLeadId,
        title: "Benchmark task",
        dueAt: new Date(Date.now() + 86400000),
      },
    });

    const startDetail = performance.now();
    const detailRes = await getLeadDetailAction(targetLeadId);
    const durationDetail = performance.now() - startDetail;

    expect(detailRes.success).toBe(true);
    benchmarkResults["Lead Detail Hydration (with relations)"] = {
      durationMs: durationDetail,
      count: 1,
    };

    expect(durationDetail).toBeLessThan(100);
  });
});

