import { Ruler } from 'lucide-react';
import { lazy } from 'react';
import type { AppRoute } from '@/lib/types/navigation';
import { queryClient } from '@/lib/query-client';
import { uomDetailQuery } from './hooks/uoms.hooks';
import type { UomResponse } from './api/uoms.api';

const UomsListPage = lazy(() => import('./pages/UomsListPage'));
const UomDetailsPage = lazy(() => import('./pages/UomDetailsPage'));

export const uomRoutes: AppRoute[] = [
  {
    path: 'uom',
    handle: {
      title: 'Units of Measure',
      icon: Ruler,
      showInSidebar: true,
      sidebarGroup: 'Setup',
      order: 20,
      crumb: 'Units of Measure',
    },
    children: [
      {
        index: true,
        element: <UomsListPage />,
      },
      {
        path: ':id',
        element: <UomDetailsPage />,
        loader: async ({ params }) => {
          if (!params.id) throw new Error('No id provided');
          return queryClient.ensureQueryData(uomDetailQuery(params.id));
        },
        handle: {
          crumb: (data: UomResponse) => data?.code ?? 'Details',
        },
      },
    ],
  },
];
