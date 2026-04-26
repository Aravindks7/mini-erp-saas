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

interface FormProps<
  TFieldValues extends FieldValues,
  TSchema extends z.ZodType<TFieldValues> | z.ZodTypeAny,
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (form: UseFormReturn<TFieldValues, any, TFieldValues>) => React.ReactNode;
  onSubmit: SubmitHandler<TFieldValues>;
  schema?: TSchema;
  defaultValues?: UseFormProps<TFieldValues>['defaultValues'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form?: UseFormReturn<TFieldValues, any, TFieldValues>; // Optional external form
  className?: string;
  id?: string;
  mode?: UseFormProps<TFieldValues>['mode'];
}

/**
 * Standard Form Wrapper for ERP SaaS.
 * Supports both internally initialized and externally controlled form states.
 */
export function Form<
  TFieldValues extends FieldValues,
  TSchema extends z.ZodType<TFieldValues> | z.ZodTypeAny,
>({
  children,
  onSubmit,
  schema,
  defaultValues,
  form: externalForm,
  className,
  id,
  mode = 'onTouched',
}: FormProps<TFieldValues, TSchema>) {
  // Use external form if provided, otherwise initialize internal one
  const internalForm = useForm<TFieldValues>({
    mode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: (schema ? zodResolver(schema as any) : undefined) as Resolver<TFieldValues>,
    defaultValues,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = (externalForm || internalForm) as UseFormReturn<TFieldValues, any, TFieldValues>;

  return (
    <FormProvider {...form}>
      <form id={id} onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
        {children(form)}
      </form>
    </FormProvider>
  );
}
