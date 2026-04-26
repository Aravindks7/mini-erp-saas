import { db } from '../index.js';
import { products } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedProducts() {
  console.log('🌱 Seeding Products...');

  const items = [
    {
      id: SEED_DATA.PRODUCTS.WIDGET_A,
      sku: 'WIDGET-A',
      name: 'Industrial Widget A',
      description: 'High-grade industrial widget',
      basePrice: '125.50',
      baseUomId: SEED_DATA.UOM.PIECES,
      taxId: SEED_DATA.TAXES.VAT_STANDARD,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCTS.WIDGET_B,
      sku: 'WIDGET-B',
      name: 'Eco Widget B',
      description: 'Environmentally friendly widget',
      basePrice: '89.99',
      baseUomId: SEED_DATA.UOM.PIECES,
      taxId: SEED_DATA.TAXES.VAT_ZERO,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of items) {
    const existing = await db.query.products.findFirst({
      where: eq(products.id, item.id),
    });

    if (!existing) {
      await db.insert(products).values(item);
      console.log(`   - Product '${item.name}' created.`);
    }
  }
}
