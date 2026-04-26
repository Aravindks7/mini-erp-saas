import { useFieldArray } from 'react-hook-form';
import type { Control, FieldValues, Path, ArrayPath, FieldArrayPathValue } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/shared/form/FormField';

interface BinSectionProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  title?: string;
}

export function BinSection<TFieldValues extends FieldValues>({
  control,
  name,
  title = 'Bins',
}: BinSectionProps<TFieldValues>) {
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
              code: '',
              name: '',
            } as FieldArrayPathValue<TFieldValues, ArrayPath<TFieldValues>>[number])
          }
        >
          <Plus className="mr-2 h-4 w-4" /> Add Bin
        </Button>
      </div>

      {fields.map((field, index) => (
        <Card key={field.id} className="relative overflow-hidden border-muted-foreground/20">
          <CardHeader className="bg-muted/30 py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Bin #{index + 1}
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
            <FormField name={`${name}.${index}.code` as Path<TFieldValues>} label="Bin Code">
              {({ field }) => <Input {...field} placeholder="e.g. A1-01" />}
            </FormField>

            <FormField
              name={`${name}.${index}.name` as Path<TFieldValues>}
              label="Bin Name (Optional)"
            >
              {({ field }) => (
                <Input {...field} value={field.value ?? ''} placeholder="e.g. Aisle 1, Shelf 1" />
              )}
            </FormField>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
