import { lazy } from 'react';
import { Layers } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const BOMListPage = lazy(() => import('./pages/BOMListPage'));

export const bomRoutes: AppRoute[] = [
  {
    path: 'bom',
    handle: {
      title: 'Bill of Materials',
      icon: Layers,
      showInSidebar: true,
      sidebarGroup: 'Manufacturing',
      order: 10,
      crumb: 'BOM',
    },
    children: [
      {
        index: true,
        element: <BOMListPage />,
      },
    ],
  },
];
