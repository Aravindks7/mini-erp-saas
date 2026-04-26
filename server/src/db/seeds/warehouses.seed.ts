import { db } from '../index.js';
import { warehouses, bins } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedWarehouses() {
  console.log('🌱 Seeding Warehouses & Bins...');

  const warehouseItems = [
    {
      id: SEED_DATA.WAREHOUSES.MAIN,
      code: 'WH-MAIN',
      name: 'Main Distribution Center',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.WAREHOUSES.SECONDARY,
      code: 'WH-SEC',
      name: 'Secondary Storage',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of warehouseItems) {
    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, item.id),
    });

    if (!existing) {
      await db.insert(warehouses).values(item);
      console.log(`   - Warehouse '${item.name}' created.`);
    }
  }

  const binItems = [
    {
      id: SEED_DATA.BINS.MAIN_A1,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      code: 'A1',
      name: 'Aisle 1',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.BINS.MAIN_B1,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      code: 'B1',
      name: 'Aisle 2',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of binItems) {
    const existing = await db.query.bins.findFirst({
      where: eq(bins.id, item.id),
    });

    if (!existing) {
      await db.insert(bins).values(item);
      console.log(`   - Bin '${item.code}' created for Warehouse.`);
    }
  }
}
