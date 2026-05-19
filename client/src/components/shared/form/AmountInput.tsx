import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/features/currencies/hooks/use-currency';

interface AmountInputProps {
  value: number | string | undefined;
  onChange: (value: string) => void;
  currency?: string; // Optional: overrides the default tenant currency
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Standard Amount Input for ERP SaaS.
 * Supports string/number values and returns string via onChange for contract compatibility.
 * Axiom: Dynamically resolves formatting based on organization locale if no currency prop is provided.
 */
export function AmountInput({
  value,
  onChange,
  currency: currencyProp,
  placeholder,
  disabled,
  className,
}: AmountInputProps) {
  const { format: tenantFormat } = useCurrency();

  const format = React.useMemo(() => {
    if (currencyProp) {
      return (val: number | string | undefined) => {
        if (val === undefined || val === '') return '';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currencyProp,
        }).format(num);
      };
    }
    return tenantFormat;
  }, [currencyProp, tenantFormat]);

  const [isFocused, setIsFocused] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState<string>(format(value));

  // Sync with external value changes (e.g., form resets)
  React.useEffect(() => {
    // Only sync from prop if NOT focused to avoid fighting the user during typing
    if (!isFocused) {
      const formatted = format(value);
      if (formatted !== displayValue) {
        setDisplayValue(formatted);
      }
    }
  }, [value, format, displayValue, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove everything except numbers and decimal point
    const numericValue = inputValue.replace(/[^\d.]/g, '');

    // Only update if it's a valid partial number or empty
    if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
      setDisplayValue(numericValue);
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(format(value));
  };

  const handleFocus = () => {
    setIsFocused(true);
    // When focusing, show just the numeric value for easier editing
    if (value !== undefined && value !== '') {
      setDisplayValue(value.toString());
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder || format(0)}
        disabled={disabled}
        className={cn('font-mono text-right pr-4', className)}
      />
    </div>
  );
}
