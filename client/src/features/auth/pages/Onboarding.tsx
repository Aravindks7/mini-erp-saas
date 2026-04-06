import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from '@shared/contracts/organizations.contract';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import {
  useCreateOrganization,
  organizationKeys,
} from '@/features/organizations/hooks/organizations.hooks';
import type { OrganizationResponse } from '@/features/organizations/api/organizations.api';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActiveOrganizationId } = useTenant();
  const { mutateAsync: createOrg, status: createStatus } = useCreateOrganization();

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
    },
  });

  const isPending = createStatus === 'pending';

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const newOrg = await createOrg(data);
      const queryKey = organizationKeys.mine();

      // OPTIMISTIC UPDATE: Update the cache immediately so the TenantGuard sees the new org
      queryClient.setQueryData<OrganizationResponse[]>(queryKey, (old) => {
        const newOrgWithRole = { ...newOrg, role: 'admin' };
        return old ? [...old, newOrgWithRole] : [newOrgWithRole];
      });

      // Synchronous local state update
      setActiveOrganizationId(newOrg.id);

      // Redirect to dashboard now that cache is primed and synced
      navigate('/', { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create organization';
      form.setError('root', { message: errorMessage });
    }
  });

  return (
    <>
      <CardContent className="p-6 pt-2">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">Create your workspace</h3>
          <p className="text-sm text-muted-foreground">
            Get started by giving your organization a name.
          </p>
        </div>

        <form id="onboarding-form" onSubmit={onSubmit} className="space-y-5">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="org-name">Organization Name</FieldLabel>
                  <Input
                    {...field}
                    id="org-name"
                    placeholder="e.g. Acme Corp"
                    className="h-11"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    autoFocus
                  />
                  {fieldState.invalid && fieldState.error && (
                    <FieldError errors={[{ message: fieldState.error.message || '' }]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {form.formState.errors.root && (
            <div className="text-sm font-medium text-destructive text-center mt-2 py-2 px-3 bg-destructive/10 rounded-md border border-destructive/20 animate-in fade-in slide-in-from-top-1">
              {form.formState.errors.root.message}
            </div>
          )}
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-4 border-t bg-zinc-50/50 dark:bg-zinc-900/50 p-6">
        <Button
          type="submit"
          form="onboarding-form"
          className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Organization
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          You can always change the organization name later in settings.
        </p>
      </CardFooter>
    </>
  );
}
