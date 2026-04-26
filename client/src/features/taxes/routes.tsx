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
