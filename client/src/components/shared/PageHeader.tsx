import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTenantPath } from '@/hooks/useTenantPath';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

export interface PageHeaderNavigation {
  onPrevious?: () => void;
  onNext?: () => void;
  isPreviousDisabled?: boolean;
  isNextDisabled?: boolean;
}

export interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  hidden?: boolean;
  type?: 'button' | 'submit';
  form?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  breadcrumbs?: React.ReactNode;
  backButton?: {
    href?: string;
    label?: string;
    onClick?: () => void;
  };
  actions?: PageHeaderAction[];
  actionLayout?: 'default' | 'dropdown';
  primaryActionCount?: number;
  navigation?: PageHeaderNavigation;
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
  actionLayout = 'default',
  primaryActionCount = 1,
  navigation,
  children,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();

  const handleBack = () => {
    if (backButton?.onClick) {
      backButton.onClick();
    } else if (backButton?.href) {
      navigate(getPath(backButton.href));
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('space-y-4 mb-6', className)}>
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
          {actionLayout === 'dropdown' &&
          actions.filter((a) => !a.hidden).length > primaryActionCount ? (
            <div className="flex items-center gap-2">
              {/* Primary Actions */}
              {(() => {
                const visibleActions = actions.filter((a) => !a.hidden);
                const primary = visibleActions.slice(0, primaryActionCount);
                const secondary = visibleActions.slice(primaryActionCount);

                return (
                  <>
                    {primary.map((action, idx) => (
                      <Button
                        key={idx}
                        variant={action.variant || 'default'}
                        onClick={action.onClick}
                        disabled={action.disabled || action.isLoading}
                        className={action.className}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </Button>
                    ))}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {secondary.map((action, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            onClick={action.onClick}
                            disabled={action.disabled || action.isLoading}
                            className={cn('gap-2 cursor-pointer', action.className)}
                          >
                            {action.icon && <span className="size-4">{action.icon}</span>}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {navigation && (
                      <>
                        <Separator orientation="vertical" className="m-2" />
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={navigation.onPrevious}
                            disabled={navigation.isPreviousDisabled}
                          >
                            <ChevronLeft />
                          </Button>
                          <Separator orientation="vertical" className="my-1" />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={navigation.onNext}
                            disabled={navigation.isNextDisabled}
                          >
                            <ChevronRight />
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {actions
                .filter((action) => !action.hidden)
                .map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant || 'default'}
                    onClick={action.onClick}
                    disabled={action.disabled || action.isLoading}
                    type={action.type || 'button'}
                    form={action.form}
                    className={action.className}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}

              {navigation && (
                <>
                  <Separator orientation="vertical" className="mx-1 h-8" />
                  <div className="flex items-center border rounded-md h-9 overflow-hidden bg-background">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-full rounded-none border-r w-8 hover:bg-muted"
                      onClick={navigation.onPrevious}
                      disabled={navigation.isPreviousDisabled}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-full rounded-none w-8 hover:bg-muted"
                      onClick={navigation.onNext}
                      disabled={navigation.isNextDisabled}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
