import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending } = useAuth();
  const location = useLocation();

  if (isPending) {
    // Return a minimal loading state while standardizing auth checks
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-sm text-zinc-500 animate-pulse">Loading session...</div>
      </div>
    );
  }

  // Redirect unauthenticated users to Login, maintaining their intended destination
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
