import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signIn } from '@/lib/auth-client';
import { AUTH_QUERY_KEY } from '@/hooks/use-auth-session';
import { loginSchema, type LoginValues } from '@/lib/schemas/auth';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (values: LoginValues) => {
      const { error } = await signIn.email({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      // Standardize session invalidation to prevent double-click race conditions
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });

      // Navigate to the intended destination or dashboard
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    },
    onError: (error: Error) => {
      form.setError('root', {
        message: error.message || 'Failed to sign in. Please verify your credentials.',
      });
    },
  });

  const onSubmit = (values: LoginValues) => {
    login(values);
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoggingIn,
  };
}
