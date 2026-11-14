import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import {
  getActiveTestimonials,
  getAllTestimonialsAdmin,
  verifyTestimonial,
  recordClientConsent,
  revokeClientConsent,
} from "@/server/repositories/testimonials.repo";
import { AdminTestimonialsClient } from "@/components/admin/cms/admin-testimonials-client";
import { prisma } from "@/lib/prisma";

// Mock prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    testimonial: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Task 10.4.6 Finding C: Testimonials Repository Integrity & Fabricated Data Elimination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("C.1 & C.2: Elimination of Fabricated Data & Safe Empty Fallbacks", () => {
    it("returns empty array when database contains no eligible testimonials", async () => {
      vi.mocked(prisma.testimonial.findMany).mockResolvedValueOnce([]);

      const result = await getActiveTestimonials();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("returns empty array and logs warning when database query throws an error", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.mocked(prisma.testimonial.findMany).mockRejectedValueOnce(
        new Error("FATAL: connection to database failed")
      );

      const result = await getActiveTestimonials();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[testimonials.repo] Database query failed"),
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });

    it("never returns fabricated customer names, companies, or synthetic evidence URLs", async () => {
      // Regardless of empty DB or failure, no fabricated identities should exist
      vi.mocked(prisma.testimonial.findMany).mockResolvedValueOnce([]);
      const emptyResult = await getActiveTestimonials();

      const stringified = JSON.stringify(emptyResult);
      expect(stringified).not.toContain("Aarav");
      expect(stringified).not.toContain("Elena");
      expect(stringified).not.toContain("Rohan");
      expect(stringified).not.toContain("FinPulse");
      expect(stringified).not.toContain("CloudScale");
      expect(stringified).not.toContain("consent-static");
    });

    it("admin query returns empty array without throwing when database is unavailable", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.mocked(prisma.testimonial.findMany).mockRejectedValueOnce(
        new Error("Database offline")
      );

      const result = await getAllTestimonialsAdmin();

      expect(result).toEqual([]);
      warnSpy.mockRestore();
    });
  });

  describe("C.3: Strict Publication & Legal Consent Invariant Enforcement", () => {
    it("queries database with mandatory active, verified, consented, and published filters", async () => {
      vi.mocked(prisma.testimonial.findMany).mockResolvedValueOnce([]);

      await getActiveTestimonials();

      expect(prisma.testimonial.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          verificationStatus: "VERIFIED",
          clientConsentStatus: "GRANTED",
          publishedAt: { not: null },
        },
        orderBy: { orderIndex: "asc" },
      });
    });

    it("delivers verified and consented records returned by the database", async () => {
      const mockEligible = [
        {
          id: "test-legit-1",
          contentItemId: "ci_1",
          clientName: "Authorized Partner",
          clientRole: "CTO",
          clientCompany: "Legitimate Enterprise Ltd",
          content: "Legitimate audited statement.",
          rating: 5,
          avatarUrl: null,
          projectSlug: null,
          verificationStatus: "VERIFIED" as const,
          verifiedById: "admin_1",
          verifiedAt: new Date(),
          clientConsentStatus: "GRANTED" as const,
          clientConsentRecordedAt: new Date(),
          consentEvidenceUrl: "https://docusign.com/verified/cert123",
          orderIndex: 1,
          isActive: true,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.testimonial.findMany).mockResolvedValueOnce(mockEligible);

      const result = await getActiveTestimonials();

      expect(result.length).toBe(1);
      expect(result[0]!.clientName).toBe("Authorized Partner");
      expect(result[0]!.verificationStatus).toBe("VERIFIED");
      expect(result[0]!.clientConsentStatus).toBe("GRANTED");
    });

    it("revokeClientConsent updates status to REVOKED and sets isActive to false", async () => {
      vi.mocked(prisma.testimonial.update).mockResolvedValueOnce({
        id: "test-1",
        clientConsentStatus: "REVOKED",
        isActive: false,
      } as any);

      const updated = await revokeClientConsent("test-1");

      expect(prisma.testimonial.update).toHaveBeenCalledWith({
        where: { id: "test-1" },
        data: {
          clientConsentStatus: "REVOKED",
          isActive: false,
        },
      });
      expect(updated.clientConsentStatus).toBe("REVOKED");
      expect(updated.isActive).toBe(false);
    });

    it("recordClientConsent saves confirmed URL and advances status to GRANTED", async () => {
      vi.mocked(prisma.testimonial.update).mockResolvedValueOnce({
        id: "test-1",
        clientConsentStatus: "GRANTED",
      } as any);

      await recordClientConsent("test-1", "https://legal.voidtech.test/proof.pdf");

      expect(prisma.testimonial.update).toHaveBeenCalledWith({
        where: { id: "test-1" },
        data: {
          clientConsentStatus: "GRANTED",
          clientConsentRecordedAt: expect.any(Date),
          consentEvidenceUrl: "https://legal.voidtech.test/proof.pdf",
        },
      });
    });

    it("verifyTestimonial records admin ID and timestamp", async () => {
      vi.mocked(prisma.testimonial.update).mockResolvedValueOnce({
        id: "test-1",
        verificationStatus: "VERIFIED",
      } as any);

      await verifyTestimonial("test-1", "admin_lead_1");

      expect(prisma.testimonial.update).toHaveBeenCalledWith({
        where: { id: "test-1" },
        data: {
          verificationStatus: "VERIFIED",
          verifiedById: "admin_lead_1",
          verifiedAt: expect.any(Date),
        },
      });
    });
  });

  describe("C.4: Component Graceful Empty State Rendering", () => {
    it("AdminTestimonialsClient renders empty state message without error when list is empty", () => {
      render(
        <AdminTestimonialsClient initialTestimonials={[]} userRole="ADMIN" />
      );

      expect(
        screen.getByText("No testimonials registered in the system.")
      ).toBeInTheDocument();
    });
  });
});

