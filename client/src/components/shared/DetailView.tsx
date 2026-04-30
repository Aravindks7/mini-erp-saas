import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface DetailItem {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon | React.ElementType;
  action?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export interface DetailSection {
  title?: string;
  items: DetailItem[];
  className?: string;
}

interface DetailViewProps {
  sections: DetailSection[];
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * Standard Detail View Grid for ERP SaaS.
 * Highly structured and clinical presentation for entity-level reading.
 * Supports responsive column layouts and sectioning.
 */
export function DetailView({ sections, columns = 2, className }: DetailViewProps) {
  const columnClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }[columns];

  return (
    <div className={cn('space-y-10', className)}>
      {sections.map((section, sIdx) => (
        <div key={sIdx} className={cn('space-y-4', section.className)}>
          {section.title && (
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1 border-l-2 border-primary/40 pl-3">
              {section.title}
            </h3>
          )}
          <div className={cn('grid gap-x-12 gap-y-8 px-1', columnClass)}>
            {section.items.map((item, iIdx) => {
              const Icon = item.icon;
              const hasValue = !!item.value;
              return (
                <div
                  key={iIdx}
                  className={cn(
                    'flex flex-col gap-2 group transition-all',
                    item.fullWidth && 'md:col-span-full',
                    item.className,
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-tight flex items-center gap-1.5',
                      item.labelClassName,
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {item.label}
                  </span>
                  <div
                    className={cn(
                      'text-sm font-semibold text-foreground/90 wrap-break-word leading-relaxed border-l border-transparent transition-all flex items-start justify-between gap-4',
                      hasValue && 'group-hover:border-primary/20 group-hover:pl-3',
                      item.valueClassName,
                    )}
                  >
                    <div className="flex-1">
                      {item.value || (
                        <span className="text-muted-foreground/30 font-normal italic">
                          Not Provided
                        </span>
                      )}
                    </div>
                    {item.action && (
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.action}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
