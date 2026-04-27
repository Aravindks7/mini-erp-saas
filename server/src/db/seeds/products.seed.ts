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
    {
      id: SEED_DATA.PRODUCTS.STEEL_SHEET,
      sku: 'RAW-STEEL-01',
      name: 'Steel Sheet (2mm)',
      description: 'Galvanized steel sheet',
      basePrice: '45.00',
      baseUomId: SEED_DATA.UOM.METER,
      taxId: SEED_DATA.TAXES.VAT_STANDARD,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCTS.COPPER_WIRE,
      sku: 'RAW-COPP-01',
      name: 'Copper Wire (100m)',
      description: 'Insulated copper wiring',
      basePrice: '150.00',
      baseUomId: SEED_DATA.UOM.KG,
      taxId: SEED_DATA.TAXES.VAT_STANDARD,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCTS.OFFICE_PAPER,
      sku: 'CONS-PAPER-A4',
      name: 'A4 Printing Paper',
      description: 'Premium white paper (500 sheets)',
      basePrice: '12.00',
      baseUomId: SEED_DATA.UOM.BOX,
      taxId: SEED_DATA.TAXES.VAT_REDUCED,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCTS.INK_CARTRIDGE,
      sku: 'CONS-INK-BLK',
      name: 'Black Ink Cartridge',
      description: 'High capacity ink cartridge',
      basePrice: '45.00',
      baseUomId: SEED_DATA.UOM.PIECES,
      taxId: SEED_DATA.TAXES.VAT_STANDARD,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCTS.MICROCHIP_X,
      sku: 'COMP-CHIP-X',
      name: 'Processor Chip X1',
      description: 'Advanced computing microchip',
      basePrice: '250.00',
      baseUomId: SEED_DATA.UOM.PIECES,
      taxId: SEED_DATA.TAXES.EXEMPT,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCTS.LED_DISPLAY,
      sku: 'COMP-LED-15',
      name: '15-inch LED Display',
      description: 'Crystal clear resolution LED screen',
      basePrice: '180.00',
      baseUomId: SEED_DATA.UOM.PIECES,
      taxId: SEED_DATA.TAXES.VAT_STANDARD,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCTS.PACKAGING_BOX,
      sku: 'SHIP-BOX-LG',
      name: 'Large Shipping Box',
      description: 'Double-walled cardboard box',
      basePrice: '2.50',
      baseUomId: SEED_DATA.UOM.PIECES,
      taxId: SEED_DATA.TAXES.VAT_ZERO,
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.PRODUCTS.ASSEMBLY_KIT,
      sku: 'PROD-KIT-01',
      name: 'Full Assembly Kit',
      description: 'Complete kit for product assembly',
      basePrice: '500.00',
      baseUomId: SEED_DATA.UOM.PALLET,
      taxId: SEED_DATA.TAXES.VAT_STANDARD,
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
