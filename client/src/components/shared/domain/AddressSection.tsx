import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { FieldValues, ArrayPath, Control } from 'react-hook-form';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/shared/form/FormField';
import { Combobox } from '@/components/shared/form/Combobox';
import { useGeoLookup } from '@/hooks/useGeoLookup';
import { useDebounce } from '@/hooks/useDebounce';
import { useTenant } from '@/contexts/TenantContext';
import { COUNTRIES, getCountryByName } from '@shared/utils/countries';

const countryOptions = COUNTRIES.map((c) => ({ label: c.name, value: c.name }));

interface AddressSectionProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  title?: string;
}

/**
 * Robust Address Management Section with Tenant-Aware Defaulting & ISO Validation.
 */
export function AddressSection<TFieldValues extends FieldValues>({
  name,
  title = 'Addresses',
}: AddressSectionProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  const { activeOrganization } = useTenant();
  const { fields, append, remove } = useFieldArray({ control, name });

  const handleAppend = useCallback(() => {
    const lastUsedCountry = sessionStorage.getItem('erp_last_used_country');
    const defaultCountry = lastUsedCountry || activeOrganization?.defaultCountry || '';

    append({
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: defaultCountry,
      isPrimary: fields.length === 0,
    } as Parameters<typeof append>[0]);
  }, [append, activeOrganization, fields.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button type="button" variant="outline" size="sm" onClick={handleAppend}>
          <Plus className="mr-2 h-4 w-4" /> Add Address
        </Button>
      </div>

      {fields.map((field, index) => (
        <AddressItem key={field.id} index={index} name={name} onRemove={() => remove(index)} />
      ))}
    </div>
  );
}

function AddressItem({
  index,
  name,
  onRemove,
}: {
  index: number;
  name: string;
  onRemove: () => void;
}) {
  const { control, setValue, getValues } = useFormContext();
  const { lookup, loading, error } = useGeoLookup();

  const postalCode = useWatch({ control, name: `${name}.${index}.postalCode` });
  const country = useWatch({ control, name: `${name}.${index}.country` });
  const debouncedPostalCode = useDebounce(postalCode, 500);

  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const autoFilledFields = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (country) {
      sessionStorage.setItem('erp_last_used_country', country);
    }
  }, [country]);

  useEffect(() => {
    async function triggerLookup() {
      if (!debouncedPostalCode || debouncedPostalCode.length < 3 || !country) {
        if (!debouncedPostalCode) {
          autoFilledFields.current.clear();
          setIsAutoFilled(false);
        }
        return;
      }

      const result = await lookup(country, debouncedPostalCode);
      if (result) {
        const currentCity = getValues(`${name}.${index}.city`);
        const currentState = getValues(`${name}.${index}.state`);

        const canFillCity = !currentCity || autoFilledFields.current.has('city');
        const canFillState = !currentState || autoFilledFields.current.has('state');

        if (canFillCity || canFillState) {
          if (canFillCity) {
            setValue(`${name}.${index}.city`, result.city, { shouldValidate: true });
            autoFilledFields.current.add('city');
          }
          if (canFillState) {
            setValue(`${name}.${index}.state`, result.state, { shouldValidate: true });
            autoFilledFields.current.add('state');
          }
          setIsAutoFilled(true);
        }
      }
    }
    triggerLookup();
  }, [debouncedPostalCode, country, index, name, lookup, setValue, getValues]);

  const countryData = getCountryByName(country);

  return (
    <Card className="relative overflow-hidden border-muted-foreground/20">
      <CardHeader className="bg-muted/30 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Address #{index + 1}{' '}
            {isAutoFilled && (
              <span className="ml-2 text-[10px] text-primary/60 lowercase italic font-normal">
                (Auto-filled)
              </span>
            )}
          </CardTitle>
          <Button type="button" variant="destructive" size="icon-sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
        <FormField
          name={`${name}.${index}.addressLine1`}
          label="Address Line 1"
          className="sm:col-span-2"
        >
          {({ field }) => <Input {...field} placeholder="e.g. 123 Business Way" />}
        </FormField>

        <FormField name={`${name}.${index}.country`} label="Country">
          {({ field }) => (
            <Combobox
              id={field.id}
              options={countryOptions}
              value={field.value}
              onChange={(val) => field.onChange(val)}
              placeholder="Select country..."
              className="h-8"
            />
          )}
        </FormField>

        <FormField name={`${name}.${index}.postalCode`} label="Postal Code">
          {({ field }) => (
            <div className="relative group">
              <Input
                {...field}
                value={field.value ?? ''}
                placeholder={countryData?.postalCodePlaceholder || 'Zip code'}
                className={
                  loading
                    ? 'pr-10'
                    : error === 'invalid_zip_format'
                      ? 'border-destructive pr-10 focus-visible:ring-destructive'
                      : ''
                }
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {error === 'invalid_zip_format' && (
                <p className="absolute -bottom-5 left-0 text-[10px] font-medium text-destructive transition-all animate-in fade-in slide-in-from-top-1">
                  Invalid format for this country
                </p>
              )}
            </div>
          )}
        </FormField>

        <FormField name={`${name}.${index}.city`} label="City">
          {({ field }) => (
            <Input
              {...field}
              placeholder="City"
              onChange={(e) => {
                autoFilledFields.current.delete('city');
                if (autoFilledFields.current.size === 0) setIsAutoFilled(false);
                field.onChange(e);
              }}
            />
          )}
        </FormField>

        <FormField name={`${name}.${index}.state`} label="State/Province">
          {({ field }) => (
            <Input
              {...field}
              value={field.value ?? ''}
              placeholder="State"
              onChange={(e) => {
                autoFilledFields.current.delete('state');
                if (autoFilledFields.current.size === 0) setIsAutoFilled(false);
                field.onChange(e);
              }}
            />
          )}
        </FormField>

        <FormField
          name={`${name}.${index}.addressLine2`}
          label="Address Line 2 (Optional)"
          className="sm:col-span-2"
        >
          {({ field }) => (
            <Input {...field} value={field.value ?? ''} placeholder="Apt, Suite, etc." />
          )}
        </FormField>

        <FormField name={`${name}.${index}.isPrimary`} className="sm:col-span-2">
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
  );
}
