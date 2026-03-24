import { pgTable, text, pgEnum, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking } from './base.schema';

// Organizations Table
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...timestamps,
  ...userTracking,

  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
}));

// Base columns used across the application for multi-tenancy
export const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
};

// Users
export const userRoleEnum = pgEnum('user_role', ['admin', 'employee']);

export const users = pgTable(
  'users',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    email: text('email').unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    role: userRoleEnum('role').default('employee').notNull(),
  },
  (table) => [
    index('users_org_idx').on(table.organizationId),
    index('users_email_idx').on(table.email),
  ],
);

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));
