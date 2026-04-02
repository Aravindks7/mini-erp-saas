import { pgTable, text, index, uniqueIndex, uuid, numeric, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { boolean } from 'drizzle-orm/pg-core';
import { products } from './products.schema.js';

/**
 * Unit of Measure (UoM) Module
 */
export const unitOfMeasures = pgTable(
  'unit_of_measures',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').default(false).notNull(),
    ...lifecycle,
  },
  (table) => [
    index('uom_org_idx').on(table.organizationId),
    uniqueIndex('uom_org_code_unique').on(table.organizationId, sql`lower(${table.code})`),
  ],
);

export const unitOfMeasuresRelations = relations(unitOfMeasures, ({ one }) => ({
  organization: one(organizations, {
    fields: [unitOfMeasures.organizationId],
    references: [organizations.id],
  }),
}));

/**
 * Conversion matrix for products to handle multiple transactional units.
 * Precision: numeric(18, 8) to maintain systemic accuracy across calculations.
 */
export const productUomConversions = pgTable(
  'product_uom_conversions',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    fromUomId: uuid('from_uom_id')
      .notNull()
      .references(() => unitOfMeasures.id),
    toUomId: uuid('to_uom_id')
      .notNull()
      .references(() => unitOfMeasures.id),
    conversionFactor: numeric('conversion_factor', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('uom_conv_org_idx').on(table.organizationId),
    index('uom_conv_product_idx').on(table.productId),
    check('product_uom_conv_factor_check', sql`${table.conversionFactor} > 0`),
  ],
);

export const productUomConversionsRelations = relations(productUomConversions, ({ one }) => ({
  organization: one(organizations, {
    fields: [productUomConversions.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [productUomConversions.productId],
    references: [products.id],
  }),
  fromUom: one(unitOfMeasures, {
    fields: [productUomConversions.fromUomId],
    references: [unitOfMeasures.id],
    relationName: 'from_uom',
  }),
  toUom: one(unitOfMeasures, {
    fields: [productUomConversions.toUomId],
    references: [unitOfMeasures.id],
    relationName: 'to_uom',
  }),
}));

export type UnitOfMeasure = typeof unitOfMeasures.$inferSelect;
export type ProductUomConversion = typeof productUomConversions.$inferSelect;
