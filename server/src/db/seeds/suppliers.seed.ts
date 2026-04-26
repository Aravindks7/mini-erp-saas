import { db } from '../index.js';
import { suppliers } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedSuppliers() {
  console.log('🌱 Seeding Suppliers...');

  const items = [
    {
      id: SEED_DATA.SUPPLIERS.ACME_CORP,
      name: 'Acme Corporation',
      taxNumber: 'TAX-ACME-001',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.GLOBAL_SPARES,
      name: 'Global Spares Ltd',
      taxNumber: 'TAX-GLOBAL-999',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of items) {
    const existing = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, item.id),
    });

    if (!existing) {
      await db.insert(suppliers).values(item);
      console.log(`   - Supplier '${item.name}' created.`);
    }
  }
}
