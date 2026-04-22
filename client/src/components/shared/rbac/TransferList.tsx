import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/shared/SearchInput';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

export interface TransferItem {
  id: string;
  label: string;
  description?: string;
}

export interface TransferListProps {
  items: TransferItem[];
  value: string[]; // Selected IDs
  onChange: (value: string[]) => void;
  disabled?: boolean;
  leftTitle?: string;
  rightTitle?: string;
}

/**
 * TransferList Component
 * A dual-column selection interface for managing permission sets or role assignments.
 */
export function TransferList({
  items,
  value,
  onChange,
  disabled,
  leftTitle = 'Available',
  rightTitle = 'Selected',
}: TransferListProps) {
  const [leftSearch, setLeftSearch] = React.useState('');
  const [rightSearch, setRightSearch] = React.useState('');

  const leftItems = items.filter((item) => !value.includes(item.id));
  const rightItems = items.filter((item) => value.includes(item.id));

  const filteredLeftItems = leftItems.filter(
    (item) =>
      item.label.toLowerCase().includes(leftSearch.toLowerCase()) ||
      item.description?.toLowerCase().includes(leftSearch.toLowerCase()),
  );

  const filteredRightItems = rightItems.filter(
    (item) =>
      item.label.toLowerCase().includes(rightSearch.toLowerCase()) ||
      item.description?.toLowerCase().includes(rightSearch.toLowerCase()),
  );

  const handleMoveRight = (id: string) => {
    if (disabled) return;
    onChange([...value, id]);
  };

  const handleMoveLeft = (id: string) => {
    if (disabled) return;
    onChange(value.filter((v) => v !== id));
  };

  const handleAddAll = () => {
    if (disabled) return;
    const filteredIds = filteredLeftItems.map((item) => item.id);
    const newValue = Array.from(new Set([...value, ...filteredIds]));
    onChange(newValue);
  };

  const handleRemoveAll = () => {
    if (disabled) return;
    const filteredIds = filteredRightItems.map((item) => item.id);
    const newValue = value.filter((id) => !filteredIds.includes(id));
    onChange(newValue);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
      {/* Left Column - Available */}
      <Card className="flex-1 w-full h-[450px] flex flex-col overflow-hidden border-muted-foreground/20 p-0 shadow-none ring-1 ring-border">
        <CardHeader className="bg-muted/30 py-3 px-4 border-b rounded-t-xl shrink-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {leftTitle} ({leftItems.length})
          </CardTitle>
          <div className="mt-2">
            <SearchInput
              value={leftSearch}
              onChange={(e) => setLeftSearch(e.target.value)}
              onClear={() => setLeftSearch('')}
              placeholder="Search available..."
              disabled={disabled}
              className="h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-y-auto">
          {filteredLeftItems.length > 0 ? (
            <div className="divide-y divide-border/50">
              {filteredLeftItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMoveRight(item.id)}
                  disabled={disabled}
                  className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="p-3 rounded-full bg-muted/50">
                <ChevronRight className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {leftSearch ? 'No matches found' : 'Empty list'}
              </div>
              {leftSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftSearch('')}
                  className="text-xs h-7"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Center Actions */}
      <div className="flex flex-row lg:flex-col gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddAll}
          disabled={disabled || filteredLeftItems.length === 0}
          title="Add filtered items"
          className="h-10 w-10 border-border/60 hover:border-primary/50 hover:bg-primary/5"
        >
          <ChevronsRight className="h-5 w-5" />
          <span className="sr-only">Add All</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRemoveAll}
          disabled={disabled || filteredRightItems.length === 0}
          title="Remove filtered items"
          className="h-10 w-10 border-border/60 hover:border-destructive/30 hover:bg-destructive/5"
        >
          <ChevronsLeft className="h-5 w-5" />
          <span className="sr-only">Remove All</span>
        </Button>
      </div>

      {/* Right Column - Selected */}
      <Card className="flex-1 w-full h-[450px] flex flex-col overflow-hidden border-muted-foreground/20 p-0 shadow-none ring-1 ring-border">
        <CardHeader className="bg-muted/30 py-3 px-4 border-b rounded-t-xl shrink-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {rightTitle} ({rightItems.length})
          </CardTitle>
          <div className="mt-2">
            <SearchInput
              value={rightSearch}
              onChange={(e) => setRightSearch(e.target.value)}
              onClear={() => setRightSearch('')}
              placeholder="Search selected..."
              disabled={disabled}
              className="h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-y-auto">
          {filteredRightItems.length > 0 ? (
            <div className="divide-y divide-border/50">
              {filteredRightItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMoveLeft(item.id)}
                  disabled={disabled}
                  className="w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-3"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="p-3 rounded-full bg-muted/50">
                <ChevronLeft className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {rightSearch ? 'No matches found' : 'Nothing selected'}
              </div>
              {rightSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightSearch('')}
                  className="text-xs h-7"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
