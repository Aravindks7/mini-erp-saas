import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { registerSchema, type RegisterInput } from '@shared/contracts/auth.contract';
import { useRegisterMutation } from '../hooks/auth.hooks';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { mutateAsync: register, status: registerStatus } = useRegisterMutation();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const isRegistering = registerStatus === 'pending';

  const onSubmit = async (data: RegisterInput) => {
    try {
      const result = await register(data);
      if (result.error) {
        form.setError('root', { message: result.error.message || 'Registration failed' });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('[Register] Registration failed:', error);
      form.setError('root', { message: 'An unexpected error occurred' });
    }
  };

  return (
    <>
      <CardContent className="p-6 pt-2">
        <Form<RegisterInput, typeof registerSchema>
          form={form}
          onSubmit={onSubmit}
          id="register-form"
          className="space-y-5"
        >
          {() => (
            <>
              <FieldGroup>
                <FormField name="name" label="Full Name">
                  {({ field }) => (
                    <Input
                      {...field}
                      id="register-name"
                      placeholder="John Doe"
                      className="h-11"
                      autoComplete="name"
                    />
                  )}
                </FormField>
                <FormField name="email" label="Email">
                  {({ field }) => (
                    <Input
                      {...field}
                      id="register-email"
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
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      autoComplete="new-password"
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
          form="register-form"
          className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={isRegistering}
        >
          {isRegistering ? 'Creating account...' : 'Create account'}
        </Button>
        <div className="text-sm text-center text-muted-foreground">
          <span className="mr-1">Already have an account?</span>
          <Link to="/login" className="font-bold text-primary hover:underline transition-colors">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </>
  );
}
