import { z } from 'zod';

export const dashboardMetricsSchema = z.object({
  totalSales: z.string(),
  totalPurchases: z.string(),
  activeCustomers: z.number(),
  totalProducts: z.number(),
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

export const lowStockItemSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  quantityOnHand: z.string(),
  warehouseName: z.string(),
});

export type LowStockItem = z.infer<typeof lowStockItemSchema>;

export const recentActivitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['sales_order', 'purchase_order']),
  documentNumber: z.string(),
  status: z.string(),
  amount: z.string(),
  customerOrSupplierName: z.string(),
  createdAt: z.string(),
});

export type RecentActivity = z.infer<typeof recentActivitySchema>;

export const dashboardResponseSchema = z.object({
  metrics: dashboardMetricsSchema,
  lowStockItems: z.array(lowStockItemSchema),
  recentActivity: z.array(recentActivitySchema),
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
