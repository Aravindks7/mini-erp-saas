import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CopyButtonProps {
  value: string;
  className?: string;
}

/**
 * A sleek, minimal copy button with success feedback.
 * Standardizes the "Copy to Clipboard" pattern across the ERP.
 */
export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-7 w-7 text-muted-foreground hover:text-primary transition-colors',
        className,
      )}
      onClick={handleCopy}
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="sr-only">Copy</span>
    </Button>
  );
}
