import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js';
import { seedRBAC } from './seed.js';

async function runMigrations() {
  console.log('⏳ Running database migrations...');
  try {
    // 1. Run Schema Migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully!');

    // 2. Run RBAC Seeding (Automatic)
    await seedRBAC();

    console.log('🏁 Database is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration or Seeding failed:', error);
    process.exit(1);
  }
}

runMigrations();
