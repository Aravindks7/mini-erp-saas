import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth`,
  fetchOptions: {
    credentials: 'include',
  },
});

// Export authentication actions and hooks for convenience
export const { signIn, signUp, signOut, useSession } = authClient;
