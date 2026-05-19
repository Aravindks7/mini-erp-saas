import { db } from '../../db/index.js';
import {
  dashboardMetrics,
  inventoryLevels,
  products,
  warehouses,
  salesOrders,
  purchaseOrders,
} from '../../db/schema/index.js';
import { desc, eq, lt, and, sql } from 'drizzle-orm';
import { type PgColumn } from 'drizzle-orm/pg-core';
import type {
  DashboardMetrics,
  LowStockItem,
  RecentActivity,
  PerformancePoint,
} from '#shared/contracts/dashboard.contract.js';

export class DashboardService {
  /**
   * Retrieves high-level metrics from the Materialized View.
   * Axiom: Leverages a transaction to set the session context for the Secure View.
   */
  /**
   * Retrieves high-level metrics with trend analysis.
   * Axiom: Compares current 30-day window against the previous 30-day window.
   */
  async getMetrics(organizationId: string): Promise<DashboardMetrics> {
    return await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_organization_id', ${organizationId}, true)`,
      );

      const result = await tx.query.dashboardMetrics.findFirst({
        where: eq(dashboardMetrics.organizationId, organizationId),
      });

      // Calculate trends for Sales and Purchases
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const calculateTrend = async (
        table: typeof salesOrders | typeof purchaseOrders,
        dateCol: PgColumn,
        amountCol: PgColumn,
      ) => {
        const currentRes = await tx
          .select({ total: sql<number>`SUM(${amountCol})` })
          .from(table)
          .where(
            and(eq(table.organizationId, organizationId), sql`${dateCol} >= ${thirtyDaysAgo}`),
          );

        const previousRes = await tx
          .select({ total: sql<number>`SUM(${amountCol})` })
          .from(table)
          .where(
            and(
              eq(table.organizationId, organizationId),
              sql`${dateCol} >= ${sixtyDaysAgo}`,
              sql`${dateCol} < ${thirtyDaysAgo}`,
            ),
          );

        const current = Number(currentRes[0]?.total || 0);
        const previous = Number(previousRes[0]?.total || 0);

        if (previous === 0) return { value: 0, isPositive: current > 0 };
        const diff = ((current - previous) / previous) * 100;
        return { value: Math.abs(Math.round(diff)), isPositive: diff >= 0 };
      };

      const salesTrend = await calculateTrend(
        salesOrders,
        salesOrders.createdAt,
        salesOrders.totalAmount,
      );
      const purchaseTrend = await calculateTrend(
        purchaseOrders,
        purchaseOrders.createdAt,
        purchaseOrders.totalAmount,
      );

      return {
        totalSales: result?.totalSales || '0',
        totalSalesTrend: salesTrend,
        totalPurchases: result?.totalPurchases || '0',
        totalPurchasesTrend: purchaseTrend,
        activeCustomers: Number(result?.activeCustomers || 0),
        totalProducts: Number(result?.totalProducts || 0),
      };
    });
  }

  /**
   * Identifies items with low stock levels.
   */
  async getLowStockItems(organizationId: string, limit = 5): Promise<LowStockItem[]> {
    const results = await db
      .select({
        productId: products.id,
        sku: products.sku,
        name: products.name,
        quantityOnHand: inventoryLevels.quantityOnHand,
        warehouseName: warehouses.name,
      })
      .from(inventoryLevels)
      .innerJoin(products, eq(inventoryLevels.productId, products.id))
      .innerJoin(warehouses, eq(inventoryLevels.warehouseId, warehouses.id))
      .where(
        and(
          eq(inventoryLevels.organizationId, organizationId),
          lt(inventoryLevels.quantityOnHand, '10'),
        ),
      )
      .orderBy(inventoryLevels.quantityOnHand)
      .limit(limit);

    return results;
  }

  /**
   * Fetches recent business activity across sales and purchasing domains.
   * Axiom: Merges domain silos to provide a unified operational timeline.
   */
  async getRecentActivity(organizationId: string, limit = 5): Promise<RecentActivity[]> {
    const sales = await db.query.salesOrders.findMany({
      where: eq(salesOrders.organizationId, organizationId),
      with: { customer: true },
      orderBy: [desc(salesOrders.createdAt)],
      limit,
    });

    const purchases = await db.query.purchaseOrders.findMany({
      where: eq(purchaseOrders.organizationId, organizationId),
      with: { supplier: true },
      orderBy: [desc(purchaseOrders.createdAt)],
      limit,
    });

    const combined: RecentActivity[] = [
      ...sales.map((so) => ({
        id: so.id,
        type: 'sales_order' as const,
        documentNumber: so.documentNumber,
        status: so.status,
        amount: so.totalAmount || '0',
        customerOrSupplierName: so.customer.companyName,
        createdAt: so.createdAt.toISOString(),
      })),
      ...purchases.map((po) => ({
        id: po.id,
        type: 'purchase_order' as const,
        documentNumber: po.documentNumber,
        status: po.status,
        amount: po.totalAmount || '0',
        customerOrSupplierName: po.supplier.name,
        createdAt: po.createdAt.toISOString(),
      })),
    ];

    return combined
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Aggregates revenue and expenses over the last 30 days.
   * Axiom: Uses a 30-day window to provide trend analysis for the performance chart.
   */
  async getPerformanceData(organizationId: string): Promise<PerformancePoint[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get daily sales totals
    const salesResults = await db
      .select({
        date: sql<string>`DATE(${salesOrders.createdAt})`,
        amount: sql<number>`SUM(${salesOrders.totalAmount})`,
      })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.organizationId, organizationId),
          sql`${salesOrders.createdAt} >= ${thirtyDaysAgo}`,
        ),
      )
      .groupBy(sql`DATE(${salesOrders.createdAt})`);

    // Get daily purchase totals
    const purchaseResults = await db
      .select({
        date: sql<string>`DATE(${purchaseOrders.createdAt})`,
        amount: sql<number>`SUM(${purchaseOrders.totalAmount})`,
      })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.organizationId, organizationId),
          sql`${purchaseOrders.createdAt} >= ${thirtyDaysAgo}`,
        ),
      )
      .groupBy(sql`DATE(${purchaseOrders.createdAt})`);

    // Merge into a single chronological timeline
    const dataMap = new Map<string, PerformancePoint>();

    // Seed the map with the last 30 days to ensure continuous data points
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
      dataMap.set(dateStr, { date: dateStr, revenue: 0, expenses: 0 });
    }

    salesResults.forEach((r) => {
      const entry = dataMap.get(r.date);
      if (entry) entry.revenue = Number(r.amount);
    });

    purchaseResults.forEach((r) => {
      const entry = dataMap.get(r.date);
      if (entry) entry.expenses = Number(r.amount);
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Triggers a concurrent refresh of the Materialized View.
   */
  async refreshMetrics() {
    await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics_data`);
  }
}

export const dashboardService = new DashboardService();
