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
    {
      id: SEED_DATA.CUSTOMERS.GLOBAL_DISTRIBUTORS,
      companyName: 'Global Distributors Ltd',
      taxNumber: 'CUST-GLOBAL-006',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.SMART_ELECTRONICS,
      companyName: 'Smart Electronics',
      taxNumber: 'CUST-SMART-007',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.CITY_SUPERMARKET,
      companyName: 'City Supermarket',
      taxNumber: 'CUST-CITY-008',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.NATIONAL_SUPPLY,
      companyName: 'National Supply Co',
      taxNumber: 'CUST-NAT-009',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.EXPRESS_RETAIL,
      companyName: 'Express Retail',
      taxNumber: 'CUST-EXPRESS-010',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.INACTIVE_CUST_1,
      companyName: 'Old Tech Solutions',
      taxNumber: 'CUST-INACT-011',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.INACTIVE_CUST_2,
      companyName: 'Closed Retail',
      taxNumber: 'CUST-INACT-012',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.INACTIVE_CUST_3,
      companyName: 'Bankrupt Hardware',
      taxNumber: 'CUST-INACT-013',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.INACTIVE_CUST_4,
      companyName: 'Merged Co',
      taxNumber: 'CUST-INACT-014',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.CUSTOMERS.INACTIVE_CUST_5,
      companyName: 'Past Mart',
      taxNumber: 'CUST-INACT-015',
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
