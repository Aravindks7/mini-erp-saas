import { Settings } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import type { AppRoute } from '@/lib/types/navigation';
import SettingsPage from './pages/SettingsPage';
import { OrgProfileTab } from '../organizations/components/OrgProfileTab';
import { MembersTab } from '../organizations/components/MembersTab';
import { InvitationsTab } from '../organizations/components/InvitationsTab';
import { RolesTab } from '../organizations/components/RolesTab';
import { PermissionSetsTab } from '../organizations/components/PermissionSetsTab';
import RoleFormPage from '../organizations/pages/RoleFormPage';
import PermissionSetFormPage from '../organizations/pages/PermissionSetFormPage';

export const settingsRoutes: AppRoute[] = [
  // The main settings layout with tabs
  {
    path: 'settings',
    element: <SettingsPage />,
    handle: {
      title: 'Settings',
      icon: Settings,
      showInSidebar: false,
      order: 100,
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
        },
      },
      {
        path: 'members',
        element: <MembersTab />,
        handle: {
          title: 'Workspace Members',
        },
      },
      {
        path: 'invites',
        element: <InvitationsTab />,
        handle: {
          title: 'Pending Invitations',
        },
      },
      {
        path: 'roles',
        element: <RolesTab />,
        handle: {
          title: 'Roles',
        },
      },
      {
        path: 'permission-sets',
        element: <PermissionSetsTab />,
        handle: {
          title: 'Permission Sets',
        },
      },
    ],
  },
  // Full-page forms (Outside the tabbed SettingsPage layout)
  {
    path: 'settings/roles/new',
    element: <RoleFormPage />,
    handle: {
      title: 'New Role',
      crumb: 'New Role',
    },
  },
  {
    path: 'settings/roles/:id',
    element: <RoleFormPage />,
    handle: {
      title: 'Edit Role',
      crumb: 'Edit Role',
    },
  },
  {
    path: 'settings/permission-sets/new',
    element: <PermissionSetFormPage />,
    handle: {
      title: 'New Permission Set',
      crumb: 'New Permission Set',
    },
  },
  {
    path: 'settings/permission-sets/:id',
    element: <PermissionSetFormPage />,
    handle: {
      title: 'Edit Permission Set',
      crumb: 'Edit Permission Set',
    },
  },
];
