import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

/**
 * Utility script to list all tables in the database with their row counts.
 */
async function main() {
  console.log('\x1b[34m[DB Inspector]\x1b[0m Fetching table list...');

  try {
    const tablesResult = await db.execute(
      sql.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `),
    );

    const tables = tablesResult.rows as { table_name: string }[];

    if (tables.length === 0) {
      console.log('No tables found in the public schema.');
      process.exit(0);
    }

    console.log(`Found ${tables.length} tables. Calculating row counts...`);

    const stats = [];
    for (const table of tables) {
      const name = table.table_name;
      const countResult = await db.execute(sql.raw(`SELECT count(*) as count FROM "${name}"`));
      const row = countResult.rows[0] as { count: string | number };
      const count = row.count;
      stats.push({ table: name, rows: count });
    }

    console.table(stats);
  } catch (error) {
    console.error('\x1b[31m[Error]\x1b[0m Failed to inspect database:');
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
