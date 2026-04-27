import { db } from '../index.js';
import { warehouses, bins } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedWarehouses() {
  console.log('🌱 Seeding Warehouses & Bins...');

  const warehouseItems = [
    {
      id: SEED_DATA.WAREHOUSES.MAIN,
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      addressLine1: '123 Logistics Way',
      city: 'Industrial City',
      country: 'United States',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.WAREHOUSES.SECONDARY,
      name: 'Secondary Storage',
      code: 'WH-SEC',
      addressLine1: '456 Overflow Road',
      city: 'Industrial City',
      country: 'United States',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.WAREHOUSES.DIST_CENTER,
      name: 'Distribution Center',
      code: 'WH-DC',
      addressLine1: '789 Hub Avenue',
      city: 'Logistics Park',
      country: 'United States',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const wh of warehouseItems) {
    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, wh.id),
    });

    if (!existing) {
      await db.insert(warehouses).values(wh);
      console.log(`   - Warehouse '${wh.name}' created.`);
    }
  }

  const binItems = [
    {
      id: SEED_DATA.BINS.MAIN_A1,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      code: 'A1-RACK-01',
      name: 'Shelf A1',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.BINS.MAIN_B1,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      code: 'B1-RACK-02',
      name: 'Shelf B1',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.BINS.DC_RACK_1,
      warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
      code: 'DC-RACK-01',
      name: 'High Bay Rack 1',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.BINS.DC_RACK_2,
      warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
      code: 'DC-RACK-02',
      name: 'High Bay Rack 2',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const bin of binItems) {
    const existing = await db.query.bins.findFirst({
      where: eq(bins.id, bin.id),
    });

    if (!existing) {
      await db.insert(bins).values(bin);
      console.log(`   - Bin '${bin.code}' created.`);
    }
  }
}
