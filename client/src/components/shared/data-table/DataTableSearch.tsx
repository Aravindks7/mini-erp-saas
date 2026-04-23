'use no memo';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableSearchProps {
  searchKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * DataTableSearch: An enhanced UI primitive for table search inputs.
 *
 * Improvements:
 * 1. Added Search icon (prefix) and Clear icon (suffix).
 * 2. Implemented 'Esc' key to clear.
 * 3. Auto-focuses input after clearing for better UX.
 */
export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: DataTableSearchProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync external value (e.g., from a URL reset) back to local state
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={cn('relative w-full sm:max-w-xs md:max-w-sm lg:w-[250px]', className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="h-8 pl-9 pr-8 focus-visible:ring-primary/20"
      />
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-0 top-0 h-8 w-8 px-0 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
