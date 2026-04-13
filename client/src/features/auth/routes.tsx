import type { RouteObject } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import SelectOrganizationPage from './pages/SelectOrganization';
import OnboardingPage from './pages/Onboarding';
import AuthLayout from '@/components/shared/AuthLayout';
import { GuestGuard } from '@/components/guards/GuestGuard';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { RouteErrorBoundary } from '@/components/shared/RouteErrorBoundary';

export const authRoutes: RouteObject[] = [
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
];
