import 'dotenv/config';
import { db } from '../src/db/index';
import { organizations } from '../src/db/schema/core';
import { organizationMemberships } from '../src/db/schema/auth';

async function run() {
  try {
    const [org] = await db
      .insert(organizations)
      .values({ name: 'Test Org', slug: 'test-org' })
      .returning();

    await db.insert(organizationMemberships).values({
      userId: '412sev40uLPISM4HEMbEiCKOB7XOLour', // ID from my recent sign-up
      organizationId: org.id,
      role: 'admin',
    });

    console.log('ORG_ID=' + org.id);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
