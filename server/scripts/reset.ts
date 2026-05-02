import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';
import { seedRBAC } from '../src/db/seed.js';
import { seedAuth } from '../src/db/seeds/auth.seed.js';
import { seedSequences } from '../src/db/seeds/sequences.seed.js';
import { seedTaxes } from '../src/db/seeds/taxes.seed.js';
import { seedUoms } from '../src/db/seeds/uom.seed.js';
import { seedSuppliers } from '../src/db/seeds/suppliers.seed.js';
import { seedCustomers } from '../src/db/seeds/customers.seed.js';
import { seedProducts } from '../src/db/seeds/products.seed.js';
import { seedWarehouses } from '../src/db/seeds/warehouses.seed.js';
import { seedInventory } from '../src/db/seeds/inventory.seed.js';
import { seedScenarios } from '../src/db/seeds/scenarios.seed.js';

async function reset() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL ERROR: Reset script aborted. NEVER run reset in production.');
    process.exit(1);
  }

  console.log('🗑️  Wiping database...');

  try {
    // 1. Fetch all tables in the public schema (excluding migrations)
    const tablesResult = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '__drizzle_migrations';
    `);

    const tableNames = (tablesResult.rows as { tablename: string }[]).map((r) => r.tablename);

    if (tableNames.length > 0) {
      const truncateQuery = `TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`;
      await db.execute(sql.raw(truncateQuery));
      console.log(`✅ ${tableNames.length} tables wiped successfully.`);
    } else {
      console.log('ℹ️  No tables found to wipe.');
    }

    // 2. Re-seed the system
    console.log('🚀 Starting fresh seeding...');

    await seedRBAC();
    await seedAuth();
    await seedSequences();
    await seedTaxes();
    await seedUoms();
    await seedSuppliers();
    await seedCustomers();
    await seedProducts();
    await seedWarehouses();
    await seedInventory();
    await seedScenarios();

    console.log('✅ Database reset and re-seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
}

reset();
