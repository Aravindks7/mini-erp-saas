import { lazy } from 'react';
import { Factory } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const WorkOrdersListPage = lazy(() => import('./pages/WorkOrdersListPage'));

export const workOrderRoutes: AppRoute[] = [
  {
    path: 'work-orders',
    handle: {
      title: 'Work Orders',
      icon: Factory,
      showInSidebar: true,
      sidebarGroup: 'Manufacturing',
      order: 20,
      crumb: 'Work Orders',
    },
    children: [
      {
        index: true,
        element: <WorkOrdersListPage />,
      },
    ],
  },
];
