import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js';
import { seedRBAC } from './seed.js';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

async function runMigrations() {
  const migrationsFolder = path.resolve('./drizzle');
  console.log('⏳ Running database migrations from:', migrationsFolder);

  if (fs.existsSync(migrationsFolder)) {
    console.log('📁 Migrations folder contents:', fs.readdirSync(migrationsFolder));
  } else {
    console.error('❌ Migrations folder does not exist!');
    process.exit(1);
  }

  try {
    // Check connection
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection verified.');

    // 1. Run Schema Migrations
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations completed successfully!');

    // Verify tables
    const tables = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    console.log(
      '📊 Tables in public schema:',
      tables.rows.map((r) => r.table_name),
    );

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
