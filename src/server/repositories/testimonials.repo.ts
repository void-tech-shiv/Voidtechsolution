import { prisma } from "@/lib/prisma";
import type { Testimonial } from "@prisma/client";

/**
 * VOIDTECH SOLUTION — Testimonial Repository
 * 
 * Enforces Safeguard 4: Single authoritative verification state and legal client consent.
 * Public queries strictly demand:
 * - verificationStatus === 'VERIFIED'
 * - clientConsentStatus === 'GRANTED'
 * - isActive === true
 * - publishedAt IS NOT NULL
 * 
 * In accordance with ethical standards and legal compliance:
 * - No fabricated client endorsements, invented companies, or synthetic testimonials exist.
 * - If no verified, consented testimonials exist, or the database is unavailable,
 *   queries return a safe empty list ([]).
 */

/**
 * Retrieves public testimonials that satisfy all legal and editorial criteria.
 * Invariants enforced at the database level:
 * 1. Must be marked isActive = true.
 * 2. Must be verified by an authorized administrator (verificationStatus = 'VERIFIED').
 * 3. Must have explicit client legal consent on record (clientConsentStatus = 'GRANTED').
 * 4. Must be formally published (publishedAt is not null).
 * 
 * Safe Fallback: Returns empty list if database is unreachable or no records qualify.
 */
export async function getActiveTestimonials(): Promise<Testimonial[]> {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isActive: true,
        verificationStatus: "VERIFIED",
        clientConsentStatus: "GRANTED",
        publishedAt: { not: null },
      },
      orderBy: { orderIndex: "asc" },
    });

    return testimonials;
  } catch (error) {
    console.warn(
      "[testimonials.repo] Database query failed, returning safe empty list:",
      error
    );
    return [];
  }
}

/**
 * Retrieves all testimonials for administrative review.
 * Returns an empty array if database is unreachable or unseeded.
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
    console.warn(
      "[testimonials.repo] Admin query failed, returning safe empty list:",
      error
    );
    return [];
  }
}

/**
 * Verifies a testimonial (Audit step by authorized administrator).
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
 * Records confirmed client legal consent with proof reference.
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
