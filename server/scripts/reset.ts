import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function reset() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ CRITICAL ERROR: Reset script aborted. NEVER run reset in production.');
    process.exit(1);
  }

  console.log('🗑️  Wiping database dynamically...');

  try {
    // 1. Clear existing data for a clean reset state
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
    console.log('✅ All tables wiped successfully.');

    // 2. Trigger server restart (signals tsx watch to reboot)
    const serverPath = path.resolve(__dirname, '../src/server.ts');
    if (fs.existsSync(serverPath)) {
      const now = new Date();
      fs.utimesSync(serverPath, now, now);
      console.log('🔄 Server restart triggered.');
    }

    console.log('✅ Database reset complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
}

reset();
