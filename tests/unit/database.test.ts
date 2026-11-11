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
import { getSetting, getAllSettings } from "@/server/repositories/settings.repo";
import {
  getAllPricingPackages,
  getActivePricingPackages,
  getPricingPackageBySlug,
} from "@/server/repositories/pricing.repo";
import {
  getAllFaqs,
  getActiveFaqs,
  getFaqsByCategory,
} from "@/server/repositories/faq.repo";
import { getEnquiryStats, createEnquiry } from "@/server/repositories/enquiries.repo";
import { checkDatabaseConnection } from "@/lib/prisma";

describe("Phase 3: Services Repository & INR Pricing Catalog", () => {
  it("retrieves all 18 registered business services with complete metadata and INR currency", async () => {
    const services = await getAllServices();
    expect(services).toHaveLength(18);

    for (const service of services) {
      expect(service.currency).toBe("INR");
      expect(service.technologies.length).toBeGreaterThan(0);
      expect(service.deliverables.length).toBeGreaterThan(0);
    }

    const first = services[0];
    expect(first).toBeDefined();
    expect(first?.slug).toBe("website-development");
    expect(first?.category).toBe("WEB_DEVELOPMENT");
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
    expect(service?.currency).toBe("INR");
  });

  it("returns null when querying a non-existent service slug", async () => {
    const service = await getServiceBySlug("non-existent-service-xyz");
    expect(service).toBeNull();
  });
});

describe("Phase 3: Portfolio Data Integrity (Concept / Architecture Prototypes)", () => {
  it("marks all seeded portfolio projects as CONCEPT without fabricated client names", async () => {
    const projects = await getAllProjects();
    expect(projects.length).toBeGreaterThanOrEqual(2);

    for (const proj of projects) {
      // Must be designated as concept / prototype
      expect(proj.projectType).toBe("CONCEPT");

      // Fabricated client names must NOT exist
      expect(proj.clientName).not.toBe("Aether Capital");
      expect(proj.clientName).not.toBe("Synthex Networks");
      expect(proj.clientName.toLowerCase()).toContain("concept lab");

      // No fabricated live production URLs
      expect(proj.liveUrl).toBeNull();
    }
  });

  it("retrieves featured projects for the showcase", async () => {
    const featured = await getFeaturedProjects();
    expect(featured.length).toBeGreaterThan(0);
    for (const p of featured) {
      expect(p.isFeatured).toBe(true);
    }
  });

  it("retrieves project by slug with simulated benchmark metrics", async () => {
    const project = await getProjectBySlug("algorithmic-liquidity-engine");
    expect(project).not.toBeNull();
    expect(project?.industry).toBe("FINTECH");

    const metrics = project?.metrics as Array<{ label: string; value: string }>;
    expect(metrics).toBeDefined();
    expect(metrics.some((m) => m.label.toLowerCase().includes("simulated") || m.label.toLowerCase().includes("benchmark"))).toBe(true);

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

describe("Phase 3: Approved INR Pricing Packages (10 Tiers)", () => {
  it("retrieves exactly 10 approved pricing packages stored in INR", async () => {
    const packages = await getAllPricingPackages();
    expect(packages).toHaveLength(10);

    for (const pkg of packages) {
      expect(pkg.currency).toBe("INR");
      expect(pkg.priceInr).toBeGreaterThan(0);
      expect(pkg.features.length).toBeGreaterThan(0);
    }
  });

  it("strictly enforces the ten approved starting prices in INR", async () => {
    const packages = await getAllPricingPackages();
    const priceMap = Object.fromEntries(packages.map((p) => [p.slug, p.priceInr]));

    expect(priceMap["basic-static"]).toBe(999);
    expect(priceMap["standard-business"]).toBe(2999);
    expect(priceMap["professional"]).toBe(5999);
    expect(priceMap["premium-custom"]).toBe(12999);
    expect(priceMap["e-commerce"]).toBe(19999);
    expect(priceMap["saas"]).toBe(24999);
    expect(priceMap["lms"]).toBe(29999);
    expect(priceMap["marketplace"]).toBe(34999);
    expect(priceMap["erp-crm"]).toBe(49999);
    expect(priceMap["ai-powered"]).toBe(59999);
  });

  it("retrieves active pricing packages and finds package by slug", async () => {
    const active = await getActivePricingPackages();
    expect(active.length).toBe(10);

    const professional = await getPricingPackageBySlug("professional");
    expect(professional).not.toBeNull();
    expect(professional?.name).toBe("Professional");
    expect(professional?.priceInr).toBe(5999);
    expect(professional?.popular).toBe(true);
  });
});

describe("Phase 3: FAQ Repository & Content Categorization", () => {
  it("retrieves baseline FAQs with category tags", async () => {
    const faqs = await getAllFaqs();
    expect(faqs.length).toBeGreaterThanOrEqual(5);

    const activeFaqs = await getActiveFaqs();
    expect(activeFaqs.length).toBeGreaterThanOrEqual(5);
  });

  it("filters FAQs by category accurately", async () => {
    const pricingFaqs = await getFaqsByCategory("PRICING");
    expect(pricingFaqs.length).toBeGreaterThan(0);
    for (const f of pricingFaqs) {
      expect(f.category).toBe("PRICING");
      expect(f.answer).toContain("₹999");
    }
  });
});

describe("Phase 3: Site Settings & Database Resilience", () => {
  it("returns default value for unseeded settings gracefully", async () => {
    const value = await getSetting("unseeded_test_key", "default_test_value");
    expect(value).toBe("default_test_value");
  });

  it("retrieves baseline fallback settings map", async () => {
    const settings = await getAllSettings();
    expect(settings.site_name).toBe("VOIDTECH SOLUTION");
    expect(settings.site_tagline).toBe("Build. Launch. Grow Online.");
  });

  it("handles database connection check gracefully without crashing", async () => {
    const isConnected = await checkDatabaseConnection();
    expect(typeof isConnected).toBe("boolean");
  });

  it("enforces safe write error throwing on database failure without leaking credentials", async () => {
    await expect(
      createEnquiry({
        name: "Test Prospect",
        email: "prospect@example.com",
        serviceCategory: "WEB_DEVELOPMENT",
        message: "Hello VoidTech",
      })
    ).rejects.toThrow("Database write operation failed");
  });

  it("retrieves enquiry metrics without crashing when DB is offline", async () => {
    const stats = await getEnquiryStats();
    expect(stats.NEW).toBe(0);
    expect(stats.CONVERTED).toBe(0);
  });
});
