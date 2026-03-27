import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signUp } from '@/lib/auth-client';
import { AUTH_QUERY_KEY } from '@/hooks/use-auth-session';
import { registerSchema, type RegisterValues } from '@/lib/schemas/auth';

export function useRegister() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const { mutate: register, isPending: isRegistering } = useMutation({
    mutationFn: async (values: RegisterValues) => {
      const { error } = await signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      // Better Auth handles automatic sign-in, but we must ensure TanStack Query
      // session state is invalidated and refetched before proceeding.
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate('/');
    },
    onError: (error: Error) => {
      form.setError('root', {
        message: error.message || 'Failed to create account. Please try again.',
      });
    },
  });

  const onSubmit = (values: RegisterValues) => {
    register(values);
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isRegistering,
  };
}
