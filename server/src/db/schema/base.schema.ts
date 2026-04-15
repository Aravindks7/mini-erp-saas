import { uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.schema.js';

// ---------------------------------------------------------------------------
// Base columns injected into every business table for multi-tenancy.
// Every table that stores tenant-specific data must spread `baseColumns`.
// ---------------------------------------------------------------------------

export const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
};
