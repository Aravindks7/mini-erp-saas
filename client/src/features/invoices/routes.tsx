import { lazy } from 'react';
import { FileText } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const InvoicesListPage = lazy(() => import('./pages/InvoicesListPage'));

export const invoiceRoutes: AppRoute[] = [
  {
    path: 'invoices',
    handle: {
      title: 'Invoices',
      icon: FileText,
      showInSidebar: true,
      sidebarGroup: 'Sales',
      order: 40,
      crumb: 'Invoices',
    },
    children: [
      {
        index: true,
        element: <InvoicesListPage />,
      },
    ],
  },
];
