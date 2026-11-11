import type { EnquiryStatus, ServiceCategory, UserRole, Prisma } from "@prisma/client";

export type { EnquiryStatus, ServiceCategory, UserRole };

/**
 * Standard API response envelope for all Next.js route handlers
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Navigation item structure
 */
export interface NavItem {
  title: string;
  href: string;
  description?: string;
  isExternal?: boolean;
}

/**
 * Registered Business Service definition
 */
export interface ServiceDefinition {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  shortDescription: string;
  fullDescription: string;
  deliverables: string[];
  technologies: string[];
  startingPriceInr?: number;
  currency?: string;
  iconName: string;
  isFeatured: boolean;
}

/**
 * Approved Pricing Package definition
 */
export interface PricingPackageDefinition {
  id?: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  priceInr: number;
  currency: string;
  isStartingPrice: boolean;
  billingPeriod?: string;
  features: string[];
  popular: boolean;
  orderIndex: number;
}

/**
 * Lead enquiry submission payload
 */
export interface EnquiryInput {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  serviceCategory: ServiceCategory;
  budgetRange?: string;
  timeline?: string;
  message: string;
  selectedPackage?: string;
  additionalConfig?: Prisma.InputJsonValue;
  referenceUrl?: string;
  consentGiven?: boolean;
}

/**
 * Admin Session User
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

