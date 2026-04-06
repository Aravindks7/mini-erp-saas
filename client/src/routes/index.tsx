import { createBrowserRouter } from 'react-router-dom';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import UsersPage from '@/features/users/pages/UsersPage';
import SettingsPage from '@/features/settings/pages/SettingsPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { TenantGuard } from '@/components/guards/TenantGuard';
import { GuestGuard } from '@/components/guards/GuestGuard';

import LoginPage from '@/features/auth/pages/Login';
import RegisterPage from '@/features/auth/pages/Register';
import SelectOrganizationPage from '@/features/auth/pages/SelectOrganization';
import CustomersPage from '@/features/customers/pages/CustomersPage';
import CustomerEditPage from '@/features/customers/pages/CustomerEditPage';
import CustomerDetailsPage from '@/features/customers/pages/CustomerDetailsPage';
import OnboardingPage from '@/features/auth/pages/Onboarding';

import AuthLayout from '@/components/shared/AuthLayout';
import { RouteErrorBoundary } from '@/components/shared/RouteErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/login',
    errorElement: <RouteErrorBoundary />,
    element: (
      <GuestGuard>
        <AuthLayout
          title="Welcome Back"
          description="Enter your credentials to access your account"
        >
          <LoginPage />
        </AuthLayout>
      </GuestGuard>
    ),
  },
  {
    path: '/register',
    errorElement: <RouteErrorBoundary />,
    element: (
      <GuestGuard>
        <AuthLayout title="Create Account" description="Join CloudERP SaaS to manage your business">
          <RegisterPage />
        </AuthLayout>
      </GuestGuard>
    ),
  },
  {
    path: '/select-organization',
    errorElement: <RouteErrorBoundary />,
    element: (
      <AuthGuard>
        <AuthLayout
          title="Select Organization"
          description="Choose a workspace to continue your work"
        >
          <SelectOrganizationPage />
        </AuthLayout>
      </AuthGuard>
    ),
  },
  {
    path: '/onboarding',
    errorElement: <RouteErrorBoundary />,
    element: (
      <AuthGuard>
        <AuthLayout title="Welcome to CloudERP" description="Let's set up your first organization">
          <OnboardingPage />
        </AuthLayout>
      </AuthGuard>
    ),
  },
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
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
