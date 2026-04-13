import { useFormContext, Controller } from 'react-hook-form';
import type { FieldValues, Path, Control, ControllerRenderProps } from 'react-hook-form';
import { FieldLabel, FieldDescription, FieldError, Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface FormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label?: string;
  id?: string;
  description?: string;
  className?: string;
  children: (props: {
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>> & { id?: string };
  }) => React.ReactNode;
}

/**
 * Standard Form Field wrapper for ERP SaaS components.
 * Consumes FormProvider context and handles labeling/errors consistently.
 */
export function FormField<TFieldValues extends FieldValues>({
  name,
  label,
  id: externalId,
  description,
  className,
  children,
}: FormFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  const id = externalId || name;

  return (
    <Controller
      name={name}
      control={control as unknown as Control<TFieldValues>}
      render={({ field, fieldState }) => (
        <Field className={cn('space-y-2', className)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
          {children({ field: { ...field, id } })}
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[{ message: fieldState.error?.message }]} />
        </Field>
      )}
    />
  );
}
