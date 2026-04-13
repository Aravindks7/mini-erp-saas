import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginInput } from '@shared/contracts/auth.contract';
import { useLoginMutation } from '../hooks/auth.hooks';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';

export default function LoginPage() {
  const navigate = useNavigate();
  const { mutateAsync: login, status: loginStatus } = useLoginMutation();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isLoggingIn = loginStatus === 'pending';

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await login(data);
      if (result.error) {
        form.setError('root', { message: result.error.message || 'Login failed' });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('[Login] Login failed:', error);
      form.setError('root', { message: 'An unexpected error occurred' });
    }
  };

  return (
    <>
      <CardContent className="p-6 pt-2">
        <Form<LoginInput, typeof loginSchema>
          form={form}
          onSubmit={onSubmit}
          id="login-form"
          className="space-y-5"
        >
          {() => (
            <>
              <FieldGroup>
                <FormField name="email" label="Email">
                  {({ field }) => (
                    <Input
                      {...field}
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      className="h-11"
                      autoComplete="email"
                    />
                  )}
                </FormField>
                <FormField name="password" label="Password">
                  {({ field }) => (
                    <Input
                      {...field}
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      autoComplete="current-password"
                    />
                  )}
                </FormField>
              </FieldGroup>
              {form.formState.errors.root && (
                <div className="text-sm font-medium text-destructive mt-2 py-2 px-3 bg-destructive/10 rounded-md border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                  {form.formState.errors.root.message}
                </div>
              )}
            </>
          )}
        </Form>
      </CardContent>
      <CardFooter className="flex-col gap-4 border-t bg-zinc-50/50 dark:bg-zinc-900/50 p-6">
        <Button
          type="submit"
          form="login-form"
          className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? 'Signing in...' : 'Sign in'}
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          <span className="mr-1">Don't have an account?</span>
          <Link to="/register" className="font-bold text-primary hover:underline transition-colors">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </>
  );
}
