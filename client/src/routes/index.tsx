import { createBrowserRouter } from 'react-router-dom';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import UsersPage from '@/pages/users/UsersPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { TenantGuard } from '@/components/guards/TenantGuard';

import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';
import SelectOrganizationPage from '@/pages/auth/SelectOrganization';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/select-organization',
    element: (
      <AuthGuard>
        <SelectOrganizationPage />
      </AuthGuard>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <TenantGuard>
          <DashboardLayout />
        </TenantGuard>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);
