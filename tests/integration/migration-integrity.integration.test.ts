import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

/**
 * VOIDTECH SOLUTION — Neon Migration Package Integrity & Repeatability Test Suite
 * 
 * Verifies:
 * 1. Pre-flight isolation & fail-closed behavior:
 *    - Parses TEST_DATABASE_URL strictly with URL parser.
 *    - Validates exact database name ('voidtech_test_concurrency').
 *    - Validates exact host ('localhost' or '127.0.0.1') and port ('5432').
 *    - Strictly rejects any remote or Neon endpoint (*.neon.tech).
 *    - Fails closed immediately if DB is unreachable (zero silent passes).
 *    - Always restores PostgreSQL session settings (session_replication_role) in finally.
 * 2. Actual Migration SQL Execution (MIG-01 & MIG-02):
 *    - Parses and executes the actual SQL statements from:
 *      prisma/migrations/20261113000000_crm_lead_pipeline/migration.sql
 *      prisma/migrations/20261113010000_crm_status_mapping_correction/migration.sql
 *    - Asserts resulting statuses for NEW, IN_REVIEW, CONTACTED, CONVERTED, ARCHIVED.
 *    - Asserts that all unrelated fields (name, email, phone, company, message, etc.) remain intact.
 *    - Verifies CLOSED fallback handling.
 * 3. Full CMS Migration Repeatability & Detailed Definitions (MIG-03 to MIG-08):
 *    - Executes all 63 DDL statements of 20261114000000_admin_cms_foundation from start to finish.
 *    - Replays the entire migration script again, proving 100% idempotency.
 *    - Validates exact FK definitions (table, column, foreign table, foreign column, delete_rule, update_rule).
 *    - Validates exact index definitions (columns and uniqueness in pg_indexes).
 *    - Tests CMS trigger enforcement (ownership rejection, published snapshot deletion guard, immutability guard).
 */

const RAW_TEST_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/voidtech_test_concurrency";

// Strict Fail-Closed URL Validation (Never logs passwords or raw strings)
function validateTestDatabaseUrl(rawUrl: string): { host: string; port: string; dbName: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("[SECURITY INTEGRITY VIOLATION] TEST_DATABASE_URL is not a valid parseable URL.");
  }

  // 1. Protocol check
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`[SECURITY INTEGRITY VIOLATION] Invalid protocol '${parsed.protocol}'. Only postgresql: is permitted.`);
  }

  // 2. Exact Host check (Must be strictly local)
  const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const host = parsed.hostname.toLowerCase();
  if (!allowedHosts.has(host)) {
    throw new Error(`[SECURITY INTEGRITY VIOLATION] Target host '${host}' is not permitted. Only localhost / 127.0.0.1 is permitted.`);
  }

  // 3. Strict Remote / Neon Host Reject
  if (host.includes("neon") || host.endsWith(".tech") || host.endsWith(".amazonaws.com")) {
    throw new Error(`[SECURITY INTEGRITY VIOLATION] Remote cloud database detected (${host}). Strictly prohibited.`);
  }

  // 4. Exact Port check
  const port = parsed.port || "5432";
  if (port !== "5432") {
    throw new Error(`[SECURITY INTEGRITY VIOLATION] Port '${port}' is not permitted. Only port 5432 is permitted.`);
  }

  // 5. Exact Database Name check
  const dbName = parsed.pathname.replace(/^\//, "");
  if (dbName !== "voidtech_test_concurrency") {
    throw new Error(`[SECURITY INTEGRITY VIOLATION] Database name '${dbName}' is not permitted. Must exactly equal 'voidtech_test_concurrency'.`);
  }

  return { host, port, dbName };
}

// Utility to parse SQL statements safely respecting $$ function blocks and string quotes
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (!inDollarQuote && char === "'" && (i === 0 || sql[i - 1] !== "\\")) {
      inSingleQuote = !inSingleQuote;
    }

    if (!inSingleQuote && char === "$" && nextChar === "$") {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      i++;
      continue;
    }

    if (char === ";" && !inDollarQuote && !inSingleQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = "";
    } else {
      current += char;
    }
  }

  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements.filter((s) => {
    const lines = s
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("--"));
    return lines.length > 0;
  });
}

describe("Neon Migration Verification & Integrity Closure Suite", () => {
  let db: PrismaClient;
  const testIds = {
    enquiryIds: [] as string[],
    contentItemIds: [] as string[],
    adminUserIds: [] as string[],
  };

  beforeAll(async () => {
    // 1. Strict pre-flight validation (Fails closed on any discrepancy)
    const { host, port, dbName } = validateTestDatabaseUrl(RAW_TEST_URL);

    // 2. Instantiate client
    db = new PrismaClient({
      datasources: { db: { url: RAW_TEST_URL } },
    });

    // 3. Connect and verify connectivity (Fail-closed: NO early returns, NO silent skips)
    try {
      await db.$queryRaw`SELECT 1 as health_check;`;
    } catch (err: any) {
      const sanitized = err && err.message ? err.message.replace(/postgresql:\/\/[^@\s]+@[^\s]+/gi, "postgresql://[REDACTED]") : "Connection failed";
      throw new Error(`[FAIL-CLOSED FATAL] Local PostgreSQL test database (${host}:${port}/${dbName}) is unavailable: ${sanitized}`);
    }
  });

  afterAll(async () => {
    if (db) {
      try {
        // Temporarily disable triggers for clean fixture removal
        await db.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

        if (testIds.contentItemIds.length > 0) {
          await db.$executeRawUnsafe(`
            UPDATE "content_items" 
            SET "currentPublishedRevisionId" = NULL, "currentWorkingRevisionId" = NULL 
            WHERE "id" = ANY($1::text[])
          `, testIds.contentItemIds);

          await db.$executeRawUnsafe(`
            DELETE FROM "content_revisions" WHERE "contentItemId" = ANY($1::text[])
          `, testIds.contentItemIds);

          await db.$executeRawUnsafe(`
            DELETE FROM "content_items" WHERE "id" = ANY($1::text[])
          `, testIds.contentItemIds);
        }

        if (testIds.enquiryIds.length > 0) {
          await db.$executeRawUnsafe(`
            DELETE FROM "enquiries" WHERE "id" = ANY($1::text[])
          `, testIds.enquiryIds);
        }

        if (testIds.adminUserIds.length > 0) {
          await db.$executeRawUnsafe(`
            DELETE FROM "admin_users" WHERE "id" = ANY($1::text[])
          `, testIds.adminUserIds);
        }
      } catch (err) {
        console.error("Cleanup error in migration-integrity test:", err);
      } finally {
        // ALWAYS restore session_replication_role even if cleanup queries fail
        try {
          await db.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
        } catch {
          // ignore session restore errors on disconnect
        }
        await db.$disconnect();
      }
    }
  });

  // ----------------------------------------------------------------------------
  // Finding A: Genuinely Isolated Legacy CRM Migration Fixture Test
  // ----------------------------------------------------------------------------
  it("MIG-01: Genuinely migrates legacy CRM schema and status values in an isolated PostgreSQL fixture", async () => {
    const ts = Date.now();
    const schemaName = `fixture_legacy_crm_${ts}`;

    const fixtureRecords = [
      {
        id: `enq_legacy_new_${ts}`,
        name: "Alice Inbound",
        email: `alice_${ts}@test.com`,
        phone: "+91 98765 00001",
        companyName: "Acme Startups",
        budgetRange: "₹50,000 - ₹1,00,000",
        timeline: "1 Month",
        message: "Original untouched message for NEW",
        serviceCategory: "WEB_DEVELOPMENT",
        initialStatus: "NEW",
        expectedStatus: "NEW",
        consentGiven: true,
        internalNotes: "Triage notes for Alice",
      },
      {
        id: `enq_legacy_review_${ts}`,
        name: "Bob UnderReview",
        email: `bob_${ts}@test.com`,
        phone: "+91 98765 00002",
        companyName: "Beta Technologies",
        budgetRange: "₹1,00,000 - ₹2,50,000",
        timeline: "2 Months",
        message: "Original untouched message for IN_REVIEW",
        serviceCategory: "MOBILE_DEVELOPMENT",
        initialStatus: "IN_REVIEW",
        expectedStatus: "CONTACTED",
        consentGiven: true,
        internalNotes: "Initial review conducted by sales team",
      },
      {
        id: `enq_legacy_contacted_${ts}`,
        name: "Carol Contacted",
        email: `carol_${ts}@test.com`,
        phone: "+91 98765 00003",
        companyName: "Gamma Enterprises",
        budgetRange: "₹2,50,000 - ₹5,00,000",
        timeline: "3 Months",
        message: "Original untouched message for CONTACTED",
        serviceCategory: "API_BACKEND",
        initialStatus: "CONTACTED",
        expectedStatus: "CONTACTED",
        consentGiven: false,
        internalNotes: "Follow-up email dispatched",
      },
      {
        id: `enq_legacy_converted_${ts}`,
        name: "Dave Converted",
        email: `dave_${ts}@test.com`,
        phone: "+91 98765 00004",
        companyName: "Delta Logistics",
        budgetRange: "₹5,00,000+",
        timeline: "Immediate",
        message: "Original untouched message for CONVERTED",
        serviceCategory: "ENTERPRISE_SYSTEMS",
        initialStatus: "CONVERTED",
        expectedStatus: "WON",
        consentGiven: true,
        internalNotes: "Contract signed, project onboarded",
      },
      {
        id: `enq_legacy_archived_${ts}`,
        name: "Eve Archived",
        email: `eve_${ts}@test.com`,
        phone: "+91 98765 00005",
        companyName: "Epsilon Media",
        budgetRange: "Under ₹50,000",
        timeline: "Flexible",
        message: "Original untouched message for ARCHIVED",
        serviceCategory: "DESIGN_CREATIVE",
        initialStatus: "ARCHIVED",
        expectedStatus: "ON_HOLD",
        consentGiven: null,
        internalNotes: "Dormant enquiry parked for future review",
      },
    ];

    try {
      // 1. Create genuinely isolated test schema
      await db.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}";`);
      await db.$executeRawUnsafe(`SET search_path = "${schemaName}", public;`);

      // 2. Construct authentic original pre-CRM legacy schema (from 20261112000000_init)
      await db.$executeRawUnsafe(`
        CREATE TYPE "${schemaName}"."EnquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'CONTACTED', 'CONVERTED', 'ARCHIVED');
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE "${schemaName}"."admin_users" (
          "id" TEXT PRIMARY KEY,
          "email" TEXT UNIQUE NOT NULL,
          "passwordHash" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "lastLoginAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE "${schemaName}"."enquiries" (
          "id" TEXT PRIMARY KEY,
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
          "status" "${schemaName}"."EnquiryStatus" NOT NULL DEFAULT 'NEW',
          "internalNotes" TEXT,
          "ipHash" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Insert genuine legacy records with authentic legacy enum values
      for (const rec of fixtureRecords) {
        await db.$executeRawUnsafe(`
          INSERT INTO "${schemaName}"."enquiries" (
            "id", "name", "email", "phone", "companyName", "budgetRange",
            "timeline", "message", "serviceCategory", "status", "consentGiven", "internalNotes", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9::"ServiceCategory", $10::"${schemaName}"."EnquiryStatus", $11, $12, NOW(), NOW()
          );
        `, rec.id, rec.name, rec.email, rec.phone, rec.companyName, rec.budgetRange, rec.timeline, rec.message, rec.serviceCategory, rec.initialStatus, rec.consentGiven, rec.internalNotes);
      }

      // Verify that all 5 records are inserted with their exact initial legacy statuses
      const preMigrationRows: any = await db.$queryRawUnsafe(`
        SELECT "id", "status"::text as status FROM "${schemaName}"."enquiries" ORDER BY "id";
      `);
      expect(preMigrationRows).toHaveLength(5);
      const preMap = new Map(preMigrationRows.map((r: any) => [r.id, r.status]));
      for (const rec of fixtureRecords) {
        expect(preMap.get(rec.id)).toBe(rec.initialStatus);
      }

      // 4. Read the ACTUAL migration SQL from disk
      const migPath1 = path.join(process.cwd(), "prisma/migrations/20261113000000_crm_lead_pipeline/migration.sql");
      const migPath2 = path.join(process.cwd(), "prisma/migrations/20261113010000_crm_status_mapping_correction/migration.sql");
      expect(fs.existsSync(migPath1)).toBe(true);
      expect(fs.existsSync(migPath2)).toBe(true);

      const migSql1 = fs.readFileSync(migPath1, "utf-8");
      const migSql2 = fs.readFileSync(migPath2, "utf-8");

      // 5. Execute Migration 1: DDL + note backfill (runs in search_path of schemaName)
      const stmts1 = splitSqlStatements(migSql1);
      expect(stmts1.length).toBeGreaterThanOrEqual(10);

      for (let i = 0; i < stmts1.length; i++) {
        const stmt = stmts1[i]!;
        try {
          await db.$executeRawUnsafe(stmt);
        } catch (err: any) {
          throw new Error(`[MIGRATION 1 EXECUTION FAILED] Statement #${i + 1} failed: ${err.message}\nSQL: ${stmt.slice(0, 100)}...`);
        }
      }

      // 6. Execute Migration 2: Status mapping data migration
      const stmts2 = splitSqlStatements(migSql2);
      expect(stmts2.length).toBe(4);

      for (let i = 0; i < stmts2.length; i++) {
        const stmt = stmts2[i]!;
        try {
          await db.$executeRawUnsafe(stmt);
        } catch (err: any) {
          throw new Error(`[MIGRATION 2 EXECUTION FAILED] Statement #${i + 1} failed: ${err.message}\nSQL: ${stmt.slice(0, 100)}...`);
        }
      }

      // 7. Verify all 5 records have their exact expected target statuses purely from migration SQL
      const postMigrationRows: any = await db.$queryRawUnsafe(`
        SELECT 
          "id", "name", "email", "phone", "companyName", "budgetRange",
          "timeline", "message", "serviceCategory"::text as category, "status"::text as status,
          "consentGiven", "assignedAdminId", "estimatedValueInr", "source", "lastContactedAt", "nextFollowUpAt", "lostReason"
        FROM "${schemaName}"."enquiries"
        ORDER BY "id";
      `);

      expect(postMigrationRows).toHaveLength(5);
      const postMap = new Map(postMigrationRows.map((r: any) => [r.id, r]));

      for (const rec of fixtureRecords) {
        const row: any = postMap.get(rec.id);
        expect(row).toBeDefined();

        // Assert that migration SQL (NOT manual updates) mapped the status correctly
        expect(row.status).toBe(rec.expectedStatus);

        // Assert 100% field preservation across all unrelated fields (zero data corruption)
        expect(row.name).toBe(rec.name);
        expect(row.email).toBe(rec.email);
        expect(row.phone).toBe(rec.phone);
        expect(row.companyName).toBe(rec.companyName);
        expect(row.budgetRange).toBe(rec.budgetRange);
        expect(row.timeline).toBe(rec.timeline);
        expect(row.message).toBe(rec.message);
        expect(row.category).toBe(rec.serviceCategory);
        expect(row.consentGiven).toBe(rec.consentGiven);

        // Assert CRM columns were provisioned with proper defaults
        expect(row.source).toBe("WEBSITE_CONTACT_FORM");
        expect(row.assignedAdminId).toBeNull();
        expect(row.estimatedValueInr).toBeNull();
      }

      // 8. Verify child CRM tables exist in the fixture schema
      const childTables: any = await db.$queryRawUnsafe(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name;
      `, schemaName);
      const tableNames = new Set(childTables.map((t: any) => t.table_name));

      expect(tableNames.has("lead_notes")).toBe(true);
      expect(tableNames.has("lead_follow_ups")).toBe(true);
      expect(tableNames.has("lead_activities")).toBe(true);
      expect(tableNames.has("lead_assignments")).toBe(true);
      expect(tableNames.has("admin_notifications")).toBe(true);

      // 9. Verify note backfill: All non-empty legacy internalNotes were backfilled into lead_notes
      const backfilledNotes: any = await db.$queryRawUnsafe(`
        SELECT "id", "enquiryId", "content"
        FROM "${schemaName}"."lead_notes"
        ORDER BY "enquiryId";
      `);
      expect(backfilledNotes.length).toBe(5);

      // 10. Verify CLOSED update query behavior (Finding C verification):
      // In PostgreSQL, 'CLOSED' was never an enum label in EnquiryStatus.
      // Confirm that executing the CLOSED query updates exactly 0 rows:
      const closedUpdateResult: any = await db.$executeRawUnsafe(
        `UPDATE "${schemaName}"."enquiries" SET "status" = 'ON_HOLD' WHERE "status"::text = 'CLOSED';`
      );
      expect(closedUpdateResult).toBe(0);

    } finally {
      // 11. Strict Cleanup: Drop isolated schema and restore search_path
      await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`).catch(() => {});
      await db.$executeRawUnsafe(`SET search_path = public;`).catch(() => {});
    }
  });

  // ----------------------------------------------------------------------------
  // Finding B: PostgreSQL Enum Catalog & Registration Verification
  // ----------------------------------------------------------------------------
  it("MIG-02: Confirms all CRM (EnquiryStatus) and CMS enum values are fully registered in PostgreSQL catalog", async () => {
    // 1. Verify EnquiryStatus enum values in public schema
    const crmEnums: any = await db.$queryRaw`
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'EnquiryStatus' AND n.nspname = 'public'
      ORDER BY e.enumsortorder;
    `;
    const crmLabels = crmEnums.map((r: any) => r.enumlabel);

    const expectedCrmLabels = [
      "NEW", "IN_REVIEW", "CONTACTED", "CONVERTED", "ARCHIVED",
      "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST", "ON_HOLD"
    ];
    for (const label of expectedCrmLabels) {
      expect(crmLabels).toContain(label);
    }
    // Verify CLOSED is NOT in EnquiryStatus
    expect(crmLabels).not.toContain("CLOSED");

    // 2. Verify all 6 CMS custom enums exist in public schema
    const cmsEnums: any = await db.$queryRaw`
      SELECT t.typname
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname IN (
        'StorageProviderType', 'ClientConsentStatus', 'TestimonialVerificationStatus',
        'RevisionLifecycleStatus', 'ContentPublicationStatus', 'ContentType'
      )
      ORDER BY t.typname;
    `;
    const cmsTypeNames = cmsEnums.map((r: any) => r.typname);
    expect(cmsTypeNames).toEqual([
      "ClientConsentStatus",
      "ContentPublicationStatus",
      "ContentType",
      "RevisionLifecycleStatus",
      "StorageProviderType",
      "TestimonialVerificationStatus",
    ]);
  });

  // ----------------------------------------------------------------------------
  // Finding 3: Full CMS Migration Repeatability & Detailed Definitions
  // ----------------------------------------------------------------------------
  it("MIG-03: Executes the complete CMS migration from start to finish and verifies 100% replay idempotency", async () => {
    const cmsMigPath = path.join(process.cwd(), "prisma/migrations/20261114000000_admin_cms_foundation/migration.sql");
    expect(fs.existsSync(cmsMigPath)).toBe(true);

    const cmsSql = fs.readFileSync(cmsMigPath, "utf-8");
    const statements = splitSqlStatements(cmsSql);
    expect(statements.length).toBe(63);

    // Run all 63 statements of 20261114000000 from start to finish (Pass 1)
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]!;
      try {
        await db.$executeRawUnsafe(stmt);
      } catch (err: any) {
        throw new Error(`[CMS MIGRATION PASS 1 FAILED] Statement #${i + 1} failed: ${err.message}\nSQL: ${stmt.slice(0, 100)}...`);
      }
    }

    // Replay all 63 statements of 20261114000000 from start to finish (Pass 2 — Proving Idempotency)
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]!;
      try {
        await db.$executeRawUnsafe(stmt);
      } catch (err: any) {
        throw new Error(`[CMS MIGRATION REPLAY PASS 2 FAILED] Statement #${i + 1} is not idempotent: ${err.message}\nSQL: ${stmt.slice(0, 100)}...`);
      }
    }
  });

  it("MIG-04: Verifies complete foreign key definitions, referenced columns, and referential actions (delete_rule & update_rule)", async () => {
    const expectedForeignKeys = [
      { name: "services_contentItemId_fkey", table: "services", col: "contentItemId", fTable: "content_items", fCol: "id", del: "RESTRICT", upd: "CASCADE" },
      { name: "portfolio_projects_contentItemId_fkey", table: "portfolio_projects", col: "contentItemId", fTable: "content_items", fCol: "id", del: "RESTRICT", upd: "CASCADE" },
      { name: "pricing_packages_contentItemId_fkey", table: "pricing_packages", col: "contentItemId", fTable: "content_items", fCol: "id", del: "RESTRICT", upd: "CASCADE" },
      { name: "faqs_contentItemId_fkey", table: "faqs", col: "contentItemId", fTable: "content_items", fCol: "id", del: "RESTRICT", upd: "CASCADE" },
      { name: "page_sections_contentItemId_fkey", table: "page_sections", col: "contentItemId", fTable: "content_items", fCol: "id", del: "RESTRICT", upd: "CASCADE" },
      { name: "testimonials_contentItemId_fkey", table: "testimonials", col: "contentItemId", fTable: "content_items", fCol: "id", del: "RESTRICT", upd: "CASCADE" },
      { name: "testimonials_verifiedById_fkey", table: "testimonials", col: "verifiedById", fTable: "admin_users", fCol: "id", del: "SET NULL", upd: "CASCADE" },
      { name: "media_assets_uploaderId_fkey", table: "media_assets", col: "uploaderId", fTable: "admin_users", fCol: "id", del: "SET NULL", upd: "CASCADE" },
      { name: "content_items_publishedById_fkey", table: "content_items", col: "publishedById", fTable: "admin_users", fCol: "id", del: "SET NULL", upd: "CASCADE" },
      { name: "content_items_currentPublishedRevisionId_fkey", table: "content_items", col: "currentPublishedRevisionId", fTable: "content_revisions", fCol: "id", del: "SET NULL", upd: "CASCADE" },
      { name: "content_items_currentWorkingRevisionId_fkey", table: "content_items", col: "currentWorkingRevisionId", fTable: "content_revisions", fCol: "id", del: "SET NULL", upd: "CASCADE" },
      { name: "content_revisions_contentItemId_fkey", table: "content_revisions", col: "contentItemId", fTable: "content_items", fCol: "id", del: "RESTRICT", upd: "CASCADE" },
      { name: "content_revisions_authorId_fkey", table: "content_revisions", col: "authorId", fTable: "admin_users", fCol: "id", del: "SET NULL", upd: "CASCADE" },
    ];

    const actualFks: any = await db.$queryRaw`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name AND rc.constraint_schema = tc.table_schema
      WHERE tc.table_schema = 'public';
    `;

    for (const exp of expectedForeignKeys) {
      const match = actualFks.find((f: any) => f.constraint_name === exp.name);
      expect(match, `Foreign key '${exp.name}' missing in database`).toBeDefined();
      expect(match.table_name).toBe(exp.table);
      expect(match.column_name).toBe(exp.col);
      expect(match.foreign_table_name).toBe(exp.fTable);
      expect(match.foreign_column_name).toBe(exp.fCol);
      expect(match.delete_rule).toBe(exp.del);
      expect(match.update_rule).toBe(exp.upd);
    }
  });

  it("MIG-05: Verifies exact index definitions, indexed columns, and uniqueness in pg_indexes", async () => {
    const expectedIndexes = [
      { name: "content_items_slug_key", unique: true, cols: ["slug"] },
      { name: "content_items_currentPublishedRevisionId_key", unique: true, cols: ["currentPublishedRevisionId"] },
      { name: "content_items_currentWorkingRevisionId_key", unique: true, cols: ["currentWorkingRevisionId"] },
      { name: "content_revisions_contentItemId_versionNumber_key", unique: true, cols: ["contentItemId", "versionNumber"] },
      { name: "page_sections_key_key", unique: true, cols: ["key"] },
      { name: "testimonials_contentItemId_key", unique: true, cols: ["contentItemId"] },
      { name: "media_assets_storageKey_key", unique: true, cols: ["storageKey"] },
      { name: "services_contentItemId_key", unique: true, cols: ["contentItemId"] },
      { name: "portfolio_projects_contentItemId_key", unique: true, cols: ["contentItemId"] },
      { name: "pricing_packages_contentItemId_key", unique: true, cols: ["contentItemId"] },
      { name: "faqs_contentItemId_key", unique: true, cols: ["contentItemId"] },
    ];

    const actualIndexes: any = await db.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `;

    for (const exp of expectedIndexes) {
      const match = actualIndexes.find((i: any) => i.indexname === exp.name);
      expect(match, `Index '${exp.name}' missing in pg_indexes`).toBeDefined();
      const isUnique = match.indexdef.toUpperCase().includes("UNIQUE");
      expect(isUnique).toBe(exp.unique);
      for (const col of exp.cols) {
        expect(match.indexdef).toContain(col);
      }
    }
  });

  it("MIG-06: Enforces trg_verify_revision_ownership (rejects pointing to a revision belonging to another item)", async () => {
    const item1Id = `item_owner_1_${Date.now()}`;
    const item2Id = `item_owner_2_${Date.now()}`;
    const rev2Id = `rev_owner_2_${Date.now()}`;
    testIds.contentItemIds.push(item1Id, item2Id);

    // Create item 1
    await db.$executeRawUnsafe(`
      INSERT INTO "content_items" ("id", "slug", "contentType", "publicationStatus", "createdAt", "updatedAt")
      VALUES ($1, $2, 'SERVICE', 'DRAFT', NOW(), NOW())
    `, item1Id, `slug-${item1Id}`);

    // Create item 2
    await db.$executeRawUnsafe(`
      INSERT INTO "content_items" ("id", "slug", "contentType", "publicationStatus", "createdAt", "updatedAt")
      VALUES ($1, $2, 'SERVICE', 'DRAFT', NOW(), NOW())
    `, item2Id, `slug-${item2Id}`);

    // Create revision belonging to item 2
    await db.$executeRawUnsafe(`
      INSERT INTO "content_revisions" ("id", "contentItemId", "versionNumber", "title", "snapshotData", "authorName", "createdAt")
      VALUES ($1, $2, 1, 'Rev 2 Title', '{"title": "Rev 2"}', 'Author', NOW())
    `, rev2Id, item2Id);

    // Attempt to point item 1's currentPublishedRevisionId to item 2's revision
    await expect(
      db.$executeRawUnsafe(`
        UPDATE "content_items"
        SET "currentPublishedRevisionId" = $1
        WHERE "id" = $2;
      `, rev2Id, item1Id)
    ).rejects.toThrow(/does not belong to ContentItem/i);
  });

  it("MIG-07: Enforces trg_protect_published_revisions (rejects deletion of published snapshots or active pointers)", async () => {
    const itemId = `item_del_prot_${Date.now()}`;
    const revId = `rev_del_prot_${Date.now()}`;
    testIds.contentItemIds.push(itemId);

    // Create item
    await db.$executeRawUnsafe(`
      INSERT INTO "content_items" ("id", "slug", "contentType", "publicationStatus", "createdAt", "updatedAt")
      VALUES ($1, $2, 'SERVICE', 'DRAFT', NOW(), NOW())
    `, itemId, `slug-${itemId}`);

    // Create published snapshot revision
    await db.$executeRawUnsafe(`
      INSERT INTO "content_revisions" ("id", "contentItemId", "versionNumber", "revisionStatus", "isPublishedSnapshot", "title", "snapshotData", "authorName", "createdAt")
      VALUES ($1, $2, 1, 'PUBLISHED_SNAPSHOT', true, 'Snapshot Title', '{"title": "Test"}', 'Author', NOW())
    `, revId, itemId);

    // Attempt to delete the published snapshot
    await expect(
      db.$executeRawUnsafe(`
        DELETE FROM "content_revisions" WHERE "id" = $1;
      `, revId)
    ).rejects.toThrow(/Cannot delete published revision snapshot/i);
  });

  it("MIG-08: Enforces trg_protect_revision_immutability (rejects mutation of snapshotData on published revisions)", async () => {
    const itemId = `item_immut_${Date.now()}`;
    const revId = `rev_immut_${Date.now()}`;
    testIds.contentItemIds.push(itemId);

    // Create item
    await db.$executeRawUnsafe(`
      INSERT INTO "content_items" ("id", "slug", "contentType", "publicationStatus", "createdAt", "updatedAt")
      VALUES ($1, $2, 'SERVICE', 'DRAFT', NOW(), NOW())
    `, itemId, `slug-${itemId}`);

    // Create published snapshot revision
    await db.$executeRawUnsafe(`
      INSERT INTO "content_revisions" ("id", "contentItemId", "versionNumber", "revisionStatus", "isPublishedSnapshot", "title", "snapshotData", "authorName", "createdAt")
      VALUES ($1, $2, 1, 'PUBLISHED_SNAPSHOT', true, 'Original Title', '{"title": "Original"}', 'Author', NOW())
    `, revId, itemId);

    // Attempt to mutate snapshotData of the published snapshot
    await expect(
      db.$executeRawUnsafe(`
        UPDATE "content_revisions"
        SET "snapshotData" = '{"title": "Tampered"}'
        WHERE "id" = $1;
      `, revId)
    ).rejects.toThrow(/Cannot modify content or metadata of published revision snapshot/i);

    // Attempt to mutate versionNumber
    await expect(
      db.$executeRawUnsafe(`
        UPDATE "content_revisions"
        SET "versionNumber" = 99
        WHERE "id" = $1;
      `, revId)
    ).rejects.toThrow(/Cannot change versionNumber of revision/i);
  });

  // ----------------------------------------------------------------------------
  // Finding 3: Interrupted States & Constraint Preservation
  // ----------------------------------------------------------------------------
  it("MIG-09: Verifies interrupted/partially provisioned state recovery and non-destructive constraint preservation", async () => {
    // 1. Partially provisioned state: Types exist, tables exist, but triggers are dropped
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_protect_revision_immutability ON "content_revisions";`);
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_verify_revision_ownership ON "content_items";`);
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_protect_published_revisions ON "content_revisions";`);

    // Verify triggers are absent
    const missingTriggers: any = await db.$queryRaw`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'content_items' AND trigger_name = 'trg_verify_revision_ownership';
    `;
    expect(missingTriggers).toHaveLength(0);

    // Re-apply migration SQL from disk (simulating recovery of interrupted deployment)
    const cmsMigPath = path.join(process.cwd(), "prisma/migrations/20261114000000_admin_cms_foundation/migration.sql");
    const cmsSql = fs.readFileSync(cmsMigPath, "utf-8");
    const statements = splitSqlStatements(cmsSql);

    for (const stmt of statements) {
      await db.$executeRawUnsafe(stmt);
    }

    // Verify triggers were safely restored without data corruption
    // (PostgreSQL information_schema.triggers returns 2 rows for BEFORE INSERT OR UPDATE: 1 per event)
    const restoredTriggers: any = await db.$queryRaw`
      SELECT trigger_name, event_manipulation 
      FROM information_schema.triggers 
      WHERE event_object_table = 'content_items' AND trigger_name = 'trg_verify_revision_ownership';
    `;
    expect(restoredTriggers.length).toBe(2);
    const events = restoredTriggers.map((t: any) => t.event_manipulation);
    expect(events).toContain("INSERT");
    expect(events).toContain("UPDATE");

    // 2. Verify foreign key constraints remain valid and enforced
    const fkValidRows: any = await db.$queryRaw`
      SELECT conname, convalidated 
      FROM pg_constraint 
      WHERE conname = 'services_contentItemId_fkey';
    `;
    expect(fkValidRows).toHaveLength(1);
    expect(fkValidRows[0].convalidated).toBe(true);
  });
});
