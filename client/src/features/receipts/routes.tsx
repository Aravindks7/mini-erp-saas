import { lazy } from 'react';
import { PackageSearch } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const ReceiptsListPage = lazy(() => import('./pages/ReceiptsListPage'));

export const receiptRoutes: AppRoute[] = [
  {
    path: 'receipts',
    handle: {
      title: 'Goods Receipts',
      icon: PackageSearch,
      showInSidebar: true,
      sidebarGroup: 'Purchasing',
      order: 30,
      crumb: 'Goods Receipts',
    },
    children: [
      {
        index: true,
        element: <ReceiptsListPage />,
      },
    ],
  },
];
