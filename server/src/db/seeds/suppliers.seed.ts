import { db } from '../index.js';
import { suppliers } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedSuppliers() {
  console.log('🌱 Seeding Suppliers...');

  const items = [
    {
      id: SEED_DATA.SUPPLIERS.ACME_CORP,
      name: 'ACME Corporation',
      taxNumber: 'SUP-ACME-001',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.GLOBAL_SPARES,
      name: 'Global Spares Ltd',
      taxNumber: 'SUP-GLOB-002',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.STEELWORKS_INC,
      name: 'SteelWorks Inc',
      taxNumber: 'SUP-STEEL-003',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.OFFICE_DEPOT,
      name: 'Office Depot Solutions',
      taxNumber: 'SUP-OFFICE-004',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.SILICON_SUPPLY,
      name: 'Silicon Supply Co',
      taxNumber: 'SUP-SILICON-005',
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
