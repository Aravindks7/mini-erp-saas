import * as React from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface RowAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  tooltip?: string;
  className?: string;
}

interface DataTableRowActionsProps {
  primaryActions: RowAction[];
  secondaryActions?: RowAction[];
  className?: string;
}

export function DataTableRowActions({
  primaryActions,
  secondaryActions,
  className,
}: DataTableRowActionsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex items-center justify-end gap-1', className)}>
        {primaryActions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 transition-all duration-200 hover:scale-110',
                  action.variant === 'destructive'
                    ? 'text-destructive hover:bg-destructive/10 hover:text-destructive'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  action.className,
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
              >
                {action.icon}
                <span className="sr-only">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {action.tooltip || action.label}
            </TooltipContent>
          </Tooltip>
        ))}

        {secondaryActions && secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              {secondaryActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    action.variant === 'destructive' &&
                      'text-destructive focus:bg-destructive/10 focus:text-destructive',
                    action.className,
                  )}
                >
                  {action.icon && <span className="h-4 w-4 shrink-0">{action.icon}</span>}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  );
}
