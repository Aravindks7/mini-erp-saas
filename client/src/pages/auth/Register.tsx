import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useRegister } from '@/hooks/auth/use-register';
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

export default function RegisterPage() {
  const { form, onSubmit, isRegistering } = useRegister();

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
          <form id="register-form" onSubmit={onSubmit} className="space-y-5 mt-2">
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
            {form.formState.errors.root && (
              <div className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4 border-t bg-muted/20 p-6">
          <Button
            type="submit"
            form="register-form"
            className="w-full h-11 text-base font-semibold transition-all"
            disabled={isRegistering}
          >
            {isRegistering ? 'Creating account...' : 'Create account'}
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
