import { Settings } from 'lucide-react';
import type { AppRoute } from '@/lib/types/navigation';
import SettingsPage from './pages/SettingsPage';

export const settingsRoutes: AppRoute[] = [
  {
    path: 'settings',
    element: <SettingsPage />,
    handle: {
      title: 'Settings',
      icon: Settings,
      showInSidebar: true,
      crumb: 'Settings',
    },
  },
];
