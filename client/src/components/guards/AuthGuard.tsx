import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending } = useAuth();
  const location = useLocation();

  if (isPending) {
    // Return a minimal loading state while standardizing auth checks.
    // This is especially important after sign-in/register when we invalidate the session.
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <div className="text-sm text-zinc-500 font-medium animate-pulse">
            Verifying session...
          </div>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to Login, maintaining their intended destination
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
