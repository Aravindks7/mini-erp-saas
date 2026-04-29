import { lazy } from 'react';
import { PackageSearch } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const ReceiptsListPage = lazy(() => import('./pages/ReceiptsListPage'));
const ReceiptFormPage = lazy(() => import('./pages/ReceiptFormPage'));
const ReceiptDetailsPage = lazy(() => import('./pages/ReceiptDetailsPage'));

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
      {
        path: 'new',
        element: <ReceiptFormPage />,
        handle: {
          title: 'Receive Goods',
          crumb: 'New Receipt',
        },
      },
      {
        path: ':id',
        element: <ReceiptDetailsPage />,
        handle: {
          title: 'Receipt Details',
          crumb: (data: { receiptNumber?: string }) => data?.receiptNumber || 'Details',
        },
      },
    ],
  },
];
