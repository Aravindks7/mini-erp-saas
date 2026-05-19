import type { RouteObject } from 'react-router-dom';
import type { AppRoute } from '@/lib/types/navigation';

import { authRoutes } from '@/features/auth/routes';
import { dashboardRoutes as coreDashboardRoutes } from '@/features/dashboard/routes';
import { salesRoutes } from '@/features/sales/routes';
import { purchasingRoutes } from '@/features/purchasing/routes';
import { inventoryRoutes } from '@/features/inventory/routes';
import { financeRoutes } from '@/features/finance/routes';
import { setupRoutes } from '@/features/setup/routes';
import { settingsRoutes } from '@/features/settings/routes';
import { activityRoutes } from '@/features/activity/routes';

/**
 * Registry of all dashboard-internal routes.
 * Organized hierarchically via category-level feature modules.
 */
export const dashboardRoutes: AppRoute[] = [
  ...coreDashboardRoutes,
  ...salesRoutes,
  ...purchasingRoutes,
  ...inventoryRoutes,
  ...financeRoutes,
  ...setupRoutes,
  ...settingsRoutes,
  ...activityRoutes,
];

/**
 * Registry of all top-level public/auth routes.
 */
export const publicRoutes: RouteObject[] = [...authRoutes];
