import 'dotenv/config';
import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';
import fs from 'fs';

/**
 * Utility script to execute raw SQL files or strings.
 * Usage:
 *   npx tsx scripts/run-sql.ts path/to/script.sql
 *   npx tsx scripts/run-sql.ts "SELECT * FROM users LIMIT 1;"
 */
async function main() {
  const input = process.argv[2];

  if (!input) {
    console.error('Usage: npx tsx scripts/run-sql.ts <file-path or sql-string>');
    process.exit(1);
  }

  let sqlContent: string;

  // Check if input is a file path
  if (fs.existsSync(input) && fs.lstatSync(input).isFile()) {
    sqlContent = fs.readFileSync(input, 'utf8');
    console.log(`\x1b[34m[SQL Exec]\x1b[0m Executing from file: ${input}`);
  } else {
    sqlContent = input;
    console.log(`\x1b[34m[SQL Exec]\x1b[0m Executing raw query: ${sqlContent}`);
  }

  try {
    const result = await db.execute(sql.raw(sqlContent));

    if (Array.isArray(result.rows) && result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('\x1b[32m[Success]\x1b[0m Query executed successfully.');
      console.log('Result:', result);
    }
  } catch (error) {
    console.error('\x1b[31m[Error]\x1b[0m Failed to execute SQL:');
    console.error(error);
    process.exit(1);
  } finally {
    // Explicitly exit to close the pool
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
