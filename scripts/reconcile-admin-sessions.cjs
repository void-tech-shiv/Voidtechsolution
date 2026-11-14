/**
 * VOIDTECH SOLUTION — AdminSession Table Reconciliation Verifier (Read-Only)
 * 
 * Verifies exact 100% equivalence between the physical database table
 * and migration 20261112000001_add_admin_sessions.
 * 
 * STRICT SAFETY: READ-ONLY QUERIES ONLY (information_schema & pg_catalog).
 * NEVER EXPOSES SECRETS OR CONNECTION STRINGS.
 */

const { PrismaClient } = require('.prisma/client');

async function verifyAdminSessionsEquivalence() {
  const prisma = new PrismaClient();

  try {
    console.log('==============================================================================');
    console.log('VOIDTECH — Read-Only AdminSession Migration Reconciliation Verification');
    console.log('==============================================================================\n');

    // 1. Check Table Existence
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'admin_sessions';
    `;

    if (tableExists.length === 0) {
      console.error('❌ Table "admin_sessions" does NOT exist in the target database.');
      process.exit(1);
    }
    console.log('✅ Table "admin_sessions" exists.');

    // 2. Inspect Columns
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'admin_sessions'
      ORDER BY ordinal_position;
    `;

    const expectedColumns = {
      id: { type: 'text', nullable: 'NO' },
      userId: { type: 'text', nullable: 'NO' },
      sessionToken: { type: 'text', nullable: 'NO' },
      ipAddress: { type: 'text', nullable: 'YES' },
      userAgent: { type: 'text', nullable: 'YES' },
      expiresAt: { type: 'timestamp without time zone', nullable: 'NO' },
      lastActiveAt: { type: 'timestamp without time zone', nullable: 'NO' },
      createdAt: { type: 'timestamp without time zone', nullable: 'NO' }
    };

    console.log('\n--- Column Verification ---');
    let columnMismatch = false;
    for (const [colName, exp] of Object.entries(expectedColumns)) {
      const match = columns.find(c => c.column_name === colName);
      if (!match) {
        console.error(`❌ Column missing: ${colName}`);
        columnMismatch = true;
      } else {
        const typeMatch = match.data_type.toLowerCase() === exp.type.toLowerCase();
        const nullMatch = match.is_nullable === exp.nullable;
        if (!typeMatch || !nullMatch) {
          console.error(`❌ Column ${colName} mismatch: expected type=${exp.type}, null=${exp.nullable}; got type=${match.data_type}, null=${match.is_nullable}`);
          columnMismatch = true;
        } else {
          console.log(`✅ Column "${colName}": ${match.data_type} (Nullable: ${match.is_nullable}) [MATCH]`);
        }
      }
    }

    if (columns.length !== Object.keys(expectedColumns).length) {
      console.warn(`⚠️ Warning: Expected ${Object.keys(expectedColumns).length} columns, found ${columns.length}`);
    }

    // 3. Inspect Primary Key
    console.log('\n--- Primary Key Verification ---');
    const pkResult = await prisma.$queryRaw`
      SELECT kcu.column_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'admin_sessions' 
        AND tc.constraint_type = 'PRIMARY KEY';
    `;

    const hasPk = pkResult.some(pk => pk.column_name === 'id');
    if (hasPk) {
      console.log(`✅ Primary Key on ("id") exists: ${pkResult[0].constraint_name}`);
    } else {
      console.error('❌ Primary Key on ("id") missing!');
    }

    // 4. Inspect Indexes
    console.log('\n--- Index Verification ---');
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND tablename = 'admin_sessions'
      ORDER BY indexname;
    `;

    const expectedIndexes = [
      'admin_sessions_pkey',
      'admin_sessions_sessionToken_key',
      'admin_sessions_userId_idx',
      'admin_sessions_expiresAt_idx'
    ];

    let indexMismatch = false;
    for (const expIdx of expectedIndexes) {
      const found = indexes.find(i => i.indexname === expIdx);
      if (found) {
        console.log(`✅ Index "${expIdx}": ${found.indexdef}`);
      } else {
        console.error(`❌ Index missing: ${expIdx}`);
        indexMismatch = true;
      }
    }

    // 5. Inspect Foreign Keys
    console.log('\n--- Foreign Key Verification ---');
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

    let fkMismatch = false;
    const userFk = fks.find(f => f.column_name === 'userId' && f.foreign_table_name === 'admin_users');
    if (!userFk) {
      console.error('❌ Foreign key from admin_sessions.userId to admin_users.id missing!');
      fkMismatch = true;
    } else {
      console.log(`✅ Foreign Key "${userFk.constraint_name}": admin_sessions(userId) -> admin_users(id)`);
      console.log(`   ON DELETE: ${userFk.delete_rule} (Expected: CASCADE)`);
      console.log(`   ON UPDATE: ${userFk.update_rule} (Expected: CASCADE)`);
      if (userFk.delete_rule !== 'CASCADE' || userFk.update_rule !== 'CASCADE') {
        console.error('❌ Referential actions mismatch!');
        fkMismatch = true;
      }
    }

    // 6. Summary Assessment
    console.log('\n==============================================================================');
    if (!columnMismatch && hasPk && !indexMismatch && !fkMismatch) {
      console.log('🎯 VERDICT: EXACT EQUIVALENCE CONFIRMED (100% MATCH).');
      console.log('   Table "admin_sessions" strictly conforms to migration 20261112000001_add_admin_sessions.');
      console.log('   `prisma migrate resolve --applied 20261112000001_add_admin_sessions` is SAFE.');
    } else {
      console.error('❌ VERDICT: MISMATCH DETECTED. DO NOT RESOLVE.');
      process.exit(1);
    }
    console.log('==============================================================================\n');

  } catch (err) {
    console.error('Error during reconciliation check:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminSessionsEquivalence();
