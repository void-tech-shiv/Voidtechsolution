-- ==============================================================================
-- VOIDTECH SOLUTION — Initial Complete Schema Migration
-- Migration: 20261112000000_init
-- Target Engine: PostgreSQL 14+ (Compatible with PostgreSQL 18.6)
-- Status: PROPOSED ONLY (Read-Only Safety Enforcement)
-- ==============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- ------------------------------------------------------------------------------
-- 1. CUSTOM ENUMS
-- ------------------------------------------------------------------------------

-- CreateEnum: EnquiryStatus
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'CONTACTED', 'CONVERTED', 'ARCHIVED');

-- CreateEnum: ServiceCategory
CREATE TYPE "ServiceCategory" AS ENUM ('WEB_DEVELOPMENT', 'MOBILE_DEVELOPMENT', 'API_BACKEND', 'AI_AUTOMATION', 'BOTS_AUTOMATION', 'DESIGN_CREATIVE', 'ENTERPRISE_SYSTEMS', 'FINTECH_PAYMENTS', 'CLOUD_HOSTING', 'OTHER');

-- CreateEnum: UserRole
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');

-- CreateEnum: OtpPurpose
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'PASSWORD_RESET', 'ENQUIRY_VERIFICATION', 'ADMIN_ACTION');

-- CreateEnum: EmailDeliveryStatus
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- ------------------------------------------------------------------------------
-- 2. APPLICATION TABLES
-- ------------------------------------------------------------------------------

-- Table: enquiries
-- Inbound client lead enquiries with privacy-safe consent tracking (consentGiven is nullable)
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "companyName" TEXT,
    "serviceCategory" "ServiceCategory" NOT NULL DEFAULT 'WEB_DEVELOPMENT',
    "budgetRange" TEXT,
    "timeline" TEXT,
    "message" TEXT NOT NULL,
    "selectedPackage" TEXT,
    "additionalConfig" JSONB,
    "referenceUrl" TEXT,
    "consentGiven" BOOLEAN,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- Table: services
-- Agency services catalog (18 offerings)
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "fullDesc" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Code',
    "category" "ServiceCategory" NOT NULL,
    "deliverables" TEXT[],
    "technologies" TEXT[],
    "startingPriceInr" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- Table: portfolio_projects
-- Agency portfolio projects & case studies (Concept Lab / Production)
CREATE TABLE "portfolio_projects" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "techStack" TEXT[],
    "metrics" JSONB,
    "heroImage" TEXT,
    "liveUrl" TEXT,
    "githubUrl" TEXT,
    "projectType" TEXT NOT NULL DEFAULT 'CONCEPT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY ("id")
);

-- Table: admin_users
-- Administrator credentials and RBAC
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- Table: pricing_packages
-- 10 Approved INR Pricing Tiers
CREATE TABLE "pricing_packages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL DEFAULT 'WEB_DEVELOPMENT',
    "priceInr" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isStartingPrice" BOOLEAN NOT NULL DEFAULT true,
    "billingPeriod" TEXT,
    "features" TEXT[],
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_packages_pkey" PRIMARY KEY ("id")
);

-- Table: faqs
-- Frequently Asked Questions
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- Table: site_settings
-- System and website key-value settings
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- Table: audit_logs
-- Immutable security and admin activity logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Table: otp_verifications
-- Cryptographic OTP tokens with salt/pepper hashing and cooldowns
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'LOGIN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "resendAvailableAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- Table: email_deliveries
-- Transactional email delivery audit and status tracking
CREATE TABLE "email_deliveries" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "failureCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES & CONSTRAINTS
-- ------------------------------------------------------------------------------

-- enquiries indexes
CREATE INDEX "enquiries_status_idx" ON "enquiries"("status");
CREATE INDEX "enquiries_email_idx" ON "enquiries"("email");
CREATE INDEX "enquiries_createdAt_idx" ON "enquiries"("createdAt");

-- services indexes & uniques
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");
CREATE INDEX "services_category_idx" ON "services"("category");
CREATE INDEX "services_isActive_orderIndex_idx" ON "services"("isActive", "orderIndex");

-- portfolio_projects indexes & uniques
CREATE UNIQUE INDEX "portfolio_projects_slug_key" ON "portfolio_projects"("slug");
CREATE INDEX "portfolio_projects_isFeatured_orderIndex_idx" ON "portfolio_projects"("isFeatured", "orderIndex");
CREATE INDEX "portfolio_projects_projectType_idx" ON "portfolio_projects"("projectType");

-- admin_users indexes & uniques
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- pricing_packages indexes & uniques
CREATE UNIQUE INDEX "pricing_packages_slug_key" ON "pricing_packages"("slug");
CREATE INDEX "pricing_packages_isActive_orderIndex_idx" ON "pricing_packages"("isActive", "orderIndex");
CREATE INDEX "pricing_packages_category_idx" ON "pricing_packages"("category");

-- faqs indexes
CREATE INDEX "faqs_category_idx" ON "faqs"("category");
CREATE INDEX "faqs_isActive_orderIndex_idx" ON "faqs"("isActive", "orderIndex");

-- site_settings indexes & uniques
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");

-- audit_logs indexes
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- otp_verifications indexes
CREATE INDEX "otp_verifications_identifier_purpose_idx" ON "otp_verifications"("identifier", "purpose");
CREATE INDEX "otp_verifications_expiresAt_idx" ON "otp_verifications"("expiresAt");
CREATE INDEX "otp_verifications_createdAt_idx" ON "otp_verifications"("createdAt");

-- email_deliveries indexes
CREATE INDEX "email_deliveries_recipient_idx" ON "email_deliveries"("recipient");
CREATE INDEX "email_deliveries_status_idx" ON "email_deliveries"("status");
CREATE INDEX "email_deliveries_template_idx" ON "email_deliveries"("template");
CREATE INDEX "email_deliveries_createdAt_idx" ON "email_deliveries"("createdAt");

