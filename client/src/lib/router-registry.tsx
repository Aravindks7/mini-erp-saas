import type { RouteObject } from 'react-router-dom';
import type { AppRoute } from '@/lib/types/navigation';

import { authRoutes } from '@/features/auth/routes';
import { dashboardRoutes as coreDashboardRoutes } from '@/features/dashboard/routes';
import { customerRoutes } from '@/features/customers/routes';
import { supplierRoutes } from '@/features/suppliers/routes';
import { productRoutes } from '@/features/products/routes';
import { uomRoutes } from '@/features/uom/routes';
import { taxRoutes } from '@/features/taxes/routes';
import { warehouseRoutes } from '@/features/warehouses/routes';
import { inventoryRoutes } from '@/features/inventory/routes';
import { purchaseOrdersRoutes } from '@/features/purchase-orders/routes';
import { salesOrdersRoutes } from '@/features/sales-orders/routes';
import { settingsRoutes } from '@/features/settings/routes';

/**
 * Registry of all dashboard-internal routes.
 * Extracted to a separate module to prevent circular dependencies
 * between the app-router and UI components (like SidebarContent).
 */
export const dashboardRoutes: AppRoute[] = [
  ...coreDashboardRoutes,
  ...customerRoutes,
  ...supplierRoutes,
  ...productRoutes,
  ...uomRoutes,
  ...taxRoutes,
  ...warehouseRoutes,
  ...inventoryRoutes,
  ...purchaseOrdersRoutes,
  ...salesOrdersRoutes,
  ...settingsRoutes,
];

/**
 * Registry of all top-level public/auth routes.
 */
export const publicRoutes: RouteObject[] = [...authRoutes];
