import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * GuestGuard prevents authenticated users from visiting public-only routes
 * (like Login and Register) by redirecting them back to the Dashboard.
 */
export const GuestGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending } = useAuth();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <div className="text-sm text-zinc-500 font-medium animate-pulse">Verifying access...</div>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to the dashboard
  if (session?.user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
