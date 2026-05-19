import { z } from 'zod';

export const trendSchema = z.object({
  value: z.number(),
  isPositive: z.boolean(),
});

export const dashboardMetricsSchema = z.object({
  totalSales: z.string(),
  totalSalesTrend: trendSchema.optional(),
  totalPurchases: z.string(),
  totalPurchasesTrend: trendSchema.optional(),
  activeCustomers: z.number(),
  activeCustomersTrend: trendSchema.optional(),
  totalProducts: z.number(),
  totalProductsTrend: trendSchema.optional(),
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

export const performancePointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  expenses: z.number(),
});

export type PerformancePoint = z.infer<typeof performancePointSchema>;

export const dashboardResponseSchema = z.object({
  metrics: dashboardMetricsSchema,
  lowStockItems: z.array(lowStockItemSchema),
  recentActivity: z.array(recentActivitySchema),
  performanceData: z.array(performancePointSchema),
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
