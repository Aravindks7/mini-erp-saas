import { Percent } from 'lucide-react';
import { lazy } from 'react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { taxDetailQuery } from './hooks/taxes.hooks';
import type { TaxResponse } from './api/taxes.api';

const TaxesListPage = lazy(() => import('./pages/TaxesListPage'));
const TaxDetailsPage = lazy(() => import('./pages/TaxDetailsPage'));

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
      {
        path: ':id',
        element: <TaxDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(taxDetailQuery(params.id));
        },
        handle: {
          crumb: (data: TaxResponse) => data?.name ?? 'Details',
        },
      },
    ],
  },
];
