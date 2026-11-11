/**
 * VOIDTECH SOLUTION — Post-Deployment Remote Database Verification
 * 
 * Validates the remote PostgreSQL database state following owner execution of:
 *   npx prisma migrate deploy
 *   npm run db:seed
 * 
 * Read-only script. Never modifies tables, never exposes credentials, never sends emails.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sanitize error messages: strip any connection strings, URLs, or potential passwords
function sanitizeError(err: unknown): string {
  if (!err) return "Unknown error";
  let msg = err instanceof Error ? err.message : String(err);
  msg = msg.replace(/(postgres(?:ql)?:\/\/)([^:@\s]+):([^:@\s]+)@([^/\s:]+)(:\d+)?(\/[^\s\?]*)?(\?[^\s]*)?/gi, "$1***:***@$4$5$6$7");
  msg = msg.replace(/(password|pass|secret|key)=([^&\s]+)/gi, "$1=***");
  return msg;
}

interface VerificationRow {
  category: string;
  item: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL" | "WARN" | "INFO";
}

async function main() {
  console.log("================================================================================");
  console.log("VOIDTECH SOLUTION — DATABASE DEPLOYMENT VERIFICATION");
  console.log("Brand Tagline: Build. Launch. Grow Online.");
  console.log("================================================================================\n");

  const results: VerificationRow[] = [];
  let hasCriticalFailure = false;

  try {
    // ----------------------------------------------------------------------------
    // 1. Table Presence in 'public' Schema
    // ----------------------------------------------------------------------------
    console.log("1. Inspecting PostgreSQL Schema Tables...");
    const expectedTables = [
      "admin_users",
      "audit_logs",
      "email_deliveries",
      "enquiries",
      "faqs",
      "otp_verifications",
      "portfolio_projects",
      "pricing_packages",
      "services",
      "site_settings",
    ];

    const tablesInDb = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const foundTableNames = new Set(tablesInDb.map((t) => t.table_name));

    for (const tableName of expectedTables) {
      const exists = foundTableNames.has(tableName);
      results.push({
        category: "1. Tables",
        item: `public.${tableName}`,
        expected: "Present",
        actual: exists ? "Present" : "MISSING",
        status: exists ? "PASS" : "FAIL",
      });
      if (!exists) hasCriticalFailure = true;
    }

    // ----------------------------------------------------------------------------
    // 2. Prisma Migration History
    // ----------------------------------------------------------------------------
    console.log("2. Inspecting _prisma_migrations Record...");
    const hasMigrationsTable = foundTableNames.has("_prisma_migrations");
    results.push({
      category: "2. Migration Table",
      item: "public._prisma_migrations",
      expected: "Present",
      actual: hasMigrationsTable ? "Present" : "MISSING",
      status: hasMigrationsTable ? "PASS" : "FAIL",
    });

    if (hasMigrationsTable) {
      const migrations = await prisma.$queryRaw<
        Array<{
          migration_name: string;
          finished_at: Date | null;
          applied_steps_count: number;
        }>
      >`
        SELECT migration_name, finished_at, applied_steps_count 
        FROM "_prisma_migrations" 
        ORDER BY started_at ASC;
      `;

      const initMigration = migrations.find((m) => m.migration_name.toLowerCase().includes("init"));
      const isInitApplied = !!(initMigration && initMigration.finished_at && initMigration.applied_steps_count > 0);

      results.push({
        category: "2. Migration History",
        item: "Initial Migration (_init)",
        expected: "Applied & Finished",
        actual: initMigration
          ? `${initMigration.migration_name} (Steps: ${initMigration.applied_steps_count})`
          : "NOT RECORDED",
        status: isInitApplied ? "PASS" : "FAIL",
      });
      if (!isInitApplied) hasCriticalFailure = true;
    } else {
      hasCriticalFailure = true;
    }

    // ----------------------------------------------------------------------------
    // 3. Prisma Client Delegates Confirmation
    // ----------------------------------------------------------------------------
    console.log("3. Confirming Generated Prisma Delegates...");
    const delegates = [
      { name: "prisma.enquiry", delegate: prisma.enquiry },
      { name: "prisma.service", delegate: prisma.service },
      { name: "prisma.portfolioProject", delegate: prisma.portfolioProject },
      { name: "prisma.adminUser", delegate: prisma.adminUser },
      { name: "prisma.pricingPackage", delegate: prisma.pricingPackage },
      { name: "prisma.fAQ", delegate: prisma.fAQ },
      { name: "prisma.siteSetting", delegate: prisma.siteSetting },
      { name: "prisma.auditLog", delegate: prisma.auditLog },
      { name: "prisma.otpVerification", delegate: prisma.otpVerification },
      { name: "prisma.emailDelivery", delegate: prisma.emailDelivery },
    ];

    for (const d of delegates) {
      const isReady = typeof d.delegate?.count === "function";
      results.push({
        category: "3. Prisma Delegates",
        item: d.name,
        expected: "Function (count/findMany)",
        actual: isReady ? "Available" : "UNAVAILABLE",
        status: isReady ? "PASS" : "FAIL",
      });
      if (!isReady) hasCriticalFailure = true;
    }

    // ----------------------------------------------------------------------------
    // 4. Seeded Data Counts Verification
    // ----------------------------------------------------------------------------
    console.log("4. Verifying Seeded Content Counts...");

    // 18 Registered Services
    const serviceCount = await prisma.service.count();
    const servicePass = serviceCount === 18;
    results.push({
      category: "4. Seed Counts",
      item: "Business Services",
      expected: "18",
      actual: String(serviceCount),
      status: servicePass ? "PASS" : "FAIL",
    });
    if (!servicePass) hasCriticalFailure = true;

    // 10 Approved Pricing Packages
    const pkgCount = await prisma.pricingPackage.count();
    const pkgPass = pkgCount === 10;
    results.push({
      category: "4. Seed Counts",
      item: "Pricing Packages (INR)",
      expected: "10",
      actual: String(pkgCount),
      status: pkgPass ? "PASS" : "FAIL",
    });
    if (!pkgPass) hasCriticalFailure = true;

    // 5 Baseline FAQs (Note delegate name: prisma.fAQ)
    const faqCount = await prisma.fAQ.count();
    const faqPass = faqCount === 5;
    results.push({
      category: "4. Seed Counts",
      item: "Baseline FAQs",
      expected: "5",
      actual: String(faqCount),
      status: faqPass ? "PASS" : "FAIL",
    });
    if (!faqPass) hasCriticalFailure = true;

    // 5 Baseline Site Settings
    const settingCount = await prisma.siteSetting.count();
    const settingPass = settingCount === 5;
    results.push({
      category: "4. Seed Counts",
      item: "Site Settings",
      expected: "5",
      actual: String(settingCount),
      status: settingPass ? "PASS" : "FAIL",
    });
    if (!settingPass) hasCriticalFailure = true;

    // 2 Portfolio Concepts (Concept Lab Architecture Prototypes)
    const conceptProjectsCount = await prisma.portfolioProject.count({
      where: { projectType: "CONCEPT" },
    });
    const portfolioPass = conceptProjectsCount === 2;
    results.push({
      category: "4. Seed Counts",
      item: "Portfolio Concepts (CONCEPT)",
      expected: "2",
      actual: String(conceptProjectsCount),
      status: portfolioPass ? "PASS" : "FAIL",
    });
    if (!portfolioPass) hasCriticalFailure = true;

    // Enquiries: 0 before any controlled test submission
    const enquiryCount = await prisma.enquiry.count();
    const enquiryStatus = enquiryCount === 0 ? "PASS" : "INFO";
    results.push({
      category: "4. Seed Counts",
      item: "Enquiries (Pre-test)",
      expected: "0",
      actual: String(enquiryCount),
      status: enquiryStatus,
    });

    // Admin Users: 0 (Strict Phase 7 Boundary Enforcement)
    const adminCount = await prisma.adminUser.count();
    const adminPass = adminCount === 0;
    results.push({
      category: "4. Boundary Check",
      item: "Admin Users (Phase 7 Boundary)",
      expected: "0",
      actual: String(adminCount),
      status: adminPass ? "PASS" : "WARN",
    });

  } catch (err) {
    hasCriticalFailure = true;
    console.error("❌ Fatal verification error:", sanitizeError(err));
  } finally {
    await prisma.$disconnect();
  }

  // ----------------------------------------------------------------------------
  // Render Summary Table
  // ----------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("VERIFICATION MATRIX");
  console.log("================================================================================");
  console.log(
    "Category".padEnd(20) +
    " | " +
    "Item".padEnd(30) +
    " | " +
    "Expected".padEnd(16) +
    " | " +
    "Actual".padEnd(16) +
    " | Status"
  );
  console.log("-".repeat(95));

  for (const r of results) {
    const statusFormatted =
      r.status === "PASS"
        ? "\x1b[32mPASS\x1b[0m"
        : r.status === "FAIL"
        ? "\x1b[31mFAIL\x1b[0m"
        : r.status === "WARN"
        ? "\x1b[33mWARN\x1b[0m"
        : "\x1b[36mINFO\x1b[0m";

    console.log(
      r.category.padEnd(20) +
      " | " +
      r.item.padEnd(30) +
      " | " +
      r.expected.padEnd(16) +
      " | " +
      r.actual.padEnd(16) +
      " | " +
      statusFormatted
    );
  }
  console.log("================================================================================\n");

  if (hasCriticalFailure) {
    console.error("❌ CRITICAL CHECKS FAILED. Please inspect the matrix above before proceeding.\n");
    process.exit(1);
  } else {
    console.log("✅ ALL DATABASE CHECKS PASSED.");
    console.log("The remote PostgreSQL database is structurally synchronized and ready for controlled test enquiry submission.\n");
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("Unhandled verification exception:", sanitizeError(e));
  process.exit(1);
});
