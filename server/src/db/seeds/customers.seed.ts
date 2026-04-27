import { db } from '../index.js';
import { customers } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedCustomers() {
  console.log('🌱 Seeding Customers...');

  const items = [
    {
      id: SEED_DATA.CUSTOMERS.TECH_SOLUTIONS,
      companyName: 'Tech Solutions Inc',
      taxNumber: 'CUST-TECH-001',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.RETAIL_GIANT,
      companyName: 'Retail Giant Co',
      taxNumber: 'CUST-RETAIL-002',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.LOCAL_HARDWARE,
      companyName: 'Local Hardware Store',
      taxNumber: 'CUST-LOCAL-003',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.BUILDIT_CO,
      companyName: 'BuildIt Construction',
      taxNumber: 'CUST-BUILD-004',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.MEGAMART,
      companyName: 'MegaMart Retailers',
      taxNumber: 'CUST-MEGA-005',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of items) {
    const existing = await db.query.customers.findFirst({
      where: eq(customers.id, item.id),
    });

    if (!existing) {
      await db.insert(customers).values(item);
      console.log(`   - Customer '${item.companyName}' created.`);
    }
  }
}
