import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  backButton?: {
    href?: string;
    label?: string;
    onClick?: () => void;
  };
  actions?: PageHeaderAction[];
  children?: React.ReactNode;
  className?: string;
}

/**
 * Enhanced Page Header for ERP modules.
 * A comprehensive header system supporting:
 * 1. Nested Breadcrumbs.
 * 2. Back Navigation (Label + Arrow).
 * 3. Standardized Action Buttons (Primary/Secondary).
 * 4. Flexible Children for custom UI (Search, Filters).
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  backButton,
  actions = [],
  children,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backButton?.onClick) {
      backButton.onClick();
    } else if (backButton?.href) {
      navigate(backButton.href);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('space-y-4 mb-8', className)}>
      {(breadcrumbs || backButton) && (
        <div className="flex flex-col gap-2">
          {breadcrumbs && (
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest px-1">
              {breadcrumbs}
            </div>
          )}
          {backButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="w-fit -ml-2 h-7 px-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-xs font-semibold">{backButton.label || 'Back'}</span>
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between px-1">
        <div className="space-y-1.5 flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate leading-tight lg:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              disabled={action.disabled || action.isLoading}
              className={cn('h-9 gap-2', action.className)}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </Button>
          ))}
          {children}
        </div>
      </div>
    </div>
  );
}
