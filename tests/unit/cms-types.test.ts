import { describe, it, expect } from "vitest";
import {
  ContentType,
  ContentPublicationStatus,
  RevisionLifecycleStatus,
  TestimonialVerificationStatus,
  ClientConsentStatus,
  StorageProviderType,
} from "@/types/cms";
import type {
  ContentItem,
  ContentRevision,
  PageSection,
  Testimonial,
  MediaAsset,
  ContentItemWithRevisions,
  CmsOperationResult,
} from "@/types/cms";
import type { Service, PricingPackage, PortfolioProject, FAQ } from "@prisma/client";

describe("CMS Types & Generated Prisma Client Verification (Task 10.1.3)", () => {
  it("verifies all 6 CMS Enums have expected runtime values", () => {
    // 1. ContentType
    expect(ContentType.SERVICE).toBe("SERVICE");
    expect(ContentType.PRICING_PACKAGE).toBe("PRICING_PACKAGE");
    expect(ContentType.PORTFOLIO_PROJECT).toBe("PORTFOLIO_PROJECT");
    expect(ContentType.FAQ).toBe("FAQ");
    expect(ContentType.PAGE_SECTION).toBe("PAGE_SECTION");
    expect(ContentType.TESTIMONIAL).toBe("TESTIMONIAL");

    // 2. ContentPublicationStatus
    expect(ContentPublicationStatus.DRAFT).toBe("DRAFT");
    expect(ContentPublicationStatus.REVIEW).toBe("REVIEW");
    expect(ContentPublicationStatus.PUBLISHED).toBe("PUBLISHED");
    expect(ContentPublicationStatus.ARCHIVED).toBe("ARCHIVED");

    // 3. RevisionLifecycleStatus
    expect(RevisionLifecycleStatus.WORKING_DRAFT).toBe("WORKING_DRAFT");
    expect(RevisionLifecycleStatus.PENDING_REVIEW).toBe("PENDING_REVIEW");
    expect(RevisionLifecycleStatus.APPROVED).toBe("APPROVED");
    expect(RevisionLifecycleStatus.PUBLISHED_SNAPSHOT).toBe("PUBLISHED_SNAPSHOT");
    expect(RevisionLifecycleStatus.SUPERSEDED).toBe("SUPERSEDED");
    expect(RevisionLifecycleStatus.REJECTED).toBe("REJECTED");

    // 4. TestimonialVerificationStatus
    expect(TestimonialVerificationStatus.UNVERIFIED).toBe("UNVERIFIED");
    expect(TestimonialVerificationStatus.VERIFIED).toBe("VERIFIED");
    expect(TestimonialVerificationStatus.REJECTED).toBe("REJECTED");

    // 5. ClientConsentStatus
    expect(ClientConsentStatus.PENDING).toBe("PENDING");
    expect(ClientConsentStatus.GRANTED).toBe("GRANTED");
    expect(ClientConsentStatus.REVOKED).toBe("REVOKED");

    // 6. StorageProviderType
    expect(StorageProviderType.LOCAL).toBe("LOCAL");
    expect(StorageProviderType.R2).toBe("R2");
  });

  it("verifies ContentItem interface structure and dual revision pointers", () => {
    const item: ContentItem = {
      id: "test-item-id",
      slug: "web-development",
      contentType: ContentType.SERVICE,
      version: 1,
      publicationStatus: ContentPublicationStatus.PUBLISHED,
      currentPublishedRevisionId: "rev-published-id",
      currentWorkingRevisionId: "rev-working-id",
      publishedAt: new Date(),
      publishedById: "admin-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(item.id).toBe("test-item-id");
    expect(item.contentType).toBe("SERVICE");
    expect(item.currentPublishedRevisionId).toBe("rev-published-id");
    expect(item.currentWorkingRevisionId).toBe("rev-working-id");
  });

  it("verifies ContentRevision interface structure and immutable snapshot fields", () => {
    const revision: ContentRevision = {
      id: "rev-id",
      contentItemId: "test-item-id",
      versionNumber: 1,
      revisionStatus: RevisionLifecycleStatus.PUBLISHED_SNAPSHOT,
      isPublishedSnapshot: true,
      title: "Web Development Services",
      snapshotData: { title: "Web Dev", price: 15000 },
      authorId: "admin-id",
      authorName: "Super Admin",
      changeSummary: "Initial publication",
      rejectionNote: null,
      createdAt: new Date(),
    };

    expect(revision.isPublishedSnapshot).toBe(true);
    expect(revision.versionNumber).toBe(1);
    expect(revision.snapshotData).toEqual({ title: "Web Dev", price: 15000 });
  });

  it("verifies PageSection, Testimonial, and MediaAsset interface structures", () => {
    const section: PageSection = {
      id: "sec-id",
      contentItemId: "item-id",
      key: "hero-intro",
      pageSlug: "home",
      title: "Hero Title",
      subtitle: "Hero Subtitle",
      content: "Main markdown content",
      metadata: null,
      mediaUrl: "/images/hero.webp",
      isActive: true,
      orderIndex: 0,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(section.key).toBe("hero-intro");

    const testimonial: Testimonial = {
      id: "test-id",
      contentItemId: "item-id",
      clientName: "John Doe",
      clientRole: "CTO",
      clientCompany: "Acme Corp",
      content: "Exceptional engineering and execution.",
      rating: 5,
      avatarUrl: "/avatars/john.webp",
      projectSlug: "acme-portal",
      verificationStatus: TestimonialVerificationStatus.VERIFIED,
      verifiedById: "admin-id",
      verifiedAt: new Date(),
      clientConsentStatus: ClientConsentStatus.GRANTED,
      clientConsentRecordedAt: new Date(),
      consentEvidenceUrl: "https://evidence.example.com/consent.pdf",
      orderIndex: 0,
      isActive: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(testimonial.verificationStatus).toBe("VERIFIED");
    expect(testimonial.clientConsentStatus).toBe("GRANTED");

    const media: MediaAsset = {
      id: "media-id",
      storageKey: "uploads/2026/hero.webp",
      provider: StorageProviderType.LOCAL,
      filename: "hero.webp",
      originalName: "hero-raw.png",
      mimeType: "image/webp",
      sizeBytes: 1048576,
      width: 1920,
      height: 1080,
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      isSvg: false,
      publicUrl: "/uploads/2026/hero.webp",
      defaultAltText: "Hero Banner",
      caption: null,
      uploaderId: "admin-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(media.isSvg).toBe(false);
    expect(media.provider).toBe("LOCAL");
  });

  it("verifies existing domain models contain nullable contentItemId and publishedAt", () => {
    // Type-level assertion on domain models
    const servicePartial: Partial<Service> = {
      contentItemId: "item-id",
      publishedAt: new Date(),
    };
    const pricingPartial: Partial<PricingPackage> = {
      contentItemId: "item-id",
      publishedAt: new Date(),
    };
    const portfolioPartial: Partial<PortfolioProject> = {
      contentItemId: "item-id",
      publishedAt: new Date(),
    };
    const faqPartial: Partial<FAQ> = {
      contentItemId: "item-id",
      publishedAt: new Date(),
    };

    expect(servicePartial.contentItemId).toBe("item-id");
    expect(pricingPartial.contentItemId).toBe("item-id");
    expect(portfolioPartial.contentItemId).toBe("item-id");
    expect(faqPartial.contentItemId).toBe("item-id");
  });

  it("verifies composite DTO types and operation envelopes", () => {
    const compositeItem: Partial<ContentItemWithRevisions> = {
      id: "item-id",
      slug: "cloud-architecture",
      revisions: [],
      currentPublishedRevision: null,
      currentWorkingRevision: null,
    };
    expect(compositeItem.slug).toBe("cloud-architecture");

    const opResult: CmsOperationResult<{ count: number }> = {
      success: true,
      data: { count: 5 },
      source: "database",
      isFallback: false,
    };
    expect(opResult.success).toBe(true);
    expect(opResult.source).toBe("database");
  });
});
