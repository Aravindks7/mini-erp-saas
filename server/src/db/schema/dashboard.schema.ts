import { pgTable, uuid, numeric, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations.schema.js';

/**
 * Dashboard Metrics Secure View (Mapped as pgTable)
 * Axiom: Mapped to the 'dashboard_metrics' view which filters 'mv_dashboard_metrics_data'.
 * Note: We use pgTable here instead of pgView to enable Drizzle's Relational Query API (db.query)
 * and relations, which are currently restricted for pgView.
 */
export const dashboardMetrics = pgTable('dashboard_metrics', {
  organizationId: uuid('organization_id')
    .primaryKey()
    .references(() => organizations.id),
  totalSales: numeric('total_sales').notNull(),
  totalPurchases: numeric('total_purchases').notNull(),
  activeCustomers: bigint('active_customers', { mode: 'number' }).notNull(),
  totalProducts: bigint('total_products', { mode: 'number' }).notNull(),
});

export const dashboardMetricsRelations = relations(dashboardMetrics, ({ one }) => ({
  organization: one(organizations, {
    fields: [dashboardMetrics.organizationId],
    references: [organizations.id],
  }),
}));
