import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  isLoading?: boolean;
}

/**
 * SearchInput Component
 * A specialized input with a search icon and clear button, designed for ERP filter toolbars.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, onChange, placeholder = 'Search...', ...props }, ref) => {
    const hasValue = !!value;

    const handleClear = () => {
      if (onClear) {
        onClear();
      }
      // If controlled via onChange, we rely on the parent to update value
    };

    return (
      <div className={cn('relative flex items-center w-full', className)}>
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pl-9 pr-9 h-9"
          {...props}
        />
        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 h-9 w-9 text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
