import * as React from 'react';
import { HelpCircle, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TOKENS = [
  { label: 'Full Year', value: '[YYYY]', example: '2024' },
  { label: 'Short Year', value: '[YY]', example: '24' },
  { label: 'Month', value: '[MM]', example: '05' },
  { label: 'Day', value: '[DD]', example: '12' },
];

/**
 * TokenInput: A standard input augmented with a token-helper popover.
 * Allows users to quickly discover and insert dynamic placeholders.
 */
export const TokenInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const internalRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => internalRef.current!);

  const insertToken = (token: string) => {
    const input = internalRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const val = input.value;
    const newVal = val.substring(0, start) + token + val.substring(end);

    // We need to manually trigger onChange because we're manipulating the DOM directly
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    nativeInputValueSetter?.call(input, newVal);

    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);

    // Update cursor position
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  return (
    <div className="relative flex items-center group">
      <Input ref={internalRef} className={cn('pr-10 font-mono text-sm', className)} {...props} />
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Show dynamic tokens</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-3">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold">Dynamic Tokens</h4>
                <p className="text-xs text-muted-foreground">
                  Insert these placeholders to create dynamic document numbers.
                </p>
              </div>
              <div className="grid gap-2">
                {TOKENS.map((token) => (
                  <button
                    key={token.value}
                    type="button"
                    onClick={() => insertToken(token.value)}
                    className="flex items-center justify-between p-2 text-xs rounded-md border bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-primary">{token.value}</span>
                      <span className="text-[10px] text-muted-foreground">{token.label}</span>
                    </div>
                    <span className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border">
                      ex: {token.example}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});

TokenInput.displayName = 'TokenInput';
