import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  publishContentItem,
  archiveContentItem,
} from "@/server/services/cms/publishing.service";
import { prisma } from "@/lib/prisma";
import {
  ConcurrencyConflictError,
  RevisionOwnershipMismatchError,
  InvalidRevisionStateError,
  PreconditionFailedError,
  SchemaValidationError,
} from "@/server/repositories/cms/cms-repository.errors";

import { AuthorizationError } from "@/server/security/rbac";
import { ContentType, ServiceCategory } from "@prisma/client";

// Mock prisma transaction and models
vi.mock("@/lib/prisma", () => {
  const mockTx = {
    contentItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    contentRevision: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    service: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    pricingPackage: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    portfolioProject: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    fAQ: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    pageSection: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    testimonial: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  return {
    prisma: {
      $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(mockTx)),
      ...mockTx,
    },
  };
});

describe("Task 10.1.6 — 9-Step Atomic Publishing Transaction Engine", () => {
  const mockSuperAdmin = {
    id: "admin_super_1",
    role: "SUPER_ADMIN" as const,
    isActive: true,
  };

  const mockAdmin = {
    id: "admin_ops_1",
    role: "ADMIN" as const,
    isActive: true,
  };

  const mockEditor = {
    id: "editor_1",
    role: "EDITOR" as const,
    isActive: true,
  };

  const validServiceSnapshot = {
    title: "Next.js Web Development",
    shortDesc: "High performance web engineering",
    fullDesc: "Complete bespoke software engineering using modern Next.js and Tailwind.",
    icon: "Code",
    category: ServiceCategory.WEB_DEVELOPMENT,
    deliverables: ["Responsive Architecture", "SEO Optimization"],
    technologies: ["Next.js", "TypeScript", "Tailwind CSS"],
    startingPriceInr: 50000,
    currency: "INR",
    isFeatured: true,
    orderIndex: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Step 1: rejects publishing when actor is missing or inactive", async () => {
    await expect(
      publishContentItem({
        contentItemId: "ci_1",
        revisionId: "rev_1",
        expectedVersion: 1,
        actor: { id: "inactive_admin", role: "ADMIN", isActive: false },
      })
    ).rejects.toThrow("Publishing requires an active authenticated administrator");
  });

  it("Step 2: rejects publishing when actor is an EDITOR (live publishing forbidden)", async () => {
    const mockTx = (prisma as any).contentItem;
    mockTx.findUnique.mockResolvedValueOnce({
      id: "ci_pricing_1",
      slug: "growth-tier",
      contentType: ContentType.PRICING_PACKAGE,
      version: 1,
    });

    await expect(
      publishContentItem({
        contentItemId: "ci_pricing_1",
        revisionId: "rev_1",
        expectedVersion: 1,
        actor: mockEditor,
      })
    ).rejects.toThrow(AuthorizationError);
  });

  it("Step 3: aborts with ConcurrencyConflictError when expectedVersion mismatches database version (OCC)", async () => {
    const mockItem = {
      id: "ci_svc_1",
      slug: "web-dev",
      contentType: ContentType.SERVICE,
      version: 3, // Current DB version is 3
    };

    (prisma as any).contentItem.findUnique.mockResolvedValueOnce(mockItem);

    await expect(
      publishContentItem({
        contentItemId: "ci_svc_1",
        revisionId: "rev_1",
        expectedVersion: 2, // Client submitted stale version 2
        actor: mockAdmin,
      })
    ).rejects.toThrow(ConcurrencyConflictError);
  });

  it("Step 4: aborts with RevisionOwnershipMismatchError when revision belongs to different content item", async () => {
    const mockItem = {
      id: "ci_svc_1",
      slug: "web-dev",
      contentType: ContentType.SERVICE,
      version: 2,
    };
    const mockRevision = {
      id: "rev_foreign",
      contentItemId: "ci_other_999", // Different parent!
      revisionStatus: "WORKING_DRAFT",
      snapshotData: validServiceSnapshot,
    };

    (prisma as any).contentItem.findUnique.mockResolvedValueOnce(mockItem);
    (prisma as any).contentRevision.findUnique.mockResolvedValueOnce(mockRevision);

    await expect(
      publishContentItem({
        contentItemId: "ci_svc_1",
        revisionId: "rev_foreign",
        expectedVersion: 2,
        actor: mockAdmin,
      })
    ).rejects.toThrow(RevisionOwnershipMismatchError);
  });

  it("Step 4b: aborts with InvalidRevisionStateError when revision status is SUPERSEDED", async () => {
    const mockItem = {
      id: "ci_svc_1",
      slug: "web-dev",
      contentType: ContentType.SERVICE,
      version: 2,
    };
    const mockRevision = {
      id: "rev_old",
      contentItemId: "ci_svc_1",
      revisionStatus: "SUPERSEDED",
      snapshotData: validServiceSnapshot,
    };

    (prisma as any).contentItem.findUnique.mockResolvedValueOnce(mockItem);
    (prisma as any).contentRevision.findUnique.mockResolvedValueOnce(mockRevision);

    await expect(
      publishContentItem({
        contentItemId: "ci_svc_1",
        revisionId: "rev_old",
        expectedVersion: 2,
        actor: mockAdmin,
      })
    ).rejects.toThrow(InvalidRevisionStateError);
  });

  it("Step 5: aborts with SchemaValidationError when snapshotData fails domain constraints", async () => {
    const mockItem = {
      id: "ci_svc_1",
      slug: "web-dev",
      contentType: ContentType.SERVICE,
      version: 2,
    };
    const invalidSnapshot = {
      // Missing title and shortDesc
      category: "INVALID_CATEGORY",
      deliverables: [],
    };
    const mockRevision = {
      id: "rev_invalid",
      contentItemId: "ci_svc_1",
      revisionStatus: "WORKING_DRAFT",
      snapshotData: invalidSnapshot,
    };

    (prisma as any).contentItem.findUnique.mockResolvedValueOnce(mockItem);
    (prisma as any).contentRevision.findUnique.mockResolvedValueOnce(mockRevision);

    await expect(
      publishContentItem({
        contentItemId: "ci_svc_1",
        revisionId: "rev_invalid",
        expectedVersion: 2,
        actor: mockAdmin,
      })
    ).rejects.toThrow(SchemaValidationError);
  });

  it("Safeguard 4: aborts with PreconditionFailedError when publishing an UNVERIFIED testimonial", async () => {
    const mockItem = {
      id: "ci_test_1",
      slug: "john-doe-testimonial",
      contentType: ContentType.TESTIMONIAL,
      version: 1,
      testimonial: {
        id: "t_1",
        verificationStatus: "UNVERIFIED", // Unverified!
        clientConsentStatus: "GRANTED",
      },
    };
    const mockRevision = {
      id: "rev_test",
      contentItemId: "ci_test_1",
      revisionStatus: "APPROVED",
      snapshotData: {
        clientName: "John Doe",
        clientRole: "CTO",
        clientCompany: "Acme Corp",
        content: "Outstanding web engineering and delivery speed.",
        rating: 5,
      },
    };

    (prisma as any).contentItem.findUnique.mockResolvedValueOnce(mockItem);
    (prisma as any).contentRevision.findUnique.mockResolvedValueOnce(mockRevision);

    await expect(
      publishContentItem({
        contentItemId: "ci_test_1",
        revisionId: "rev_test",
        expectedVersion: 1,
        actor: mockSuperAdmin,
      })
    ).rejects.toThrow(PreconditionFailedError);
  });

  it("Safeguard 4: aborts with PreconditionFailedError when testimonial consent is PENDING", async () => {
    const mockItem = {
      id: "ci_test_1",
      slug: "john-doe-testimonial",
      contentType: ContentType.TESTIMONIAL,
      version: 1,
      testimonial: {
        id: "t_1",
        verificationStatus: "VERIFIED",
        clientConsentStatus: "PENDING", // Consent pending!
      },
    };
    const mockRevision = {
      id: "rev_test",
      contentItemId: "ci_test_1",
      revisionStatus: "APPROVED",
      snapshotData: {
        clientName: "John Doe",
        clientRole: "CTO",
        clientCompany: "Acme Corp",
        content: "Outstanding web engineering and delivery speed.",
        rating: 5,
      },
    };

    (prisma as any).contentItem.findUnique.mockResolvedValueOnce(mockItem);
    (prisma as any).contentRevision.findUnique.mockResolvedValueOnce(mockRevision);

    await expect(
      publishContentItem({
        contentItemId: "ci_test_1",
        revisionId: "rev_test",
        expectedVersion: 1,
        actor: mockSuperAdmin,
      })
    ).rejects.toThrow(PreconditionFailedError);
  });

  it("Steps 6-9: executes complete atomic publication, promoting pointers, updating domain, and logging audit event", async () => {
    const mockItem = {
      id: "ci_svc_1",
      slug: "nextjs-web-development",
      contentType: ContentType.SERVICE,
      version: 1,
      currentPublishedRevisionId: "rev_old_published",
    };
    const mockRevision = {
      id: "rev_new_promoted",
      contentItemId: "ci_svc_1",
      revisionStatus: "WORKING_DRAFT",
      snapshotData: validServiceSnapshot,
    };

    (prisma as any).contentItem.findUnique.mockResolvedValueOnce(mockItem);
    (prisma as any).contentRevision.findUnique.mockResolvedValueOnce(mockRevision);
    (prisma as any).contentItem.update.mockResolvedValueOnce({
      ...mockItem,
      version: 2,
      currentPublishedRevisionId: "rev_new_promoted",
      publicationStatus: "PUBLISHED",
    });

    const result = await publishContentItem({
      contentItemId: "ci_svc_1",
      revisionId: "rev_new_promoted",
      expectedVersion: 1,
      actor: mockAdmin,
      changeSummary: "Promoting updated service deliverables",
    });

    expect(result.contentItemId).toBe("ci_svc_1");
    expect(result.publishedRevisionId).toBe("rev_new_promoted");
    expect(result.version).toBe(2);

    // Verify domain upsert was called
    expect((prisma as any).service.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contentItemId: "ci_svc_1" },
        update: expect.objectContaining({
          title: "Next.js Web Development",
          isActive: true,
        }),
      })
    );

    // Verify previously published revision was superseded
    expect((prisma as any).contentRevision.update).toHaveBeenCalledWith({
      where: { id: "rev_old_published" },
      data: { revisionStatus: "SUPERSEDED" },
    });

    // Verify new revision became PUBLISHED_SNAPSHOT
    expect((prisma as any).contentRevision.update).toHaveBeenCalledWith({
      where: { id: "rev_new_promoted" },
      data: {
        revisionStatus: "PUBLISHED_SNAPSHOT",
        isPublishedSnapshot: true,
      },
    });

    // Verify audit log was created
    expect((prisma as any).auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "CONTENT_PUBLISHED",
          entity: "ContentItem",
          entityId: "ci_svc_1",
          actorId: mockAdmin.id,
        }),
      })
    );
  });

  it("archiveContentItem: deactivates domain record and advances item to ARCHIVED with OCC check", async () => {
    const mockItem = {
      id: "ci_svc_1",
      contentType: ContentType.SERVICE,
      version: 2,
    };

    (prisma as any).contentItem.findUnique.mockResolvedValueOnce(mockItem);
    (prisma as any).contentItem.update.mockResolvedValueOnce({
      ...mockItem,
      version: 3,
      publicationStatus: "ARCHIVED",
    });

    const result = await archiveContentItem({
      contentItemId: "ci_svc_1",
      expectedVersion: 2,
      actor: mockAdmin,
      reason: "Service sunsetted",
    });

    expect(result.contentItemId).toBe("ci_svc_1");
    expect(result.version).toBe(3);

    expect((prisma as any).service.updateMany).toHaveBeenCalledWith({
      where: { contentItemId: "ci_svc_1" },
      data: { isActive: false },
    });

    expect((prisma as any).auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "CONTENT_ARCHIVED",
          entity: "ContentItem",
        }),
      })
    );
  });
});
