import { db } from '../index.js';
import { documentSequences } from '../schema/index.js';
import { SEED_DATA } from './constants.js';

export async function seedSequences() {
  console.log('🌱 Seeding Document Sequences...');

  const sequenceTypes = ['SO', 'PO', 'INV', 'REC', 'SHP', 'BILL', 'PAY', 'ADJ'];

  for (const type of sequenceTypes) {
    await db
      .insert(documentSequences)
      .values({
        organizationId: SEED_DATA.ORGANIZATION_ID,
        type,
        prefix: `${type}-`,
        nextValue: 1,
        padding: 4,
        createdBy: SEED_DATA.USER_ID,
        updatedBy: SEED_DATA.USER_ID,
      })
      .onConflictDoNothing();
  }

  console.log('   - Default sequences verified.');
}
