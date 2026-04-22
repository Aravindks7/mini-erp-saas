import 'dotenv/config';
import { seedRBAC } from '../src/db/seed.js';

async function run() {
  try {
    await seedRBAC();
    console.log('✅ Manual seeding complete.');
  } catch (err) {
    console.error('❌ Manual seeding failed:', err);
  } finally {
    process.exit(0);
  }
}

run();
