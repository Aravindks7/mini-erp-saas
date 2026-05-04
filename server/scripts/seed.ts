import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';
import { seedRBAC } from '../src/db/seed.js';
import { seedAuth } from '../src/db/seeds/auth.seed.js';
import { seedFinance } from '../src/db/seeds/finance.seed.js';
import { seedSequences } from '../src/db/seeds/sequences.seed.js';
import { seedTaxes } from '../src/db/seeds/taxes.seed.js';
import { seedUoms } from '../src/db/seeds/uom.seed.js';
import { seedSuppliers } from '../src/db/seeds/suppliers.seed.js';
import { seedCustomers } from '../src/db/seeds/customers.seed.js';
import { seedProductCategories } from '../src/db/seeds/product-categories.seed.js';
import { seedProducts } from '../src/db/seeds/products.seed.js';
import { seedWarehouses } from '../src/db/seeds/warehouses.seed.js';
import { seedInventory } from '../src/db/seeds/inventory.seed.js';
import { seedScenarios } from '../src/db/seeds/scenarios.seed.js';

async function run() {
  // 1. Production Kill-Switch
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL ERROR: Seed script aborted. NEVER run seeding in production.');
    process.exit(1);
  }

  console.log('🚀 Starting Developer Data Seeding...');

  try {
    // 2. Clear existing data for a clean dev state
    console.log('🧹 Clearing existing data dynamically...');
    await db.execute(sql`
      DO $$ 
      DECLARE 
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '__drizzle_migrations%') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
          END LOOP;
      END $$;
    `);

    // 3. Dependency-Ordered Execution

    // Core RBAC Logic
    await seedRBAC();

    // Auth & Identity (Requires RBAC roles)
    await seedAuth();

    // Finance (COA & GL)
    await seedFinance();

    // Sequences (Requires Org/User from Auth)
    await seedSequences();

    // Reference Data (Requires Org/User from Auth)
    await seedTaxes();
    await seedUoms();

    // Operational Data (Requires Reference Data)
    await seedSuppliers();
    await seedCustomers();
    await seedProductCategories();
    await seedProducts();
    await seedWarehouses();
    await seedInventory();

    // Execute Deterministic Scenario Engine (Replaces manual seeds)
    await seedScenarios();

    console.log('✅ Developer seeding complete successfully.');
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
