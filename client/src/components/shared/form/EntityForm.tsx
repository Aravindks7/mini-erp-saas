import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, X, Check, ArrowLeft } from 'lucide-react';

interface EntityFormProps {
  /** Form content (usually FormSections and FormField components). */
  children: React.ReactNode;
  /** Final submission handler. */
  onSubmit: (e: React.FormEvent) => void;
  /** Optional cancellation/back handler. */
  onCancel?: () => void;
  /** Global loading state for the form button. */
  isLoading?: boolean;
  /** Current operation mode. 'view' disables standard interaction. */
  mode?: 'create' | 'edit' | 'view';
  /** Label for the primary action button. */
  submitLabel?: string;
  /** Label for the cancellation button. */
  cancelLabel?: string;
  /** Additional styling for the container. */
  className?: string;
}

/**
 * EntityForm Component
 * A "Dumb" layout wrapper that standardizes the appearance of ERP forms.
 * Manages mode-specific UI (labels/icons) and ensures consistent button placement.
 */
export function EntityForm({
  children,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
  submitLabel,
  cancelLabel = 'Cancel',
  className,
}: EntityFormProps) {
  const isView = mode === 'view';

  const defaultSubmitLabel = mode === 'create' ? 'Create' : 'Save Changes';
  const currentSubmitLabel = submitLabel || defaultSubmitLabel;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isView) onSubmit(e);
      }}
      className={cn('space-y-8', className)}
    >
      <div
        className={cn(
          'grid gap-6',
          isView && 'pointer-events-none opacity-90 select-none cursor-default',
        )}
      >
        {children}
      </div>

      {!isView && (
        <div className="flex items-center justify-end gap-x-4 pt-6 border-t border-border/50">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6"
            >
              <X className="mr-2 h-4 w-4" />
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="px-8 min-w-[120px]">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {currentSubmitLabel}
          </Button>
        </div>
      )}

      {isView && onCancel && (
        <div className="flex items-center justify-start pt-6 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </div>
      )}
    </form>
  );
}
