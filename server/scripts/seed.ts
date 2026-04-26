import 'dotenv/config';
import { seedRBAC } from '../src/db/seed.js';
import { seedAuth } from '../src/db/seeds/auth.seed.js';
import { seedTaxes } from '../src/db/seeds/taxes.seed.js';
import { seedUoms } from '../src/db/seeds/uom.seed.js';
import { seedSuppliers } from '../src/db/seeds/suppliers.seed.js';
import { seedCustomers } from '../src/db/seeds/customers.seed.js';
import { seedProducts } from '../src/db/seeds/products.seed.js';

async function run() {
  // 1. Production Kill-Switch
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL ERROR: Seed script aborted. NEVER run seeding in production.');
    process.exit(1);
  }

  console.log('🚀 Starting Developer Data Seeding...');

  try {
    // 2. Dependency-Ordered Execution

    // Core RBAC Logic
    await seedRBAC();

    // Auth & Identity (Requires RBAC roles)
    await seedAuth();

    // Reference Data (Requires Org/User from Auth)
    await seedTaxes();
    await seedUoms();

    // Operational Data (Requires Reference Data)
    await seedSuppliers();
    await seedCustomers();
    await seedProducts();

    console.log('✅ Developer seeding complete successfully.');
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
