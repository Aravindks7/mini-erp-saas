'use client';

import * as React from 'react';
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
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Standard Combobox (Searchable Select) for ERP SaaS.
 * Refactored to use modern shadcn headless primitives powered by @base-ui/react.
 * Provides a highly accessible, clinical, and performant searchable interface.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  disabled = false,
}: ComboboxProps) {
  return (
    <ComboboxRoot
      value={value}
      onValueChange={(val) => {
        // Handle clear case (empty string)
        onChange(val === '' ? undefined : (val as string));
      }}
      disabled={disabled}
    >
      <div className="relative">
        <ComboboxInput
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn('w-full h-9 bg-background', className)}
          showClear={!!value}
        />
      </div>

      <ComboboxContent align="start" className="z-50 min-w-[200px]">
        {/* Note: The new ComboboxInput in the registry handles search internally when used correctly */}
        <ComboboxList>
          <ComboboxEmpty className="py-6 text-center text-xs text-muted-foreground italic">
            {emptyMessage}
          </ComboboxEmpty>
          {options.map((option) => (
            <ComboboxItem
              key={option.value}
              value={option.value}
              className="px-3 py-2 cursor-pointer transition-colors hover:bg-accent"
            >
              <span className="truncate flex-1">{option.label}</span>
              {/* Note: UI primitive already provides CheckIcon via Indicator */}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>
  );
}
