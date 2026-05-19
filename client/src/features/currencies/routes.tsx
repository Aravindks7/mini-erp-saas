import { Coins } from 'lucide-react';
import { lazy } from 'react';
import type { AppRoute } from '@/lib/types/navigation';

const CurrenciesListPage = lazy(() => import('./pages/CurrenciesListPage'));

export const currencyRoutes: AppRoute[] = [
  {
    path: 'currencies',
    handle: {
      title: 'Currencies',
      icon: Coins,
      showInSidebar: true,
      sidebarGroup: 'Setup',
      order: 10,
      crumb: 'Currencies',
    },
    children: [
      {
        index: true,
        element: <CurrenciesListPage />,
      },
    ],
  },
];
