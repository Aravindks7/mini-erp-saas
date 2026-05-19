import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
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
  (
    { className, onClear, value, onChange, placeholder = 'Search...', isLoading, ...props },
    ref,
  ) => {
    const hasValue = !!value;

    const handleClear = () => {
      if (onClear) {
        onClear();
      }
    };

    return (
      <div className={cn('relative flex items-center w-full', className)}>
        <div className="absolute left-3 h-4 w-4 flex items-center justify-center shrink-0 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full h-9 pl-9 pr-9 rounded-lg border border-border/50 text-sm font-normal text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all',
            className,
          )}
          {...props}
        />
        {hasValue && (
          <Button
            type="button"
            variant="link"
            size="icon"
            className="absolute right-0 h-10 w-10 text-muted-foreground hover:text-foreground"
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
