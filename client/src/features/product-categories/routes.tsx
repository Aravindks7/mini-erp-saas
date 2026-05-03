import { lazy } from 'react';
import { Tags } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { PERMISSIONS } from '@shared/index';

const CategoryListPage = lazy(() => import('./pages/CategoryListPage'));

export const productCategoryRoutes: AppRoute[] = [
  {
    path: 'product-categories',
    element: <CategoryListPage />,
    handle: {
      title: 'Product Categories',
      icon: Tags,
      permission: PERMISSIONS.PRODUCTS.READ,
      crumb: 'Product Categories',
      showInSidebar: true,
      sidebarGroup: 'Inventory',
      order: 2,
    },
  },
];
