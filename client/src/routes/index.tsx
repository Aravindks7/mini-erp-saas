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
import CustomersPage from '@/features/customers/pages/CustomersPage';
import CustomerEditPage from '@/features/customers/pages/CustomerEditPage';
import CustomerDetailsPage from '@/features/customers/pages/CustomerDetailsPage';

import AuthLayout from '@/components/shared/AuthLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AuthLayout title="Welcome Back" description="Enter your credentials to access your account">
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthLayout title="Create Account" description="Join CloudERP SaaS to manage your business">
        <RegisterPage />
      </AuthLayout>
    ),
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
      {
        path: 'customers',
        children: [
          {
            index: true,
            element: <CustomersPage />,
          },
          {
            path: 'new',
            element: <CustomerEditPage />,
          },
          {
            path: ':id',
            element: <CustomerDetailsPage />,
          },
          {
            path: ':id/edit',
            element: <CustomerEditPage />,
          },
        ],
      },
    ],
  },
]);
