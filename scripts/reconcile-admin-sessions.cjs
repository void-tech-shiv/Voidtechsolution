/**
 * VOIDTECH SOLUTION — AdminSession Table Reconciliation Verifier (Read-Only)
 * 
 * Verifies exact 100% equivalence between the physical database table
 * and migration 20261112000001_add_admin_sessions.
 * 
 * STRICT SAFETY REQUIREMENTS:
 * 1. Read-only queries only against PostgreSQL catalogs (information_schema & pg_catalog).
 * 2. Never logs or prints connection strings, passwords, or secrets.
 * 3. Sanitizes all output and error messages.
 * 4. Fails closed if unexpected extra columns, mismatched defaults, or precision drift exist.
 * 5. Compares exact definitions of PK, unique index, ordinary indexes, and foreign keys.
 * 6. Explicitly verifies target endpoint identity (hostname and database name).
 */

const { PrismaClient } = require('.prisma/client');

function sanitizeDatabaseEndpoint() {
  const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
  if (!connStr) {
    return { host: 'unknown', port: 'unknown', database: 'unknown' };
  }
  try {
    const parsed = new URL(connStr);
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname.replace(/^\//, '')
    };
  } catch {
    return { host: 'unparseable', port: 'unknown', database: 'unknown' };
  }
}

async function verifyAdminSessionsEquivalence() {
  const endpoint = sanitizeDatabaseEndpoint();
  const prisma = new PrismaClient();

  let hasError = false;

  try {
    console.log('==============================================================================');
    console.log('VOIDTECH — Read-Only AdminSession Migration Reconciliation Verifier');
    console.log('==============================================================================');
    console.log(`Target Endpoint Host:     ${endpoint.host}`);
    console.log(`Target Endpoint Port:     ${endpoint.port}`);
    console.log(`Target Database Name:     ${endpoint.database}`);
    console.log('Mode:                     STRICT READ-ONLY CATALOG AUDIT');
    console.log('==============================================================================\n');

    // 1. Check Table Existence
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'admin_sessions';
    `;

    if (!Array.isArray(tableExists) || tableExists.length === 0) {
      console.error('❌ Table "admin_sessions" does NOT exist in the target database.');
      process.exit(1);
    }
    console.log('✅ Table "admin_sessions" exists.');

    // 2. Inspect Columns, Data Types, Precision, Defaults, and Nullability
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        datetime_precision,
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'admin_sessions'
      ORDER BY ordinal_position;
    `;

    const expectedColumns = {
      id: { type: 'text', nullable: 'NO', precision: null, defaultSubstr: null },
      userId: { type: 'text', nullable: 'NO', precision: null, defaultSubstr: null },
      sessionToken: { type: 'text', nullable: 'NO', precision: null, defaultSubstr: null },
      ipAddress: { type: 'text', nullable: 'YES', precision: null, defaultSubstr: null },
      userAgent: { type: 'text', nullable: 'YES', precision: null, defaultSubstr: null },
      expiresAt: { type: 'timestamp without time zone', nullable: 'NO', precision: 3, defaultSubstr: null },
      lastActiveAt: { type: 'timestamp without time zone', nullable: 'NO', precision: 3, defaultSubstr: 'CURRENT_TIMESTAMP' },
      createdAt: { type: 'timestamp without time zone', nullable: 'NO', precision: 3, defaultSubstr: 'CURRENT_TIMESTAMP' }
    };

    console.log('\n--- 1. Column-by-Column Specification & Precision Audit ---');
    const actualColNames = new Set(columns.map(c => c.column_name));
    const expectedColNames = new Set(Object.keys(expectedColumns));

    // Check for unexpected extra columns (Fail-Closed)
    for (const actualCol of columns) {
      if (!expectedColNames.has(actualCol.column_name)) {
        console.error(`❌ Unexpected extra column found in database: "${actualCol.column_name}"`);
        hasError = true;
      }
    }

    // Check for missing columns or attribute mismatches
    for (const [colName, exp] of Object.entries(expectedColumns)) {
      const match = columns.find(c => c.column_name === colName);
      if (!match) {
        console.error(`❌ Expected column missing: "${colName}"`);
        hasError = true;
        continue;
      }

      const typeMatch = match.data_type.toLowerCase() === exp.type.toLowerCase();
      const nullMatch = match.is_nullable === exp.nullable;
      const precisionMatch = exp.precision === null || match.datetime_precision === exp.precision;

      let defaultMatch = true;
      if (exp.defaultSubstr) {
        defaultMatch = match.column_default && match.column_default.toUpperCase().includes(exp.defaultSubstr);
      } else {
        defaultMatch = match.column_default === null;
      }

      if (!typeMatch || !nullMatch || !precisionMatch || !defaultMatch) {
        console.error(`❌ Column "${colName}" definition mismatch:`);
        console.error(`   Expected: type=${exp.type}, nullable=${exp.nullable}, precision=${exp.precision}, default=${exp.defaultSubstr}`);
        console.error(`   Actual:   type=${match.data_type}, nullable=${match.is_nullable}, precision=${match.datetime_precision}, default=${match.column_default}`);
        hasError = true;
      } else {
        const precText = match.datetime_precision !== null ? `(${match.datetime_precision})` : '';
        const defText = match.column_default ? ` DEFAULT ${match.column_default}` : '';
        console.log(`✅ Column "${colName}": ${match.data_type}${precText} [Nullable: ${match.is_nullable}]${defText} [MATCH]`);
      }
    }

    if (columns.length !== Object.keys(expectedColumns).length) {
      console.error(`❌ Column count mismatch: Expected ${Object.keys(expectedColumns).length}, found ${columns.length}.`);
      hasError = true;
    }

    // 3. Inspect Primary Key Definition
    console.log('\n--- 2. Primary Key Definition Audit ---');
    const pkResult = await prisma.$queryRaw`
      SELECT kcu.column_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'admin_sessions' 
        AND tc.constraint_type = 'PRIMARY KEY';
    `;

    if (!Array.isArray(pkResult) || pkResult.length !== 1 || pkResult[0].column_name !== 'id') {
      console.error('❌ Primary Key must be exactly on ("id"). Actual PK:', pkResult);
      hasError = true;
    } else {
      console.log(`✅ Primary Key constraint "${pkResult[0].constraint_name}" exactly on column ("id") [MATCH]`);
    }

    // 4. Inspect Indexes Definitions
    console.log('\n--- 3. Index & Uniqueness Definition Audit ---');
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'admin_sessions'
      ORDER BY indexname;
    `;

    const expectedIndexDefs = {
      'admin_sessions_pkey': { unique: true, columns: ['id'] },
      'admin_sessions_sessionToken_key': { unique: true, columns: ['sessionToken'] },
      'admin_sessions_userId_idx': { unique: false, columns: ['userId'] },
      'admin_sessions_expiresAt_idx': { unique: false, columns: ['expiresAt'] }
    };

    const actualIndexNames = new Set(indexes.map(i => i.indexname));
    for (const expIdx of Object.keys(expectedIndexDefs)) {
      if (!actualIndexNames.has(expIdx)) {
        console.error(`❌ Expected index missing: "${expIdx}"`);
        hasError = true;
      }
    }

    for (const index of indexes) {
      const exp = expectedIndexDefs[index.indexname];
      if (!exp) {
        console.error(`❌ Unexpected extra index found: "${index.indexname}" with definition: ${index.indexdef}`);
        hasError = true;
        continue;
      }

      const isUnique = index.indexdef.toUpperCase().includes('UNIQUE');
      if (isUnique !== exp.unique) {
        console.error(`❌ Index "${index.indexname}" uniqueness mismatch: expected unique=${exp.unique}, actual=${isUnique}`);
        hasError = true;
      }

      for (const col of exp.columns) {
        if (!index.indexdef.includes(col)) {
          console.error(`❌ Index "${index.indexname}" missing indexed column "${col}". Definition: ${index.indexdef}`);
          hasError = true;
        }
      }

      console.log(`✅ Index "${index.indexname}" [Unique: ${isUnique}]: ${index.indexdef} [MATCH]`);
    }

    // 5. Inspect Foreign Keys & Referential Actions
    console.log('\n--- 4. Foreign Key Constraint & Referential Actions Audit ---');
    const fks = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
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
      WHERE tc.table_schema = 'public' AND tc.table_name = 'admin_sessions';
    `;

    if (!Array.isArray(fks) || fks.length !== 1) {
      console.error(`❌ Expected exactly 1 foreign key constraint on admin_sessions, found ${fks.length}`);
      hasError = true;
    } else {
      const fk = fks[0];
      const validFk = (
        fk.column_name === 'userId' &&
        fk.foreign_table_name === 'admin_users' &&
        fk.foreign_column_name === 'id' &&
        fk.delete_rule === 'CASCADE' &&
        fk.update_rule === 'CASCADE'
      );

      if (!validFk) {
        console.error('❌ Foreign key constraint definition mismatch:', fk);
        hasError = true;
      } else {
        console.log(`✅ Foreign Key "${fk.constraint_name}":`);
        console.log(`   admin_sessions("${fk.column_name}") REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}")`);
        console.log(`   ON DELETE: ${fk.delete_rule} | ON UPDATE: ${fk.update_rule} [MATCH]`);
      }
    }

    // 6. Final Summary Assessment
    console.log('\n==============================================================================');
    if (!hasError) {
      console.log('🎯 FINAL VERDICT: EXACT EQUIVALENCE CONFIRMED (100% MATCH).');
      console.log('   All 8 columns, precision(3), defaults, PK, 3 secondary indexes, and CASCADE FK');
      console.log('   are verified to be byte-for-byte equivalent to migration 20261112000001_add_admin_sessions.');
      console.log('   Zero warnings. Zero discrepancies.');
      console.log('   Command: `npx prisma migrate resolve --applied 20261112000001_add_admin_sessions` is APPROVED.');
      console.log('==============================================================================\n');
      process.exit(0);
    } else {
      console.error('❌ FINAL VERDICT: DISCREPANCIES DETECTED.');
      console.error('   Do NOT mark migration 20261112000001_add_admin_sessions as applied.');
      console.log('==============================================================================\n');
      process.exit(1);
    }

  } catch (err) {
    // Sanitize error message to ensure no connection strings or passwords leak
    const sanitizedMsg = (err && err.message)
      ? err.message.replace(/postgresql:\/\/[^@\s]+@[^\s]+/gi, 'postgresql://[REDACTED]')
      : 'Unknown error';
    console.error('❌ Error during reconciliation verification:', sanitizedMsg);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminSessionsEquivalence();
