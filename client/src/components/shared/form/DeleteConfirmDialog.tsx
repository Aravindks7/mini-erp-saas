import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmDialogProps {
  /** Controls whether the dialog is shown */
  isOpen: boolean;
  /** Callback when the dialog is closed */
  onClose: () => void;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Name of the entity being deleted (used for display or future type-to-confirm) */
  entityName?: string;
  /** Type of the entity (e.g., "Customer", "Invoice") */
  entityType?: string;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Whether the deletion is in progress */
  isLoading?: boolean;
  /**
   * [EXTensibility] Specific text required to enable the confirm button.
   * If provided, will enable "type-to-confirm" mode.
   */
  requireConfirmationText?: string;
}

/**
 * DeleteConfirmDialog
 *
 * A specialized confirmation dialog for destructive ERP actions.
 * Designed for clinical precision and future-proof extensibility.
 */
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  entityName,
  entityType = 'this item',
  title,
  description,
  confirmLabel = 'Delete',
  isLoading = false,
  requireConfirmationText,
}: DeleteConfirmDialogProps) {
  const [confirmationInput, setConfirmationInput] = React.useState('');

  // Reset input when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('');
    }
  }, [isOpen]);

  const defaultTitle = `Delete ${entityType}?`;
  const defaultDescription = entityName
    ? `Are you sure you want to delete "${entityName}"? This action is permanent and cannot be undone.`
    : `Are you sure you want to delete this ${entityType}? This action is permanent and cannot be undone.`;

  const isConfirmDisabled =
    isLoading || (!!requireConfirmationText && confirmationInput !== requireConfirmationText);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl">{title || defaultTitle}</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {requireConfirmationText && (
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium">
              To confirm, type{' '}
              <span className="font-bold underline selection:bg-destructive selection:text-destructive-foreground">
                {requireConfirmationText}
              </span>{' '}
              below:
            </p>
            <Input
              value={confirmationInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmationInput(e.target.value)
              }
              placeholder={requireConfirmationText}
              className={cn(
                'h-10',
                confirmationInput === requireConfirmationText &&
                  'border-destructive ring-destructive focus-visible:ring-destructive',
              )}
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className="flex-1 sm:flex-none px-8"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
