import { db } from '../index.js';
import { productCategories } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedProductCategories() {
  console.log('🌱 Seeding Product Categories...');

  const items = [
    // Top Level
    {
      id: SEED_DATA.PRODUCT_CATEGORIES.ELECTRONICS,
      name: 'Electronics',
      code: 'ELEC',
      description: 'Consumer electronics and devices',
      parentId: null,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCT_CATEGORIES.OFFICE_SUPPLIES,
      name: 'Office Supplies',
      code: 'OFFICE',
      description: 'Daily office essentials and stationery',
      parentId: null,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCT_CATEGORIES.INDUSTRIAL,
      name: 'Industrial',
      code: 'IND',
      description: 'Heavy machinery and industrial components',
      parentId: null,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCT_CATEGORIES.RAW_MATERIALS,
      name: 'Raw Materials',
      code: 'RAW',
      description: 'Basic materials for manufacturing',
      parentId: null,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },

    // Level 2
    {
      id: SEED_DATA.PRODUCT_CATEGORIES.COMPONENTS,
      name: 'Components',
      code: 'COMP',
      description: 'Electronic components and parts',
      parentId: SEED_DATA.PRODUCT_CATEGORIES.ELECTRONICS,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCT_CATEGORIES.STATIONERY,
      name: 'Stationery',
      code: 'STAT',
      description: 'Paper, pens, and writing materials',
      parentId: SEED_DATA.PRODUCT_CATEGORIES.OFFICE_SUPPLIES,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },

    // Level 3
    {
      id: SEED_DATA.PRODUCT_CATEGORIES.SEMICONDUCTORS,
      name: 'Semiconductors',
      code: 'SEMI',
      description: 'Integrated circuits and microchips',
      parentId: SEED_DATA.PRODUCT_CATEGORIES.COMPONENTS,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of items) {
    const existing = await db.query.productCategories.findFirst({
      where: eq(productCategories.id, item.id),
    });

    if (!existing) {
      await db.insert(productCategories).values(item);
      console.log(`   - Category '${item.name}' created.`);
    }
  }
}
