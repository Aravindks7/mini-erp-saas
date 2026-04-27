import { Percent } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import TaxesListPage from './pages/TaxesListPage';

export const taxRoutes: AppRoute[] = [
  {
    path: 'taxes',
    handle: {
      title: 'Taxes',
      icon: Percent,
      showInSidebar: true,
      sidebarGroup: 'Inventory',
      order: 60,
      crumb: 'Taxes',
    },
    children: [
      {
        index: true,
        element: <TaxesListPage />,
      },
    ],
  },
];
