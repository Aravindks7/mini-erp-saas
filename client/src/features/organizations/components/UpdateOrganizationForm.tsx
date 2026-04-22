import { toast } from 'sonner';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@shared/index';

export function UpdateOrganizationForm() {
  const { activeOrganization } = useTenant();
  const updateOrg = useUpdateOrganization(activeOrganization?.id || '');
  const canManageSettings = usePermission(PERMISSIONS.ORGANIZATION.SETTINGS);

  const handleSubmit = async (data: UpdateOrganizationInput) => {
    if (!activeOrganization) return;
    try {
      await updateOrg.mutateAsync(data);
      toast.success('Organization updated successfully');
    } catch {
      toast.error('Failed to update organization');
    }
  };

  if (!activeOrganization) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>
          Update your organization&apos;s basic information and public presence.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form<UpdateOrganizationInput, typeof updateOrganizationSchema>
          schema={updateOrganizationSchema}
          onSubmit={handleSubmit}
          defaultValues={{
            name: activeOrganization.name,
            slug: activeOrganization.slug,
            defaultCountry: activeOrganization.defaultCountry,
          }}
        >
          {() => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="name" label="Organization Name">
                  {({ field }) => (
                    <Input {...field} placeholder="Acme Corp" disabled={!canManageSettings} />
                  )}
                </FormField>
                <FormField name="slug" label="URL Slug">
                  {({ field }) => (
                    <Input {...field} placeholder="acme-corp" disabled={!canManageSettings} />
                  )}
                </FormField>
              </div>

              <FormField name="defaultCountry" label="Default Country">
                {({ field }) => (
                  <Input {...field} placeholder="United States" disabled={!canManageSettings} />
                )}
              </FormField>

              {canManageSettings && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateOrg.isPending}>
                    {updateOrg.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          )}
        </Form>
      </CardContent>
    </Card>
  );
}
