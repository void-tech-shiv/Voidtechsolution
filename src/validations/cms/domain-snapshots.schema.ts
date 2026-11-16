import { z } from "zod";
import { ServiceCategory } from "@prisma/client";

/**
 * VOIDTECH SOLUTION — CMS Domain Snapshot Schemas
 * 
 * Strict runtime validation schemas for content snapshot payloads.
 * Enforces field constraints and sanitization before domain materialization.
 */

export const serviceSnapshotSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
    shortDesc: z.string().trim().min(5, "Short description must be at least 5 characters").max(500),
    fullDesc: z.string().trim().min(10, "Full description must be at least 10 characters").max(10000),
    icon: z.string().trim().default("Code"),
    category: z.nativeEnum(ServiceCategory),
    deliverables: z
      .array(z.string().trim().min(1))
      .min(1, "At least one deliverable is required"),
    technologies: z
      .array(z.string().trim().min(1))
      .min(1, "At least one technology is required"),
    startingPriceInr: z.number().int().nonnegative().nullable().optional(),
    currency: z.string().trim().default("INR"),
    isFeatured: z.boolean().default(false),
    orderIndex: z.number().int().default(0),
  })
  .strict();

export type ServiceSnapshot = z.infer<typeof serviceSnapshotSchema>;

export const pricingPackageSnapshotSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    category: z.nativeEnum(ServiceCategory).default(ServiceCategory.WEB_DEVELOPMENT),
    priceInr: z.number().int().nonnegative("Price in INR must be non-negative"),
    currency: z.literal("INR").default("INR"),
    isStartingPrice: z.boolean().default(true),
    billingPeriod: z.string().trim().max(50).nullable().optional(),
    features: z
      .array(z.string().trim().min(1))
      .min(1, "At least one feature is required"),
    popular: z.boolean().default(false),
    orderIndex: z.number().int().default(0),
  })
  .strict();

export type PricingPackageSnapshot = z.infer<typeof pricingPackageSnapshotSchema>;

export const portfolioProjectSnapshotSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
    clientName: z.string().trim().min(2, "Client name must be at least 2 characters").max(100),
    industry: z.string().trim().min(2, "Industry must be at least 2 characters").max(100),
    summary: z.string().trim().min(10, "Summary must be at least 10 characters").max(500),
    challenge: z.string().trim().min(10, "Challenge must be at least 10 characters").max(10000),
    solution: z.string().trim().min(10, "Solution must be at least 10 characters").max(10000),
    results: z.string().trim().min(10, "Results must be at least 10 characters").max(10000),
    techStack: z
      .array(z.string().trim().min(1))
      .min(1, "At least one tech stack item is required"),
    metrics: z.any().optional(),
    heroImage: z.string().trim().nullable().optional(),
    liveUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
    githubUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
    projectType: z.enum(["CONCEPT", "INTERNAL_PROTOTYPE", "PRODUCTION"]).default("CONCEPT"),
    isFeatured: z.boolean().default(false),
    orderIndex: z.number().int().default(0),
  })
  .strict();

export type PortfolioProjectSnapshot = z.infer<typeof portfolioProjectSnapshotSchema>;

export const faqSnapshotSchema = z
  .object({
    question: z.string().trim().min(5, "Question must be at least 5 characters").max(300),
    answer: z.string().trim().min(10, "Answer must be at least 10 characters").max(5000),
    category: z.string().trim().min(2).max(100).default("GENERAL"),
    orderIndex: z.number().int().default(0),
  })
  .strict();

export type FAQSnapshot = z.infer<typeof faqSnapshotSchema>;

export const pageSectionSnapshotSchema = z
  .object({
    key: z.string().trim().min(2, "Key must be at least 2 characters").max(100),
    pageSlug: z.string().trim().min(1, "Page slug must be at least 1 character").max(100),
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
    subtitle: z.string().trim().max(300).nullable().optional(),
    content: z.string().trim().min(1, "Content cannot be empty"),
    metadata: z.any().optional(),
    mediaUrl: z.string().trim().nullable().optional(),
    orderIndex: z.number().int().default(0),
  })
  .strict();

export type PageSectionSnapshot = z.infer<typeof pageSectionSnapshotSchema>;

export const testimonialSnapshotSchema = z
  .object({
    clientName: z.string().trim().min(2, "Client name must be at least 2 characters").max(100),
    clientRole: z.string().trim().min(2, "Client role must be at least 2 characters").max(100),
    clientCompany: z.string().trim().min(2, "Client company must be at least 2 characters").max(100),
    content: z.string().trim().min(10, "Testimonial content must be at least 10 characters").max(2000),
    rating: z.number().int().min(1).max(5).default(5),
    avatarUrl: z.string().trim().nullable().optional(),
    projectSlug: z.string().trim().nullable().optional(),
    orderIndex: z.number().int().default(0),
  })
  .strict();

export type TestimonialSnapshot = z.infer<typeof testimonialSnapshotSchema>;

