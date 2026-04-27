import { lazy } from 'react';
import { CreditCard } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const PaymentsListPage = lazy(() => import('./pages/PaymentsListPage'));

export const paymentRoutes: AppRoute[] = [
  {
    path: 'payments',
    handle: {
      title: 'Payments',
      icon: CreditCard,
      showInSidebar: true,
      sidebarGroup: 'Financials',
      order: 10,
      crumb: 'Payments',
    },
    children: [
      {
        index: true,
        element: <PaymentsListPage />,
      },
    ],
  },
];
