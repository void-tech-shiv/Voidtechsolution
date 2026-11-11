import { describe, it, expect } from "vitest";
import {
  getAllServices,
  getActiveServices,
  getServiceBySlug,
  getFeaturedServices,
} from "@/server/repositories/services.repo";
import {
  getAllProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getProjectsByIndustry,
} from "@/server/repositories/portfolio.repo";
import { getSetting } from "@/server/repositories/settings.repo";
import { checkDatabaseConnection } from "@/lib/prisma";

describe("Phase 3: Services Repository & Catalog Layer", () => {
  it("retrieves all 18 registered business services with complete metadata", async () => {
    const services = await getAllServices();
    expect(services).toHaveLength(18);

    const first = services[0];
    expect(first).toBeDefined();
    expect(first?.slug).toBe("website-development");
    expect(first?.category).toBe("WEB_DEVELOPMENT");
    expect(first?.technologies.length).toBeGreaterThan(0);
    expect(first?.deliverables.length).toBeGreaterThan(0);
  });

  it("retrieves only active services", async () => {
    const active = await getActiveServices();
    expect(active.length).toBeGreaterThanOrEqual(18);
    for (const service of active) {
      expect(service.isActive).toBe(true);
    }
  });

  it("retrieves only featured services for public highlights", async () => {
    const featured = await getFeaturedServices();
    expect(featured.length).toBeGreaterThan(0);
    for (const service of featured) {
      expect(service.isFeatured).toBe(true);
    }
  });

  it("finds a service by its slug", async () => {
    const service = await getServiceBySlug("ai-agents");
    expect(service).not.toBeNull();
    expect(service?.title).toBe("AI Agents");
    expect(service?.category).toBe("AI_AUTOMATION");
  });

  it("returns null when querying a non-existent service slug", async () => {
    const service = await getServiceBySlug("non-existent-service-xyz");
    expect(service).toBeNull();
  });
});

describe("Phase 3: Portfolio Repository & Case Studies Layer", () => {
  it("retrieves case studies with metrics and tech stack", async () => {
    const projects = await getAllProjects();
    expect(projects.length).toBeGreaterThanOrEqual(2);

    const fintech = projects.find((p) => p.slug === "algorithmic-liquidity-engine");
    expect(fintech).toBeDefined();
    expect(fintech?.clientName).toBe("Aether Capital");
    expect(fintech?.industry).toBe("FINTECH");
    expect(fintech?.techStack).toContain("Next.js");
  });

  it("retrieves featured projects for the showcase", async () => {
    const featured = await getFeaturedProjects();
    expect(featured.length).toBeGreaterThan(0);
    for (const p of featured) {
      expect(p.isFeatured).toBe(true);
    }
  });

  it("retrieves project by slug and returns null for non-existent slug", async () => {
    const project = await getProjectBySlug("autonomous-ai-ops-agent");
    expect(project).not.toBeNull();
    expect(project?.clientName).toBe("Synthex Networks");

    const nonExistent = await getProjectBySlug("unknown-slug");
    expect(nonExistent).toBeNull();
  });

  it("filters portfolio projects by industry", async () => {
    const fintechProjects = await getProjectsByIndustry("FINTECH");
    expect(fintechProjects.length).toBeGreaterThan(0);
    for (const p of fintechProjects) {
      expect(p.industry.toLowerCase()).toBe("fintech");
    }
  });
});

describe("Phase 3: System Settings & Connection Resilience", () => {
  it("returns default value for unseeded settings gracefully", async () => {
    const value = await getSetting("unseeded_test_key", "default_test_value");
    expect(value).toBe("default_test_value");
  });

  it("handles database connection check gracefully without crashing", async () => {
    const isConnected = await checkDatabaseConnection();
    // In local unit tests without live Postgres, it returns boolean without throwing uncaught error
    expect(typeof isConnected).toBe("boolean");
  });
});
