import { LayoutDashboard } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import DashboardPage from './pages/DashboardPage';

export const dashboardRoutes: AppRoute[] = [
  {
    index: true,
    element: <DashboardPage />,
    handle: {
      title: 'Dashboard',
      icon: LayoutDashboard,
      showInSidebar: true,
    },
  },
];
