import { lazy } from 'react';
import { History } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';

const ActivityPage = lazy(() => import('./pages/ActivityPage'));

export const activityRoutes: AppRoute[] = [
  {
    path: 'activity',
    handle: {
      title: 'Activity',
      icon: History,
      crumb: 'Activity',
      // Accessible via sidebar footer and UserProfileDropdown
    },
    children: [
      {
        index: true,
        element: <ActivityPage />,
      },
    ],
  },
];
