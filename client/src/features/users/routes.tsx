import { Users } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import UsersPage from './pages/UsersPage';

export const usersRoutes: AppRoute[] = [
  {
    path: 'users',
    element: <UsersPage />,
    handle: {
      title: 'Users',
      icon: Users,
      showInSidebar: true,
      crumb: 'Users',
    },
  },
];
