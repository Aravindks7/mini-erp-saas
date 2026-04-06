import { authClient } from '@/lib/auth-client';
import type { LoginInput, RegisterInput } from '@shared/contracts/auth.contract';

export const authApi = {
  login: async (data: LoginInput) => {
    return authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
  },
  register: async (data: RegisterInput) => {
    return authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });
  },
  logout: async () => {
    return authClient.signOut();
  },
  getSession: async () => {
    return authClient.getSession();
  },
};
