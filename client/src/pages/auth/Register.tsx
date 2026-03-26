import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
});

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsLoading(true);

    const { error: signUpError } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account. Please try again.');
      return;
    }

    // After successful signup, Better Auth automatically signs the user in
    navigate('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full sm:max-w-md shadow-lg border-muted">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            Create an account
          </CardTitle>
          <CardDescription className="text-base">Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="register-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 mt-2"
          >
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-name">Full Name</FieldLabel>
                    <Input
                      {...field}
                      id="register-name"
                      placeholder="John Doe"
                      className="h-11"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && fieldState.error && (
                      <FieldError errors={[{ message: fieldState.error.message || '' }]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="register-email"
                      placeholder="name@example.com"
                      className="h-11"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && fieldState.error && (
                      <FieldError errors={[{ message: fieldState.error.message || '' }]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      className="h-11"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && fieldState.error && (
                      <FieldError errors={[{ message: fieldState.error.message || '' }]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            {error && <div className="text-sm font-medium text-destructive">{error}</div>}
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4 border-t bg-muted/20 p-6">
          <Button
            type="submit"
            form="register-form"
            className="w-full h-11 text-base font-semibold transition-all"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            <span className="mr-1">Already have an account?</span>
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
