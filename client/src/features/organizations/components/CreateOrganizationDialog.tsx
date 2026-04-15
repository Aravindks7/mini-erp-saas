import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCreateOrganization } from '../hooks/organizations.hooks';
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from '@shared/contracts/organizations.contract';
import { useTenant } from '@/contexts/TenantContext';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COUNTRIES } from '@shared/utils/countries';

interface CreateOrganizationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({ isOpen, onOpenChange }: CreateOrganizationDialogProps) {
  const { syncActiveOrganizationId } = useTenant();
  const createOrganization = useCreateOrganization();

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      defaultCountry: 'US', // Fallback default
    },
  });

  // PRE-FILL COUNTRY BASED ON IP (Geo-lookup)
  useEffect(() => {
    if (!isOpen) return;

    const fetchGeoLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        // Only update if the user hasn't manually touched the field yet
        if (data.country_code && !form.formState.dirtyFields.defaultCountry) {
          const matchedCountry = COUNTRIES.find((c) => c.code === data.country_code);
          if (matchedCountry) {
            form.setValue('defaultCountry', matchedCountry.code, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.warn('[CreateOrganization] Geo-lookup failed:', error);
      }
    };

    fetchGeoLocation();
  }, [isOpen, form]);

  const handleSubmit = async (data: CreateOrganizationInput) => {
    try {
      const newOrg = await createOrganization.mutateAsync(data);
      toast.success('Organization created successfully');

      // 1. Sync the ID immediately to avoid x-organization-id header mismatch
      syncActiveOrganizationId(newOrg.id);

      // 2. Hard navigate to the new slug's dashboard to clear all caches
      // and guarantee 100% data isolation.
      window.location.assign(`/${newOrg.slug}`);
    } catch {
      toast.error('Failed to create organization');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>Create a new organization to manage your business.</DialogDescription>
        </DialogHeader>
        <Form<CreateOrganizationInput, typeof createOrganizationSchema>
          form={form}
          onSubmit={handleSubmit}
        >
          {() => (
            <div className="space-y-4">
              <FormField name="name" label="Organization Name">
                {({ field }) => <Input {...field} placeholder="Acme Corp" autoFocus />}
              </FormField>
              <FormField name="defaultCountry" label="Default Country">
                {({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOrganization.isPending}
                  className="min-w-[140px]"
                >
                  {createOrganization.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </div>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
