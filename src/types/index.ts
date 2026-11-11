import type { EnquiryStatus, ServiceCategory, UserRole } from "@prisma/client";

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
  startingPriceUsd?: number;
  iconName: string;
  isFeatured: boolean;
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
