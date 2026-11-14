/**
 * VOIDTECH SOLUTION — CMS 9-Step Atomic Publishing Transaction Engine
 * 
 * Implements Safeguard 3: The 9-step atomic publishing protocol.
 * Guarantees that draft content promotions, optimistic concurrency checks,
 * domain table materialization, revision state transitions, and audit logging
 * succeed atomically or roll back completely on failure.
 */

import { prisma } from "@/lib/prisma";
import {
  ContentType,
  Prisma,
  type UserRole,
} from "@prisma/client";

import {
  ContentItemNotFoundError,
  ContentRevisionNotFoundError,
  ConcurrencyConflictError,
  RevisionOwnershipMismatchError,
  InvalidRevisionStateError,
  PreconditionFailedError,
  SchemaValidationError,
} from "@/server/repositories/cms/cms-repository.errors";
import {
  requireCmsPermission,
  type CmsPermissionKey,
} from "@/server/security/cms-rbac";
import {
  serviceSnapshotSchema,
  pricingPackageSnapshotSchema,
  portfolioProjectSnapshotSchema,
  faqSnapshotSchema,
  pageSectionSnapshotSchema,
  testimonialSnapshotSchema,
} from "@/validations/cms";

export interface PublishContentItemInput {
  contentItemId: string;
  revisionId: string;
  expectedVersion: number;
  actor: {
    id: string;
    role: UserRole;
    isActive: boolean;
    name?: string;
  };
  changeSummary?: string;
}

export interface PublishContentItemResult {
  contentItemId: string;
  publishedRevisionId: string;
  version: number;
  slug: string;
  contentType: ContentType;
  publishedAt: Date;
}

export interface ArchiveContentItemInput {
  contentItemId: string;
  expectedVersion: number;
  actor: {
    id: string;
    role: UserRole;
    isActive: boolean;
  };
  reason?: string;
}

/**
 * Maps ContentType to the mandatory publication permission key.
 */
function getPublicationPermissionKey(contentType: ContentType): CmsPermissionKey {
  switch (contentType) {
    case ContentType.SERVICE:
      return "services:publish";
    case ContentType.PRICING_PACKAGE:
      return "pricing:publish";
    case ContentType.PORTFOLIO_PROJECT:
      return "portfolio:publish";
    case ContentType.FAQ:
      return "faqs:edit";
    case ContentType.PAGE_SECTION:
      return "sections:publish";
    case ContentType.TESTIMONIAL:
      return "testimonials:publish";
    default:
      throw new Error(`Unsupported content type for publication: ${contentType}`);
  }
}

/**
 * Validates domain-specific snapshot payload against strict Zod schema.
 */
function validateSnapshotData(contentType: ContentType, snapshotData: unknown) {
  try {
    switch (contentType) {
      case ContentType.SERVICE:
        return serviceSnapshotSchema.parse(snapshotData);
      case ContentType.PRICING_PACKAGE:
        return pricingPackageSnapshotSchema.parse(snapshotData);
      case ContentType.PORTFOLIO_PROJECT:
        return portfolioProjectSnapshotSchema.parse(snapshotData);
      case ContentType.FAQ:
        return faqSnapshotSchema.parse(snapshotData);
      case ContentType.PAGE_SECTION:
        return pageSectionSnapshotSchema.parse(snapshotData);
      case ContentType.TESTIMONIAL:
        return testimonialSnapshotSchema.parse(snapshotData);
      default:
        throw new Error(`No validation schema configured for content type: ${contentType}`);
    }
  } catch (err: unknown) {
    if (err instanceof Error && "issues" in err) {
      throw new SchemaValidationError(
        `Snapshot data failed schema validation for ${contentType}`,
        (err as { issues: unknown }).issues
      );
    }
    throw err;
  }
}

/**
 * Materializes validated snapshot payload into the designated domain table.
 */
async function materializeDomainRecord(
  tx: Prisma.TransactionClient,
  contentType: ContentType,
  contentItemId: string,
  slug: string,
  validatedData: Record<string, unknown>,
  publishedAt: Date
) {

  switch (contentType) {
    case ContentType.SERVICE: {
      await tx.service.upsert({
        where: { contentItemId },
        update: {
          slug,
          title: validatedData.title,
          shortDesc: validatedData.shortDesc,
          fullDesc: validatedData.fullDesc,
          icon: validatedData.icon,
          category: validatedData.category,
          deliverables: validatedData.deliverables,
          technologies: validatedData.technologies,
          startingPriceInr: validatedData.startingPriceInr ?? null,
          currency: validatedData.currency,
          isFeatured: validatedData.isFeatured,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
        create: {
          contentItemId,
          slug,
          title: validatedData.title,
          shortDesc: validatedData.shortDesc,
          fullDesc: validatedData.fullDesc,
          icon: validatedData.icon,
          category: validatedData.category,
          deliverables: validatedData.deliverables,
          technologies: validatedData.technologies,
          startingPriceInr: validatedData.startingPriceInr ?? null,
          currency: validatedData.currency,
          isFeatured: validatedData.isFeatured,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
      });
      break;
    }

    case ContentType.PRICING_PACKAGE: {
      await tx.pricingPackage.upsert({
        where: { contentItemId },
        update: {
          slug,
          name: validatedData.name,
          category: validatedData.category,
          priceInr: validatedData.priceInr,
          currency: validatedData.currency,
          isStartingPrice: validatedData.isStartingPrice,
          billingPeriod: validatedData.billingPeriod ?? null,
          features: validatedData.features,
          popular: validatedData.popular,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
        create: {
          contentItemId,
          slug,
          name: validatedData.name,
          category: validatedData.category,
          priceInr: validatedData.priceInr,
          currency: validatedData.currency,
          isStartingPrice: validatedData.isStartingPrice,
          billingPeriod: validatedData.billingPeriod ?? null,
          features: validatedData.features,
          popular: validatedData.popular,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
      });
      break;
    }

    case ContentType.PORTFOLIO_PROJECT: {
      await tx.portfolioProject.upsert({
        where: { contentItemId },
        update: {
          slug,
          title: validatedData.title,
          clientName: validatedData.clientName,
          industry: validatedData.industry,
          summary: validatedData.summary,
          challenge: validatedData.challenge,
          solution: validatedData.solution,
          results: validatedData.results,
          techStack: validatedData.techStack,
          metrics: validatedData.metrics ?? undefined,
          heroImage: validatedData.heroImage ?? null,
          liveUrl: validatedData.liveUrl || null,
          githubUrl: validatedData.githubUrl || null,
          projectType: validatedData.projectType,
          isFeatured: validatedData.isFeatured,
          orderIndex: validatedData.orderIndex,
          publishedAt,
        },
        create: {
          contentItemId,
          slug,
          title: validatedData.title,
          clientName: validatedData.clientName,
          industry: validatedData.industry,
          summary: validatedData.summary,
          challenge: validatedData.challenge,
          solution: validatedData.solution,
          results: validatedData.results,
          techStack: validatedData.techStack,
          metrics: validatedData.metrics ?? undefined,
          heroImage: validatedData.heroImage ?? null,
          liveUrl: validatedData.liveUrl || null,
          githubUrl: validatedData.githubUrl || null,
          projectType: validatedData.projectType,
          isFeatured: validatedData.isFeatured,
          orderIndex: validatedData.orderIndex,
          publishedAt,
        },
      });
      break;
    }

    case ContentType.FAQ: {
      await tx.fAQ.upsert({
        where: { contentItemId },
        update: {
          question: validatedData.question,
          answer: validatedData.answer,
          category: validatedData.category,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
        create: {
          contentItemId,
          question: validatedData.question,
          answer: validatedData.answer,
          category: validatedData.category,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
      });
      break;
    }

    case ContentType.PAGE_SECTION: {
      await tx.pageSection.upsert({
        where: { contentItemId },
        update: {
          key: validatedData.key,
          pageSlug: validatedData.pageSlug,
          title: validatedData.title,
          subtitle: validatedData.subtitle ?? null,
          content: validatedData.content,
          metadata: validatedData.metadata ?? undefined,
          mediaUrl: validatedData.mediaUrl ?? null,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
        create: {
          contentItemId,
          key: validatedData.key,
          pageSlug: validatedData.pageSlug,
          title: validatedData.title,
          subtitle: validatedData.subtitle ?? null,
          content: validatedData.content,
          metadata: validatedData.metadata ?? undefined,
          mediaUrl: validatedData.mediaUrl ?? null,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
      });
      break;
    }

    case ContentType.TESTIMONIAL: {
      await tx.testimonial.upsert({
        where: { contentItemId },
        update: {
          clientName: validatedData.clientName,
          clientRole: validatedData.clientRole,
          clientCompany: validatedData.clientCompany,
          content: validatedData.content,
          rating: validatedData.rating,
          avatarUrl: validatedData.avatarUrl ?? null,
          projectSlug: validatedData.projectSlug ?? null,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
        create: {
          contentItemId,
          clientName: validatedData.clientName,
          clientRole: validatedData.clientRole,
          clientCompany: validatedData.clientCompany,
          content: validatedData.content,
          rating: validatedData.rating,
          avatarUrl: validatedData.avatarUrl ?? null,
          projectSlug: validatedData.projectSlug ?? null,
          orderIndex: validatedData.orderIndex,
          isActive: true,
          publishedAt,
        },
      });
      break;
    }
  }
}

/**
 * Executes the complete 9-Step Atomic Publishing Transaction.
 */
export async function publishContentItem(
  input: PublishContentItemInput
): Promise<PublishContentItemResult> {
  // Step 1: Authenticate Administrator
  if (!input.actor || !input.actor.id || !input.actor.isActive) {
    throw new Error("Publishing requires an active authenticated administrator.");
  }

  return prisma.$transaction(async (tx) => {
    // Step 2: Fetch ContentItem and Check Server-Side Publishing Permission
    const item = await tx.contentItem.findUnique({
      where: { id: input.contentItemId },
      include: {
        testimonial: true,
      },
    });

    if (!item) {
      throw new ContentItemNotFoundError(input.contentItemId);
    }

    const permissionKey = getPublicationPermissionKey(item.contentType);
    requireCmsPermission(input.actor, permissionKey);

    // Step 3: Validate Expected Content Version (OCC)
    if (item.version !== input.expectedVersion) {
      throw new ConcurrencyConflictError(
        `Version conflict: Expected version ${input.expectedVersion}, but item is at version ${item.version}.`,
        input.expectedVersion,
        item.version
      );
    }

    // Step 4: Validate Working Revision Ownership & Status
    const revision = await tx.contentRevision.findUnique({
      where: { id: input.revisionId },
    });

    if (!revision) {
      throw new ContentRevisionNotFoundError(input.revisionId);
    }

    if (revision.contentItemId !== item.id) {
      throw new RevisionOwnershipMismatchError(
        revision.id,
        item.id,
        revision.contentItemId
      );
    }

    const eligibleStatuses = ["WORKING_DRAFT", "PENDING_REVIEW", "APPROVED"];
    if (!eligibleStatuses.includes(revision.revisionStatus)) {
      throw new InvalidRevisionStateError(
        revision.id,
        revision.revisionStatus,
        `Revision cannot be published from status '${revision.revisionStatus}'. Must be one of: ${eligibleStatuses.join(
          ", "
        )}`
      );
    }

    // Step 5: Validate Content-Specific Constraints & Preconditions
    const validatedData = validateSnapshotData(item.contentType, revision.snapshotData);

    // Safeguard 4: Testimonial Dual-Gate Verification & Consent
    if (item.contentType === ContentType.TESTIMONIAL) {
      const testimonial = item.testimonial;
      if (!testimonial) {
        throw new PreconditionFailedError(
          "Testimonial record not found",
          "Testimonial domain record must exist prior to publishing."
        );
      }

      if (testimonial.verificationStatus !== "VERIFIED") {
        throw new PreconditionFailedError(
          "Testimonial verification mandatory",
          "Cannot publish testimonial: Verification status must be 'VERIFIED'."
        );
      }

      if (testimonial.clientConsentStatus !== "GRANTED") {
        throw new PreconditionFailedError(
          "Client consent mandatory",
          "Cannot publish testimonial: Client consent status must be 'GRANTED'."
        );
      }
    }

    const now = new Date();

    // Step 6: Update Materialized Domain Record
    await materializeDomainRecord(
      tx,
      item.contentType,
      item.id,
      item.slug,
      validatedData,
      now
    );

    // Step 7: Update Published Revision Pointer & Item State
    // Supersede previously published revision if distinct
    if (
      item.currentPublishedRevisionId &&
      item.currentPublishedRevisionId !== revision.id
    ) {
      await tx.contentRevision.update({
        where: { id: item.currentPublishedRevisionId },
        data: {
          revisionStatus: "SUPERSEDED",
        },
      });
    }

    // Promote new revision to PUBLISHED_SNAPSHOT
    await tx.contentRevision.update({
      where: { id: revision.id },
      data: {
        revisionStatus: "PUBLISHED_SNAPSHOT",
        isPublishedSnapshot: true,
      },
    });

    // Advance ContentItem version and pointers
    const updatedItem = await tx.contentItem.update({
      where: { id: item.id },
      data: {
        currentPublishedRevisionId: revision.id,
        publicationStatus: "PUBLISHED",
        version: { increment: 1 },
        publishedAt: now,
        publishedById: input.actor.id,
      },
    });

    // Step 8: Record Publishing Audit Event
    await tx.auditLog.create({
      data: {
        action: "CONTENT_PUBLISHED",
        entity: "ContentItem",
        entityId: item.id,
        actorId: input.actor.id,
        details: {
          contentType: item.contentType,
          slug: item.slug,
          previousVersion: item.version,
          newVersion: updatedItem.version,
          publishedRevisionId: revision.id,
          changeSummary: input.changeSummary ?? null,
        },
      },
    });

    // Step 9: Commit the Transaction (Handled by $transaction resolution)
    return {
      contentItemId: updatedItem.id,
      publishedRevisionId: revision.id,
      version: updatedItem.version,
      slug: updatedItem.slug,
      contentType: updatedItem.contentType,
      publishedAt: now,
    };
  });
}

/**
 * Deactivates and archives a published ContentItem.
 */
export async function archiveContentItem(
  input: ArchiveContentItemInput
): Promise<{ contentItemId: string; version: number }> {
  if (!input.actor || !input.actor.id || !input.actor.isActive) {
    throw new Error("Archiving requires an active authenticated administrator.");
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.contentItem.findUnique({
      where: { id: input.contentItemId },
    });

    if (!item) {
      throw new ContentItemNotFoundError(input.contentItemId);
    }

    // Permission check: SUPER_ADMIN or ADMIN
    if (input.actor.role === "EDITOR") {
      throw new Error("Forbidden: EDITOR cannot archive content items.");
    }

    // OCC Check
    if (item.version !== input.expectedVersion) {
      throw new ConcurrencyConflictError(
        `Version conflict: Expected version ${input.expectedVersion}, but item is at version ${item.version}.`,
        input.expectedVersion,
        item.version
      );
    }

    // Deactivate domain record
    switch (item.contentType) {
      case ContentType.SERVICE:
        await tx.service.updateMany({
          where: { contentItemId: item.id },
          data: { isActive: false },
        });
        break;
      case ContentType.PRICING_PACKAGE:
        await tx.pricingPackage.updateMany({
          where: { contentItemId: item.id },
          data: { isActive: false },
        });
        break;
      case ContentType.PORTFOLIO_PROJECT:
        // Portfolio projects do not have isActive in schema, leave in table
        break;
      case ContentType.FAQ:
        await tx.fAQ.updateMany({
          where: { contentItemId: item.id },
          data: { isActive: false },
        });
        break;
      case ContentType.PAGE_SECTION:
        await tx.pageSection.updateMany({
          where: { contentItemId: item.id },
          data: { isActive: false },
        });
        break;
      case ContentType.TESTIMONIAL:
        await tx.testimonial.updateMany({
          where: { contentItemId: item.id },
          data: { isActive: false },
        });
        break;
    }

    const updated = await tx.contentItem.update({
      where: { id: item.id },
      data: {
        publicationStatus: "ARCHIVED",
        version: { increment: 1 },
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CONTENT_ARCHIVED",
        entity: "ContentItem",
        entityId: item.id,
        actorId: input.actor.id,
        details: {
          contentType: item.contentType,
          previousVersion: item.version,
          newVersion: updated.version,
          reason: input.reason ?? null,
        },
      },
    });

    return {
      contentItemId: updated.id,
      version: updated.version,
    };
  });
}
