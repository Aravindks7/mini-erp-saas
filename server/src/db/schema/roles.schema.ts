import { pgTable, text, uuid, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { organizations } from './organizations.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { organizationMemberships } from './memberships.schema.js';
import { organizationInvites } from './invites.schema.js';
import { rolePermissionSets } from './role-permission-sets.schema.js';

/**
 * Dynamic Roles
 */
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'cascade',
    }), // NULL for SaaS-wide base roles
    isBaseRole: boolean('is_base_role').notNull().default(false),
    ...timestamps,
    ...userTracking,
  },
  (t) => [
    // Rule 1: Global roles must have unique names
    uniqueIndex('role_global_name_idx')
      .on(t.name)
      .where(sql`${t.organizationId} IS NULL`),
    // Rule 2: Tenant-specific roles must have unique names
    uniqueIndex('role_tenant_name_idx')
      .on(t.name, t.organizationId)
      .where(sql`${t.organizationId} IS NOT NULL`),
  ],
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  permissionSets: many(rolePermissionSets),
  memberships: many(organizationMemberships),
  invites: many(organizationInvites),
}));
