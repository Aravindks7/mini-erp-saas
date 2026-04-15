import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useUpdateOrganization } from '../hooks/organizations.hooks';
import {
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from '@shared/contracts/organizations.contract';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { COUNTRIES } from '@shared/utils/countries';
import { Section } from '@/components/shared/Section';
import { Combobox } from '@/components/shared/form/Combobox';

const countryOptions = COUNTRIES.map((c) => ({ label: c.name, value: c.name }));

export function UpdateOrganizationForm() {
  const { activeOrganization, activeOrganizationId, setActiveOrganization } = useTenant();
  const updateOrg = useUpdateOrganization(activeOrganizationId || '');
  const [isSlugTouched, setIsSlugTouched] = useState(false);

  const isAdmin = activeOrganization?.role === 'admin';

  const handleSubmit = async (data: UpdateOrganizationInput) => {
    if (!isAdmin) return;
    try {
      const updated = await updateOrg.mutateAsync(data);
      if (activeOrganization && setActiveOrganization) {
        setActiveOrganization({ ...activeOrganization, ...updated });
      }
      toast.success('Organization updated successfully');
    } catch {
      toast.error('Failed to update organization');
    }
  };

  if (!activeOrganization) return null;

  return (
    <Section
      title="General Information"
      description={
        isAdmin
          ? 'Update your organization details and regional settings.'
          : 'View your organization details and regional settings.'
      }
    >
      <Form<UpdateOrganizationInput, typeof updateOrganizationSchema>
        mode="onChange"
        schema={updateOrganizationSchema}
        onSubmit={handleSubmit}
        defaultValues={{
          name: activeOrganization.name,
          slug: activeOrganization.slug,
          defaultCountry: activeOrganization.defaultCountry,
        }}
      >
        {(form) => {
          const isPending = updateOrg.isPending;
          const currentValues = form.watch();

          // SMART DIRTY CHECK: Compare trimmed values against the active organization state
          // This ensures the button only enables for MEANINGFUL changes.
          const isMeaningfullyDirty =
            currentValues.name?.trim() !== activeOrganization.name ||
            currentValues.slug?.trim() !== activeOrganization.slug ||
            currentValues.defaultCountry !== activeOrganization.defaultCountry;

          const isDisabled = !isMeaningfullyDirty || isPending || !form.formState.isValid;

          return (
            <div className="space-y-4">
              <FormField name="name" label="Organization Name">
                {({ field }) => (
                  <Input
                    {...field}
                    disabled={!isAdmin}
                    placeholder="e.g. Acme Corp"
                    onChange={(e) => {
                      field.onChange(e);
                      if (!isSlugTouched && isAdmin) {
                        const generatedSlug = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '');
                        form.setValue('slug', generatedSlug, { shouldValidate: true });
                      }
                    }}
                  />
                )}
              </FormField>

              <FormField
                name="slug"
                label="Workspace Slug"
                description="This is your unique workspace identifier used in URLs."
              >
                {({ field }) => (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm shrink-0">app.erpsaas.com/</span>
                    <Input
                      {...field}
                      disabled={!isAdmin}
                      placeholder="acme-corp"
                      onChange={(e) => {
                        setIsSlugTouched(true);
                        field.onChange(e);
                      }}
                    />
                  </div>
                )}
              </FormField>

              <FormField name="defaultCountry" label="Default Country">
                {({ field }) => (
                  <Combobox
                    disabled={!isAdmin}
                    options={countryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a country"
                  />
                )}
              </FormField>

              {isAdmin && (
                <div className="flex justify-end items-center gap-3 pt-4 min-h-[40px]">
                  {isMeaningfullyDirty && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        form.reset({
                          name: activeOrganization.name,
                          slug: activeOrganization.slug,
                          defaultCountry: activeOrganization.defaultCountry,
                        });
                        setIsSlugTouched(false);
                      }}
                    >
                      Undo Changes
                    </Button>
                  )}
                  <Button type="submit" disabled={isDisabled} className="min-w-[140px]">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              )}
            </div>
          );
        }}
      </Form>
    </Section>
  );
}
