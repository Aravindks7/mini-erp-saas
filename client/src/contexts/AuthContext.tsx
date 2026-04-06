import { createContext, useContext, type ReactNode } from 'react';
import { useAuthSession } from '@/features/auth/hooks/auth.hooks';

// Define the shape of our authentication context
type AuthContextType = ReturnType<typeof useAuthSession>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Use the standardized TanStack Query hook to manage session state
  const sessionData = useAuthSession();

  return <AuthContext.Provider value={sessionData}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
