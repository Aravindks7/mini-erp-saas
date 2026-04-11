'use no memo';

import * as React from 'react';
import { Input } from '@/components/ui/input';

interface DataTableSearchProps {
  searchKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * DataTableSearch: A controlled UI primitive for table search inputs.
 *
 * In accordance with the "Caller-Bound Throttling" architecture:
 * 1. Manages local input state for immediate UI responsiveness.
 * 2. Emits changes immediately via the `onChange` prop.
 * 3. Does NOT handle debouncing internally; throttling is centralized at the state layer.
 * 4. Syncs local state with external `value` prop to support programmatic resets.
 */
export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: DataTableSearchProps) {
  const [localValue, setLocalValue] = React.useState(value);

  // Sync external value (e.g., from a URL reset) back to local state
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setLocalValue(newValue);
    onChange(newValue); // Emit immediately; caller handles debouncing
  };

  return (
    <Input
      placeholder={placeholder}
      value={localValue}
      onChange={handleInputChange}
      className={`h-8 w-[150px] lg:w-[250px] focus-visible:ring-primary/20 ${className || ''}`}
    />
  );
}
