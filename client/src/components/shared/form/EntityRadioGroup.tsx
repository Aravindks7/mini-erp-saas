import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface RadioGroupOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

interface EntityRadioGroupProps {
  /** Currently selected value */
  value?: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** List of options to display */
  options: RadioGroupOption[];
  /** Custom CSS class names */
  className?: string;
  /** Whether the entire radio group is disabled */
  disabled?: boolean;
  /** Orientation of the radio buttons */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * EntityRadioGroup
 *
 * Standardized RadioGroup component for ERP SaaS forms.
 * Integrates Radix UI primitives with clinical styling and easy form connection.
 */
export function EntityRadioGroup({
  value,
  onChange,
  options,
  className,
  disabled = false,
  orientation = 'vertical',
}: EntityRadioGroupProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      className={cn(
        orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-6' : 'grid gap-4',
        className,
      )}
    >
      {options.map((option) => (
        <div
          key={option.value}
          className="flex items-start space-x-3 group animate-in fade-in duration-300"
        >
          <div className="pt-1">
            <RadioGroupItem
              value={option.value}
              id={option.value}
              disabled={option.disabled}
              className="border-primary text-primary focus-visible:ring-primary h-4 w-4"
            />
          </div>
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor={option.value}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer group-hover:text-primary transition-colors',
                option.disabled &&
                  'text-muted-foreground cursor-not-allowed group-hover:text-muted-foreground',
                value === option.value && 'text-primary',
              )}
            >
              {option.label}
            </Label>
            {option.description && (
              <p
                className={cn(
                  'text-[12px] text-muted-foreground font-normal max-w-[300px]',
                  option.disabled && 'text-muted-foreground/50',
                )}
              >
                {option.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
