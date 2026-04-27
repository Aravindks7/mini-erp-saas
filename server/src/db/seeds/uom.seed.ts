import { db } from '../index.js';
import { unitOfMeasures } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedUoms() {
  console.log('🌱 Seeding Units of Measure...');

  const items = [
    {
      id: SEED_DATA.UOM.PIECES,
      code: 'PCS',
      name: 'Pieces',
      description: 'Individual units',
      isDefault: true,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.UOM.KG,
      code: 'KG',
      name: 'Kilogram',
      description: 'Weight in kilograms',
      isDefault: false,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.UOM.BOX,
      code: 'BOX',
      name: 'Box',
      description: 'Standard packaging box',
      isDefault: false,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.UOM.LITER,
      code: 'LTR',
      name: 'Liter',
      description: 'Liquid volume in liters',
      isDefault: false,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.UOM.METER,
      code: 'MTR',
      name: 'Meter',
      description: 'Length in meters',
      isDefault: false,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.UOM.PALLET,
      code: 'PLT',
      name: 'Pallet',
      description: 'Shipping pallet',
      isDefault: false,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of items) {
    const existing = await db.query.unitOfMeasures.findFirst({
      where: eq(unitOfMeasures.id, item.id),
    });

    if (!existing) {
      await db.insert(unitOfMeasures).values(item);
      console.log(`   - UoM '${item.code}' created.`);
    }
  }
}
