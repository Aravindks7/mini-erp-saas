import { Ruler } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import UomsListPage from './pages/UomsListPage';

export const uomRoutes: AppRoute[] = [
  {
    path: 'uom',
    handle: {
      title: 'Units of Measure',
      icon: Ruler,
      showInSidebar: true,
      crumb: 'Units of Measure',
    },
    children: [
      {
        index: true,
        element: <UomsListPage />,
      },
    ],
  },
];
