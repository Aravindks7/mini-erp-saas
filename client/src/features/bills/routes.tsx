import { lazy } from 'react';
import { ReceiptText } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const BillsListPage = lazy(() => import('./pages/BillsListPage'));

export const billRoutes: AppRoute[] = [
  {
    path: 'bills',
    handle: {
      title: 'Vendor Bills',
      icon: ReceiptText,
      showInSidebar: true,
      sidebarGroup: 'Purchasing',
      order: 40,
      crumb: 'Vendor Bills',
    },
    children: [
      {
        index: true,
        element: <BillsListPage />,
      },
    ],
  },
];
