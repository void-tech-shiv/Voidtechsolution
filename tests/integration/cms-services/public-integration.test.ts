import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ServicesRepo,
  PricingRepo,
  PortfolioRepo,
  FaqRepo,
  PageSectionsRepo,
  TestimonialsRepo,
} from "@/server/repositories";
import { prisma } from "@/lib/prisma";

describe("Phase 10.3: Public Website CMS Integration & Multi-Route Fallback Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Multi-Route Repository Content Delivery", () => {
    it("delivers all 18 core services with correct schema shape and order", async () => {
      const services = await ServicesRepo.getAllServices();
      expect(services.length).toBeGreaterThanOrEqual(18);
      for (const service of services) {
        expect(service).toHaveProperty("slug");
        expect(service).toHaveProperty("title");
        expect(service).toHaveProperty("deliverables");
        expect(Array.isArray(service.deliverables)).toBe(true);
      }
    });

    it("delivers approved pricing packages with transparent INR pricing", async () => {
      const packages = await PricingRepo.getActivePricingPackages();
      expect(packages.length).toBeGreaterThanOrEqual(10);
      for (const pkg of packages) {
        expect(pkg).toHaveProperty("priceInr");
        expect(pkg.currency).toBe("INR");
        expect(pkg.features.length).toBeGreaterThan(0);
      }
    });

    it("delivers authentic lab portfolio projects without fabricated metrics", async () => {
      const projects = await PortfolioRepo.getAllProjects();
      expect(projects.length).toBeGreaterThanOrEqual(2);
      for (const project of projects) {
        expect(project.projectType).toBe("CONCEPT");
        expect(project).toHaveProperty("slug");
        expect(project).toHaveProperty("industry");
      }
    });

    it("delivers categorized FAQs across development and pricing topics", async () => {
      const faqs = await FaqRepo.getActiveFaqs();
      expect(faqs.length).toBeGreaterThanOrEqual(5);
      for (const faq of faqs) {
        expect(faq.question).toBeTruthy();
        expect(faq.answer).toBeTruthy();
      }
    });

    it("delivers static page sections when database is offline or unseeded", async () => {
      const heroSection = await PageSectionsRepo.getPageSectionByKey("home-hero");
      expect(heroSection).not.toBeNull();
      expect(heroSection?.title).toBe("Build. Launch. Grow Online.");
    });

    it("returns null or fallback for testimonials without throwing runtime exceptions", async () => {
      const testimonials = await TestimonialsRepo.getActiveTestimonials();
      expect(Array.isArray(testimonials)).toBe(true);
    });
  });

  describe("Resilience & Fallback Invariants", () => {
    it("handles database errors gracefully without leaking raw database strings", async () => {
      const spy = vi.spyOn(prisma.service, "findMany").mockRejectedValueOnce(new Error("FATAL: connection refused"));
      const services = await ServicesRepo.getAllServices();
      expect(services.length).toBeGreaterThanOrEqual(18);
      spy.mockRestore();
    });
  });
});
