import { useFieldArray } from 'react-hook-form';
import type { Control, FieldValues, Path, ArrayPath } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/shared/form/FormField';

interface AddressSectionProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  title?: string;
}

/**
 * Standard Address Management Section.
 * Domain-agnostic component for handling multiple addresses (Billing, Shipping, etc.)
 */
export function AddressSection<TFieldValues extends FieldValues>({
  control,
  name,
  title = 'Addresses',
}: AddressSectionProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              addressLine1: '',
              city: '',
              country: '',
              isPrimary: fields.length === 0,
            } as any)
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Add Address
        </Button>
      </div>

      {fields.map((field, index) => (
        <Card key={field.id} className="relative overflow-hidden border-muted-foreground/20">
          <CardHeader className="bg-muted/30 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Address #{index + 1}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
            <FormField
              name={`${name}.${index}.addressLine1` as Path<TFieldValues>}
              label="Address Line 1"
            >
              {({ field }) => <Input {...field} placeholder="e.g. 123 Business Way" />}
            </FormField>

            <FormField
              name={`${name}.${index}.addressLine2` as Path<TFieldValues>}
              label="Address Line 2 (Optional)"
            >
              {({ field }) => (
                <Input {...field} value={field.value ?? ''} placeholder="Apt, Suite, etc." />
              )}
            </FormField>

            <FormField name={`${name}.${index}.city` as Path<TFieldValues>} label="City">
              {({ field }) => <Input {...field} placeholder="City" />}
            </FormField>

            <FormField name={`${name}.${index}.state` as Path<TFieldValues>} label="State/Province">
              {({ field }) => <Input {...field} value={field.value ?? ''} placeholder="State" />}
            </FormField>

            <FormField
              name={`${name}.${index}.postalCode` as Path<TFieldValues>}
              label="Postal Code"
            >
              {({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Zip code" />}
            </FormField>

            <FormField name={`${name}.${index}.country` as Path<TFieldValues>} label="Country">
              {({ field }) => <Input {...field} placeholder="Country" />}
            </FormField>

            <FormField
              name={`${name}.${index}.isPrimary` as Path<TFieldValues>}
              className="sm:col-span-2"
            >
              {({ field: { value, onChange, ...field } }) => (
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/10">
                  <Checkbox
                    id={`address-${index}-primary`}
                    checked={value}
                    onCheckedChange={onChange}
                    {...field}
                  />
                  <label
                    htmlFor={`address-${index}-primary`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Set as Primary Address
                  </label>
                </div>
              )}
            </FormField>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
