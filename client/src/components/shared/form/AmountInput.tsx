import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AmountInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  currency: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function formatCurrency(val: number, curr: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
  }).format(val);
}

/**
 * Standard Amount Input for ERP SaaS.
 * Requires a mandatory currency prop and uses Intl.NumberFormat for precision.
 */
export function AmountInput({
  value,
  onChange,
  currency,
  placeholder,
  disabled,
  className,
}: AmountInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>(
    value !== undefined ? formatCurrency(value, currency) : '',
  );

  // Sync with external value changes (e.g., form resets)
  React.useEffect(() => {
    if (value !== undefined) {
      const formatted = formatCurrency(value, currency);
      if (formatted !== displayValue) {
        setDisplayValue(formatted);
      }
    } else if (displayValue !== '') {
      setDisplayValue('');
    }
  }, [value, currency, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove everything except numbers and decimal point
    const numericValue = inputValue.replace(/[^\d.]/g, '');

    // Only update if it's a valid partial number or empty
    if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
      setDisplayValue(numericValue);
      const parsed = parseFloat(numericValue);
      onChange(isNaN(parsed) ? undefined : parsed);
    }
  };

  const handleBlur = () => {
    if (value !== undefined) {
      setDisplayValue(formatCurrency(value, currency));
    } else {
      setDisplayValue('');
    }
  };

  const handleFocus = () => {
    // When focusing, show just the numeric value for easier editing
    if (value !== undefined) {
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
