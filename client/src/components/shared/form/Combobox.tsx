'use client';

import { cn } from '@/lib/utils';
// Import modern shadcn primitives
import {
  Combobox as ComboboxRoot,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

export interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Standard Combobox (Searchable Select)
 * Refactored to use modern shadcn headless primitives powered by @base-ui/react.
 * Provides a highly accessible, clinical, and performant searchable interface.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  emptyMessage = 'No results found.',
  className,
  disabled = false,
}: ComboboxProps) {
  return (
    <ComboboxRoot
      items={options}
      value={value}
      onValueChange={(val) => {
        onChange(val === null ? undefined : (val as string));
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn('w-full h-11 bg-background', className)}
        showClear={!!value}
      />
      <ComboboxContent align="start">
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(option: ComboboxOption) => (
            <ComboboxItem
              key={option.value}
              value={option.value}
              className="px-3 py-2 cursor-pointer transition-colors"
            >
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}
