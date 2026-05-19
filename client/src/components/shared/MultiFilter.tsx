import * as React from 'react';
import { Check, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface MultiFilterProps {
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
}

/**
 * MultiFilter Component
 * A generic, standalone multi-select filter that mimics the DataTable lookup experience.
 * Optimized for high-density ERP dashboards.
 */
export function MultiFilter({
  title,
  options,
  selectedValues = [],
  onValuesChange,
}: MultiFilterProps) {
  const selectedSet = new Set(selectedValues);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-10 px-3 font-normal transition-all duration-200',
            selectedSet.size > 0
              ? 'text-primary border-primary/30 bg-primary/5'
              : 'text-muted-foreground',
          )}
        >
          <Filter className="mr-2 h-4 w-4" />
          {title}
          {selectedSet.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4 bg-primary/20" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden bg-primary text-primary-foreground"
              >
                {selectedSet.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedSet.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal bg-primary text-primary-foreground"
                  >
                    {selectedSet.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedSet.has(option.value))
                    .map((option) => (
                      <Badge variant="outline" key={option.value}>
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
              <div
                role="button"
                className="ml-2 rounded-full hover:bg-primary/20 p-0.5 cursor-pointer transition-colors relative z-50 pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onValuesChange([]);
                }}
              >
                <X className="h-3 w-3 text-primary" />
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const next = new Set(selectedSet);
                      if (isSelected) {
                        next.delete(option.value);
                      } else {
                        next.add(option.value);
                      }
                      onValuesChange(Array.from(next));
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onValuesChange([])}
                    className="justify-center text-center font-medium text-destructive hover:bg-destructive/10"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
