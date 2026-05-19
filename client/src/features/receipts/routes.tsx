import { lazy } from 'react';
import { PackageSearch } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { receiptDetailQuery } from './hooks/receipts.hooks';
import type { ReceiptResponse } from './api/receipts.api';

const ReceiptsListPage = lazy(() => import('./pages/ReceiptsListPage'));
const ReceiptFormPage = lazy(() => import('./pages/ReceiptFormPage'));
const ReceiptDetailsPage = lazy(() => import('./pages/ReceiptDetailsPage'));

export const receiptRoutes: AppRoute[] = [
  {
    path: 'receipts',
    handle: {
      title: 'Receipts',
      icon: PackageSearch,
      showInSidebar: true,
      sidebarGroup: 'Purchasing',
      order: 20,
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
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(receiptDetailQuery(params.id));
        },
        handle: {
          title: 'Receipt Details',
          crumb: (data: ReceiptResponse) => data?.receiptNumber || 'Details',
        },
      },
    ],
  },
];
