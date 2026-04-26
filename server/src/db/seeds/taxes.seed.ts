import { db } from '../index.js';
import { taxes } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedTaxes() {
  console.log('🌱 Seeding Taxes...');

  const items = [
    {
      id: SEED_DATA.TAXES.VAT_STANDARD,
      name: 'Standard VAT',
      rate: '15.00',
      description: 'Standard value added tax',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.TAXES.VAT_ZERO,
      name: 'Zero Rated VAT',
      rate: '0.00',
      description: 'Zero rated value added tax',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of items) {
    const existing = await db.query.taxes.findFirst({
      where: eq(taxes.id, item.id),
    });

    if (!existing) {
      await db.insert(taxes).values(item);
      console.log(`   - Tax '${item.name}' created.`);
    }
  }
}
