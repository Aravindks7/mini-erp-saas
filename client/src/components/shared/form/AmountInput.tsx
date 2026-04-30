import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AmountInputProps {
  value: number | string | undefined;
  onChange: (value: string) => void;
  currency: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function formatCurrency(val: number | string | undefined, curr: string) {
  if (val === undefined || val === '') return '';

  const numericValue = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(numericValue)) return '';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
    }).format(numericValue);
  } catch {
    console.warn(`Invalid currency "${curr}" passed to AmountInput, falling back to USD`);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericValue);
  }
}

/**
 * Standard Amount Input for ERP SaaS.
 * Supports string/number values and returns string via onChange for contract compatibility.
 */
export function AmountInput({
  value,
  onChange,
  currency,
  placeholder,
  disabled,
  className,
}: AmountInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState<string>(formatCurrency(value, currency));

  // Sync with external value changes (e.g., form resets)
  React.useEffect(() => {
    // Only sync from prop if NOT focused to avoid fighting the user during typing
    if (!isFocused) {
      const formatted = formatCurrency(value, currency);
      if (formatted !== displayValue) {
        setDisplayValue(formatted);
      }
    }
  }, [value, currency, displayValue, isFocused]);

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
    setDisplayValue(formatCurrency(value, currency));
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
        placeholder={placeholder || formatCurrency(0, currency)}
        disabled={disabled}
        className={cn('font-mono text-right pr-4', className)}
      />
    </div>
  );
}
