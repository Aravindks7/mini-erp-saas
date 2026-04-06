import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import type {
  UseFormReturn,
  UseFormProps,
  FieldValues,
  SubmitHandler,
  Resolver,
} from 'react-hook-form';
import type { z } from 'zod';
import { cn } from '@/lib/utils';

interface FormProps<TFieldValues extends FieldValues, TSchema extends z.ZodType<any, any, any>> {
  children: (form: UseFormReturn<TFieldValues, unknown>) => React.ReactNode;
  onSubmit: SubmitHandler<TFieldValues>;
  schema?: TSchema;
  defaultValues?: UseFormProps<TFieldValues>['defaultValues'];
  form?: UseFormReturn<TFieldValues, unknown>; // Optional external form
  className?: string;
  id?: string;
}

/**
 * Standard Form Wrapper for ERP SaaS.
 * Supports both internally initialized and externally controlled form states.
 */
export function Form<TFieldValues extends FieldValues, TSchema extends z.ZodType<any, any, any>>({
  children,
  onSubmit,
  schema,
  defaultValues,
  form: externalForm,
  className,
  id,
}: FormProps<TFieldValues, TSchema>) {
  // Use external form if provided, otherwise initialize internal one
  const internalForm = useForm<TFieldValues>({
    resolver: schema ? (zodResolver(schema) as unknown as Resolver<TFieldValues>) : undefined,
    defaultValues,
  });

  const form = (externalForm || internalForm) as UseFormReturn<TFieldValues, unknown>;

  return (
    <FormProvider {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit as any)}
        className={cn('space-y-6', className)}
      >
        {children(form)}
      </form>
    </FormProvider>
  );
}
