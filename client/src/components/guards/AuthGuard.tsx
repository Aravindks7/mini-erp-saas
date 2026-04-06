import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { data: session, isPending, isError, error } = useAuth();
  const location = useLocation();

  // CLINICAL OBSERVABILITY: Monitor the session state transition in development
  console.log('[AuthGuard] Checking session:', {
    isAuthenticated: !!session?.user,
    isPending,
    isError,
    userId: session?.user?.id,
  });

  if (isPending) {
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

  // REDIRECT IF UNAUTHENTICATED OR FETCH FAILED
  // We strictly check for session.user. If the query finished (isPending=false)
  // and we still don't have a user, it's an unauthorized state.
  if (isError || !session?.user) {
    if (isError) console.error('[AuthGuard] Session check failed:', error);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
