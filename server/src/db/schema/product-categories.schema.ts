import { AnyPgColumn, pgTable, text, index, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';

export const productCategories = pgTable(
  'product_categories',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,
    name: text('name').notNull(),
    code: text('code').notNull(),
    description: text('description'),
    parentId: uuid('parent_id').references((): AnyPgColumn => productCategories.id),
  },
  (table) => [
    index('pc_org_idx').on(table.organizationId),
    uniqueIndex('pc_org_code_unique')
      .on(table.organizationId, table.code)
      .where(sql`${table.deletedAt} IS NULL`),
    index('pc_parent_idx').on(table.parentId),
  ],
);

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [productCategories.organizationId],
    references: [organizations.id],
  }),
  parent: one(productCategories, {
    fields: [productCategories.parentId],
    references: [productCategories.id],
    relationName: 'parent_child',
  }),
  children: many(productCategories, { relationName: 'parent_child' }),
}));
