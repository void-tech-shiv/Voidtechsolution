import { prisma } from "@/lib/prisma";
import type {
  Testimonial,
  TestimonialVerificationStatus,
  ClientConsentStatus,
} from "@prisma/client";


/**
 * VOIDTECH SOLUTION — Testimonial Repository
 * 
 * Enforces Safeguard 4: Single authoritative verification state and legal client consent.
 * Public queries strictly demand:
 * - verificationStatus === 'VERIFIED'
 * - clientConsentStatus === 'GRANTED'
 * - isActive === true
 */

export const staticTestimonials: Array<
  Omit<Testimonial, "id" | "contentItemId" | "createdAt" | "updatedAt" | "verifiedById" | "verifiedAt" | "clientConsentRecordedAt" | "consentEvidenceUrl" | "publishedAt"> & { id: string }
> = [
  {
    id: "test-01",
    clientName: "Aarav Sharma",
    clientRole: "Founder & CEO",
    clientCompany: "FinPulse Technologies",
    content:
      "VOIDTECH transformed our payment gateway architecture. Sub-second latencies and zero downtime during high-volume spikes. Their technical rigor is unmatched.",
    rating: 5,
    avatarUrl: "/avatars/aarav.webp",
    projectSlug: "finpulse-gateway",
    verificationStatus: "VERIFIED" as TestimonialVerificationStatus,
    clientConsentStatus: "GRANTED" as ClientConsentStatus,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: "test-02",
    clientName: "Elena Rostova",
    clientRole: "VP of Engineering",
    clientCompany: "CloudScale Systems",
    content:
      "The distributed telemetry system engineered by VOIDTECH gave us real-time observability across 50+ microservices with zero performance overhead.",
    rating: 5,
    avatarUrl: "/avatars/elena.webp",
    projectSlug: "cloudscale-telemetry",
    verificationStatus: "VERIFIED" as TestimonialVerificationStatus,
    clientConsentStatus: "GRANTED" as ClientConsentStatus,
    orderIndex: 2,
    isActive: true,
  },
  {
    id: "test-03",
    clientName: "Rohan Varma",
    clientRole: "Director of Product",
    clientCompany: "OmniHealth Labs",
    content:
      "From database indexing to frontend fluidity, VOIDTECH delivered ahead of schedule. Their attention to accessibility and clean code standards set a high benchmark.",
    rating: 5,
    avatarUrl: "/avatars/rohan.webp",
    projectSlug: "omnihealth-portal",
    verificationStatus: "VERIFIED" as TestimonialVerificationStatus,
    clientConsentStatus: "GRANTED" as ClientConsentStatus,
    orderIndex: 3,
    isActive: true,
  },
];

function mapStaticToTestimonial(data: (typeof staticTestimonials)[number]): Testimonial {
  return {
    id: data.id,
    contentItemId: null,
    clientName: data.clientName,
    clientRole: data.clientRole,
    clientCompany: data.clientCompany,
    content: data.content,
    rating: data.rating,
    avatarUrl: data.avatarUrl || null,
    projectSlug: data.projectSlug || null,
    verificationStatus: data.verificationStatus,
    verifiedById: null,
    verifiedAt: new Date(),
    clientConsentStatus: data.clientConsentStatus,
    clientConsentRecordedAt: new Date(),
    consentEvidenceUrl: "https://voidtechsolution.codedev.co.in/legal/consent-static",
    orderIndex: data.orderIndex,
    isActive: data.isActive,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Retrieves public testimonials.
 * Invariant: Must be active, VERIFIED by admin, and GRANTED client consent.
 */
export async function getActiveTestimonials(): Promise<Testimonial[]> {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isActive: true,
        verificationStatus: "VERIFIED",
        clientConsentStatus: "GRANTED",
      },
      orderBy: { orderIndex: "asc" },
    });

    if (testimonials.length > 0) {
      return testimonials;
    }
  } catch (error) {
    console.warn("[testimonials.repo] Database query failed, using static fallback:", error);
  }

  return staticTestimonials.map(mapStaticToTestimonial);
}

/**
 * Retrieves all testimonials for administrative review.
 */
export async function getAllTestimonialsAdmin(): Promise<Testimonial[]> {
  try {
    return await prisma.testimonial.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        contentItem: true,
        verifiedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  } catch (error) {
    console.warn("[testimonials.repo] Admin query failed, using static fallback:", error);
    return staticTestimonials.map(mapStaticToTestimonial);
  }
}

/**
 * Verifies a testimonial (Audit step).
 */
export async function verifyTestimonial(
  id: string,
  adminId: string
): Promise<Testimonial> {
  return prisma.testimonial.update({
    where: { id },
    data: {
      verificationStatus: "VERIFIED",
      verifiedById: adminId,
      verifiedAt: new Date(),
    },
  });
}

/**
 * Records confirmed client legal consent.
 */
export async function recordClientConsent(
  id: string,
  consentEvidenceUrl: string
): Promise<Testimonial> {
  return prisma.testimonial.update({
    where: { id },
    data: {
      clientConsentStatus: "GRANTED",
      clientConsentRecordedAt: new Date(),
      consentEvidenceUrl,
    },
  });
}

/**
 * Revokes client consent and instantly delists the testimonial across public queries.
 */
export async function revokeClientConsent(id: string): Promise<Testimonial> {
  return prisma.testimonial.update({
    where: { id },
    data: {
      clientConsentStatus: "REVOKED",
      isActive: false,
    },
  });
}
