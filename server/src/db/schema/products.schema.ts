import {
  pgTable,
  text,
  index,
  uniqueIndex,
  pgEnum,
  uuid,
  numeric,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { unitOfMeasures, productUomConversions } from './uom.schema.js';
import { taxes } from './taxes.schema.js';

export const productStatusEnum = pgEnum('product_status', ['active', 'inactive']);

export const products = pgTable(
  'products',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    sku: text('sku').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    basePrice: numeric('base_price', { precision: 18, scale: 8 }).notNull(),

    baseUomId: uuid('base_uom_id')
      .notNull()
      .references(() => unitOfMeasures.id),
    taxId: uuid('tax_id').references(() => taxes.id),

    status: productStatusEnum('status').default('active').notNull(),
  },
  (table) => [
    index('products_org_idx').on(table.organizationId),
    index('products_name_idx').on(table.name),
    uniqueIndex('products_org_sku_unique')
      .on(table.organizationId, sql`lower(${table.sku})`)
      .where(sql`${table.sku} IS NOT NULL AND ${table.deletedAt} IS NULL`),
    check('products_base_price_check', sql`${table.basePrice} >= 0`),
  ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  baseUom: one(unitOfMeasures, {
    fields: [products.baseUomId],
    references: [unitOfMeasures.id],
  }),
  tax: one(taxes, {
    fields: [products.taxId],
    references: [taxes.id],
  }),
  uomConversions: many(productUomConversions),
}));

export type Product = typeof products.$inferSelect;
