import { Settings2 } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import SetupModulePage from './pages/SetupModulePage';
import { productCategoryRoutes } from '../product-categories/routes';
import { uomRoutes } from '../uom/routes';
import { taxRoutes } from '../taxes/routes';
import { warehouseRoutes } from '../warehouses/routes';

export const setupRoutes: AppRoute[] = [
  {
    path: 'setup',
    handle: {
      title: 'Setup',
      icon: Settings2,
      crumb: 'Setup',
      sidebarGroup: 'Setup',
      isModuleRoot: true,
      showInSidebar: true,
      hidden: true,
    },
    children: [
      {
        index: true,
        element: <SetupModulePage />,
      },
      ...productCategoryRoutes,
      ...uomRoutes,
      ...taxRoutes,
      ...warehouseRoutes,
    ],
  },
];
