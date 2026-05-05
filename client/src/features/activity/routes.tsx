import { lazy } from 'react';
import type { AppRoute } from '@/lib/types/navigation';

const ActivityPage = lazy(() => import('./pages/ActivityPage'));

export const activityRoutes: AppRoute[] = [
  {
    path: 'activity',
    handle: {
      title: 'Activity',
      crumb: 'Activity',
      // Not shown in sidebar — accessed via UserProfileDropdown
    },
    children: [
      {
        index: true,
        element: <ActivityPage />,
      },
    ],
  },
];
