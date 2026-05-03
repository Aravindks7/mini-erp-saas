import { db } from '../index.js';
import { warehouses, bins, addresses, warehouseAddresses } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedWarehouses() {
  console.log('🌱 Seeding Warehouses, Addresses & Bins...');

  const warehouseItems = [
    {
      id: SEED_DATA.WAREHOUSES.MAIN,
      name: 'Main Warehouse',
      code: 'WH-MAIN',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.WAREHOUSES.SECONDARY,
      name: 'Secondary Storage',
      code: 'WH-SEC',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.WAREHOUSES.DIST_CENTER,
      name: 'Distribution Center',
      code: 'WH-DC',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  const warehouseAddressMap = {
    [SEED_DATA.WAREHOUSES.MAIN]: {
      addressLine1: '123 Logistics Way',
      city: 'Industrial City',
      country: 'United States',
      postalCode: '12345',
      state: 'CA',
    },
    [SEED_DATA.WAREHOUSES.SECONDARY]: {
      addressLine1: '456 Overflow Road',
      city: 'Industrial City',
      country: 'United States',
      postalCode: '12345',
      state: 'CA',
    },
    [SEED_DATA.WAREHOUSES.DIST_CENTER]: {
      addressLine1: '789 Hub Avenue',
      city: 'Logistics Park',
      country: 'United States',
      postalCode: '54321',
      state: 'TX',
    },
  };

  for (const wh of warehouseItems) {
    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, wh.id),
    });

    if (!existing) {
      await db.insert(warehouses).values(wh);
      console.log(`   - Warehouse '${wh.name}' created.`);

      // Create address
      const addrData = warehouseAddressMap[wh.id as keyof typeof warehouseAddressMap];
      const [newAddr] = await db
        .insert(addresses)
        .values({
          organizationId: wh.organizationId,
          name: `${wh.name} Address`,
          addressLine1: addrData!.addressLine1!,
          city: addrData!.city!,
          country: addrData!.country!,
          postalCode: addrData!.postalCode,
          state: addrData!.state,
          createdBy: wh.createdBy,
          updatedBy: wh.updatedBy,
        })
        .returning();

      if (!newAddr) {
        console.error(`     ❌ Failed to create address for warehouse '${wh.name}'.`);
        return;
      }

      // Link address
      await db.insert(warehouseAddresses).values({
        organizationId: wh.organizationId,
        warehouseId: wh.id,
        addressId: newAddr.id,
        isPrimary: true,
        createdBy: wh.createdBy,
        updatedBy: wh.updatedBy,
      });
      console.log(`     * Address linked.`);
    }
  }

  const binItems = [
    // Main Warehouse bins
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
    // Secondary Storage bins — required for inter-warehouse transfer scenarios
    {
      id: SEED_DATA.BINS.SEC_RACK_1,
      warehouseId: SEED_DATA.WAREHOUSES.SECONDARY,
      code: 'SEC-RACK-01',
      name: 'Secondary Rack 1',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.BINS.SEC_RACK_2,
      warehouseId: SEED_DATA.WAREHOUSES.SECONDARY,
      code: 'SEC-RACK-02',
      name: 'Secondary Rack 2',
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    // Distribution Center bins
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
