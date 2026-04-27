import { db } from '../../db/index.js';
import {
  dashboardMetrics,
  inventoryLevels,
  products,
  warehouses,
  salesOrders,
} from '../../db/schema/index.js';
import { desc, eq, lt, and, sql } from 'drizzle-orm';
import type {
  DashboardMetrics,
  LowStockItem,
  RecentActivity,
} from '#shared/contracts/dashboard.contract.js';

export class DashboardService {
  /**
   * Retrieves high-level metrics from the Materialized View.
   * Axiom: Leverages a transaction to set the session context for the Secure View.
   */
  async getMetrics(organizationId: string): Promise<DashboardMetrics> {
    return await db.transaction(async (tx) => {
      // Set the session context for the Secure View filter
      await tx.execute(
        sql`SELECT set_config('app.current_organization_id', ${organizationId}, true)`,
      );

      const result = await tx.query.dashboardMetrics.findFirst({
        where: eq(dashboardMetrics.organizationId, organizationId),
      });

      return {
        totalSales: result?.totalSales || '0',
        totalPurchases: result?.totalPurchases || '0',
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
      ) // Threshold 10
      .orderBy(inventoryLevels.quantityOnHand)
      .limit(limit);

    return results;
  }

  /**
   * Fetches recent sales order activity.
   */
  async getRecentActivity(organizationId: string, limit = 5): Promise<RecentActivity[]> {
    const results = await db.query.salesOrders.findMany({
      where: eq(salesOrders.organizationId, organizationId),
      with: {
        customer: true,
      },
      orderBy: [desc(salesOrders.createdAt)],
      limit,
    });

    return results.map((so) => ({
      id: so.id,
      type: 'sales_order' as const,
      documentNumber: so.documentNumber,
      status: so.status,
      amount: so.totalAmount || '0',
      customerOrSupplierName: so.customer.companyName,
      createdAt: so.createdAt.toISOString(),
    }));
  }

  /**
   * Triggers a concurrent refresh of the Materialized View.
   */
  async refreshMetrics() {
    await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics_data`);
  }
}

export const dashboardService = new DashboardService();
