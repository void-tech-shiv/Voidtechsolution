import { describe, it, expect } from "vitest";
import {
  publicTestimonialSubmissionSchema,
  adminUpdateTestimonialSchema,
  testimonialQuerySchema,
} from "@/validations/cms/testimonial.schema";
import {
  TestimonialVerificationStatus,
  ClientConsentStatus,
} from "@/types/cms";

describe("CMS Validation — Testimonial Schemas", () => {
  describe("publicTestimonialSubmissionSchema", () => {
    it("accepts valid public testimonial submission with consent", () => {
      const input = {
        clientName: "John Doe",
        clientRole: "Head of Engineering",
        clientCompany: "Apex Innovations",
        content:
          "VOIDTECH transformed our infrastructure and accelerated our time-to-market significantly.",
        rating: 5,
        avatarUrl: "https://example.com/avatars/john.jpg",
        projectSlug: "cloud-migration",
        consentGiven: true,
      };
      const result = publicTestimonialSubmissionSchema.parse(input);
      expect(result.clientName).toBe("John Doe");
      expect(result.rating).toBe(5);
      expect(result.consentGiven).toBe(true);
    });

    it("rejects submission if consentGiven is false or missing", () => {
      const withoutConsent = {
        clientName: "Jane Smith",
        content: "Great service and great communication.",
        rating: 5,
      };
      expect(() =>
        publicTestimonialSubmissionSchema.parse(withoutConsent)
      ).toThrow();

      const falseConsent = {
        ...withoutConsent,
        consentGiven: false,
      };
      expect(() =>
        publicTestimonialSubmissionSchema.parse(falseConsent)
      ).toThrow("Explicit client consent is required to submit a testimonial");
    });

    it("enforces rating boundary (1 to 5)", () => {
      const base = {
        clientName: "Alice",
        content: "Thoroughly professional team and delivery.",
        consentGiven: true,
      };

      expect(() =>
        publicTestimonialSubmissionSchema.parse({ ...base, rating: 0 })
      ).toThrow("Rating must be between 1 and 5");

      expect(() =>
        publicTestimonialSubmissionSchema.parse({ ...base, rating: 6 })
      ).toThrow("Rating must be between 1 and 5");

      expect(() =>
        publicTestimonialSubmissionSchema.parse({ ...base, rating: 4.5 })
      ).toThrow("Rating must be an integer");

      expect(
        publicTestimonialSubmissionSchema.parse({ ...base, rating: 1 }).rating
      ).toBe(1);
      expect(
        publicTestimonialSubmissionSchema.parse({ ...base, rating: 5 }).rating
      ).toBe(5);
    });

    it("enforces content length boundaries (10 to 2000 chars)", () => {
      const base = {
        clientName: "Alice",
        rating: 5,
        consentGiven: true,
      };

      expect(() =>
        publicTestimonialSubmissionSchema.parse({ ...base, content: "Too short" })
      ).toThrow("Testimonial content must be at least 10 characters");

      expect(
        publicTestimonialSubmissionSchema.parse({
          ...base,
          content: "1234567890",
        }).content
      ).toBe("1234567890");

      const max2000 = "x".repeat(2000);
      expect(
        publicTestimonialSubmissionSchema.parse({
          ...base,
          content: max2000,
        }).content
      ).toHaveLength(2000);

      expect(() =>
        publicTestimonialSubmissionSchema.parse({
          ...base,
          content: "x".repeat(2001),
        })
      ).toThrow("Testimonial content cannot exceed 2000 characters");
    });

    it("STRICT MODE: Rejects attempts to self-approve or inject admin fields", () => {
      const injectionAttempt = {
        clientName: "Mallory",
        content: "Unverified injected review that tries to verify itself",
        rating: 5,
        consentGiven: true,
        verificationStatus: "VERIFIED",
        clientConsentStatus: "GRANTED",
        isActive: true,
      };

      expect(() =>
        publicTestimonialSubmissionSchema.parse(injectionAttempt)
      ).toThrow(/unrecognized_keys/);
    });
  });

  describe("adminUpdateTestimonialSchema — Verification & Consent Matrix", () => {
    const baseId = "clh7tes120000abc123456789";

    // 1. VERIFIED + GRANTED => Allowed
    it("allows VERIFIED status when consent is GRANTED", () => {
      const payload = {
        id: baseId,
        verificationStatus: TestimonialVerificationStatus.VERIFIED,
        clientConsentStatus: ClientConsentStatus.GRANTED,
        consentEvidenceUrl: "https://evidence.example.com/signed-consent.pdf",
        isActive: true,
      };
      const res = adminUpdateTestimonialSchema.parse(payload);
      expect(res.verificationStatus).toBe(TestimonialVerificationStatus.VERIFIED);
      expect(res.clientConsentStatus).toBe(ClientConsentStatus.GRANTED);
    });

    // 2. VERIFIED + PENDING => Rejected
    it("SECURITY INVARIANT: Rejects VERIFIED status when consent is PENDING", () => {
      const payload = {
        id: baseId,
        verificationStatus: TestimonialVerificationStatus.VERIFIED,
        clientConsentStatus: ClientConsentStatus.PENDING,
      };
      expect(() => adminUpdateTestimonialSchema.parse(payload)).toThrow(
        "Cannot set verification status to VERIFIED unless client consent status is explicitly GRANTED"
      );
    });

    // 3. VERIFIED + REVOKED => Rejected
    it("SECURITY INVARIANT: Rejects VERIFIED status when consent is REVOKED", () => {
      const payload = {
        id: baseId,
        verificationStatus: TestimonialVerificationStatus.VERIFIED,
        clientConsentStatus: ClientConsentStatus.REVOKED,
      };
      expect(() => adminUpdateTestimonialSchema.parse(payload)).toThrow(
        "Cannot set verification status to VERIFIED unless client consent status is explicitly GRANTED"
      );
    });

    // 4. VERIFIED without clientConsentStatus supplied => Rejected
    it("SECURITY INVARIANT: Rejects VERIFIED status when clientConsentStatus is omitted", () => {
      const payload = {
        id: baseId,
        verificationStatus: TestimonialVerificationStatus.VERIFIED,
      };
      expect(() => adminUpdateTestimonialSchema.parse(payload)).toThrow(
        "Cannot set verification status to VERIFIED unless client consent status is explicitly GRANTED"
      );
    });

    // 5. UNVERIFIED + PENDING => Allowed
    it("allows UNVERIFIED status when consent is PENDING", () => {
      const payload = {
        id: baseId,
        verificationStatus: TestimonialVerificationStatus.UNVERIFIED,
        clientConsentStatus: ClientConsentStatus.PENDING,
      };
      const res = adminUpdateTestimonialSchema.parse(payload);
      expect(res.verificationStatus).toBe(TestimonialVerificationStatus.UNVERIFIED);
      expect(res.clientConsentStatus).toBe(ClientConsentStatus.PENDING);
    });

    // 6. UNVERIFIED + GRANTED => Allowed
    it("allows UNVERIFIED status when consent is GRANTED", () => {
      const payload = {
        id: baseId,
        verificationStatus: TestimonialVerificationStatus.UNVERIFIED,
        clientConsentStatus: ClientConsentStatus.GRANTED,
      };
      const res = adminUpdateTestimonialSchema.parse(payload);
      expect(res.verificationStatus).toBe(TestimonialVerificationStatus.UNVERIFIED);
      expect(res.clientConsentStatus).toBe(ClientConsentStatus.GRANTED);
    });

    // 7. UNVERIFIED + REVOKED => Allowed
    it("allows UNVERIFIED status when consent is REVOKED", () => {
      const payload = {
        id: baseId,
        verificationStatus: TestimonialVerificationStatus.UNVERIFIED,
        clientConsentStatus: ClientConsentStatus.REVOKED,
      };
      const res = adminUpdateTestimonialSchema.parse(payload);
      expect(res.verificationStatus).toBe(TestimonialVerificationStatus.UNVERIFIED);
      expect(res.clientConsentStatus).toBe(ClientConsentStatus.REVOKED);
    });

    // 8. REJECTED + PENDING / GRANTED / REVOKED => Allowed
    it("allows REJECTED status across all consent states", () => {
      for (const consent of [
        ClientConsentStatus.PENDING,
        ClientConsentStatus.GRANTED,
        ClientConsentStatus.REVOKED,
      ]) {
        const payload = {
          id: baseId,
          verificationStatus: TestimonialVerificationStatus.REJECTED,
          clientConsentStatus: consent,
        };
        const res = adminUpdateTestimonialSchema.parse(payload);
        expect(res.verificationStatus).toBe(TestimonialVerificationStatus.REJECTED);
        expect(res.clientConsentStatus).toBe(consent);
      }
    });

    // 9. STRICT MODE: Rejects attempts to inject internal audit fields
    it("STRICT MODE: Rejects unexpected or internal fields on admin update", () => {
      const injectionAttempt = {
        id: baseId,
        clientName: "Test Name",
        verifiedById: "admin_user_123",
        verifiedAt: new Date().toISOString(),
      };
      expect(() => adminUpdateTestimonialSchema.parse(injectionAttempt)).toThrow(
        /unrecognized_keys/
      );
    });
  });

  describe("testimonialQuerySchema", () => {
    it("parses query parameters with filters and pagination", () => {
      const query = {
        verificationStatus: TestimonialVerificationStatus.VERIFIED,
        clientConsentStatus: ClientConsentStatus.GRANTED,
        isActive: "true",
        page: "2",
        limit: "10",
        sortBy: "rating",
        sortOrder: "desc",
      };
      const result = testimonialQuerySchema.parse(query);
      expect(result.verificationStatus).toBe(
        TestimonialVerificationStatus.VERIFIED
      );
      expect(result.clientConsentStatus).toBe(ClientConsentStatus.GRANTED);
      expect(result.isActive).toBe(true);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.sortBy).toBe("rating");
    });
  });
});
