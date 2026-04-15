import { Settings } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import type { AppRoute } from '@/lib/types/navigation';
import SettingsPage from './pages/SettingsPage';
import { OrgProfileTab } from '../organizations/components/OrgProfileTab';
import { MembersTab } from '../organizations/components/MembersTab';
import { InvitationsTab } from '../organizations/components/InvitationsTab';

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
    children: [
      {
        index: true,
        element: <Navigate to="profile" replace />,
      },
      {
        path: 'profile',
        element: <OrgProfileTab />,
        handle: {
          title: 'Organization Profile',
          crumb: 'Profile',
        },
      },
      {
        path: 'members',
        element: <MembersTab />,
        handle: {
          title: 'Workspace Members',
          crumb: 'Members',
        },
      },
      {
        path: 'invites',
        element: <InvitationsTab />,
        handle: {
          title: 'Pending Invitations',
          crumb: 'Invitations',
        },
      },
    ],
  },
];
