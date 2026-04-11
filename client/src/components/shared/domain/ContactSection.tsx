import { useFieldArray } from 'react-hook-form';
import type { Control, FieldValues, Path, ArrayPath } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/shared/form/FormField';

interface ContactSectionProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  title?: string;
}

/**
 * Standard Contact Management Section.
 * Domain-agnostic component for handling multiple points of contact.
 */
export function ContactSection<TFieldValues extends FieldValues>({
  control,
  name,
  title = 'Contacts',
}: ContactSectionProps<TFieldValues>) {
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
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              isPrimary: fields.length === 0,
            } as any)
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

      {fields.map((field, index) => (
        <Card key={field.id} className="relative overflow-hidden border-muted-foreground/20">
          <CardHeader className="bg-muted/30 py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Contact #{index + 1}
              </CardTitle>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
            <FormField name={`${name}.${index}.firstName` as Path<TFieldValues>} label="First Name">
              {({ field }) => <Input {...field} placeholder="First name" />}
            </FormField>

            <FormField name={`${name}.${index}.lastName` as Path<TFieldValues>} label="Last Name">
              {({ field }) => <Input {...field} placeholder="Last name" />}
            </FormField>

            <FormField name={`${name}.${index}.email` as Path<TFieldValues>} label="Email">
              {({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  type="email"
                  placeholder="Email address"
                />
              )}
            </FormField>

            <FormField name={`${name}.${index}.phone` as Path<TFieldValues>} label="Phone">
              {({ field }) => (
                <Input {...field} value={field.value ?? ''} placeholder="Phone number" />
              )}
            </FormField>

            <FormField
              name={`${name}.${index}.jobTitle` as Path<TFieldValues>}
              label="Job Title (Optional)"
            >
              {({ field }) => (
                <Input {...field} value={field.value ?? ''} placeholder="Job title" />
              )}
            </FormField>

            <FormField
              name={`${name}.${index}.isPrimary` as Path<TFieldValues>}
              className="sm:col-span-2"
            >
              {({ field: { value, onChange, ...field } }) => (
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-muted/10">
                  <Checkbox
                    id={`contact-${index}-primary`}
                    checked={value}
                    onCheckedChange={onChange}
                    {...field}
                  />
                  <label
                    htmlFor={`contact-${index}-primary`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Set as Primary Contact
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
