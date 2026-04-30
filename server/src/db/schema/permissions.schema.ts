import { pgTable, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { permissionSetItems } from './permission-set-items.schema.js';

/**
 * Static Permissions (Seeded from code)
 */
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(), // e.g., 'customers:read'
  description: text('description'),
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
  items: many(permissionSetItems),
}));
