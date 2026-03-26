import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps } from './base.schema';
import { organizations } from './core';

// ---------------------------------------------------------------------------
// Better Auth — required tables (manually defined for Drizzle Kit ownership)
// Field names must match Better Auth's internal expectations exactly.
// Ref: https://www.better-auth.com/docs/installation#configure-database
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------------------------------------------------------------------------
// Multi-Tenancy — bridge table (userId → organizationId + role)
// Supports users belonging to multiple organisations.
// ---------------------------------------------------------------------------

export const memberRoleEnum = pgEnum('member_role', ['admin', 'employee']);

export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('employee'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('org_member_unique_idx').on(t.userId, t.organizationId),
    index('org_member_org_idx').on(t.organizationId),
    index('org_member_user_idx').on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Invitation System — track pending invites for non-existent users
// ---------------------------------------------------------------------------

export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'revoked']);

export const organizationInvites = pgTable(
  'organization_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    invitedById: uuid('invited_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('employee'),
    status: inviteStatusEnum('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at').notNull(),
    ...timestamps,
  },
  (t) => [
    index('org_invite_email_idx').on(t.email),
    index('org_invite_org_idx').on(t.organizationId),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(organizationMemberships),
  sentInvites: many(organizationInvites),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const organizationMembershipsRelations = relations(organizationMemberships, ({ one }) => ({
  user: one(user, {
    fields: [organizationMemberships.userId],
    references: [user.id],
  }),
  organization: one(organizations, {
    fields: [organizationMemberships.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationInvitesRelations = relations(organizationInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvites.organizationId],
    references: [organizations.id],
  }),
  invitedBy: one(user, {
    fields: [organizationInvites.invitedById],
    references: [user.id],
  }),
}));

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;

export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembership = typeof organizationMemberships.$inferInsert;

export type OrganizationInvite = typeof organizationInvites.$inferSelect;
export type NewOrganizationInvite = typeof organizationInvites.$inferInsert;
