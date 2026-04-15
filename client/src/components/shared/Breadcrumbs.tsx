import * as React from 'react';
import { useMatches, Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useTenantPath } from '@/hooks/useTenantPath';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { AppUIMatch } from '@/lib/router-utils';

interface BreadcrumbsProps {
  className?: string;
  homeLabel?: string;
}

/**
 * Standard Breadcrumbs for ERP SaaS.
 * Native implementation using Route-Driven Metadata Architecture.
 * Leverages React Router's `handle` property for declarative navigation.
 */
export function Breadcrumbs({ className, homeLabel = 'Dashboard' }: BreadcrumbsProps) {
  const matches = useMatches() as AppUIMatch[];
  const { getPath } = useTenantPath();

  // Filter matches that have a crumb defined in their handle
  const crumbs = matches
    .filter((match) => Boolean(match.handle?.crumb))
    .map((match) => {
      const { handle, data, pathname } = match;
      const crumb = handle.crumb;
      const label = typeof crumb === 'function' ? crumb(data) : crumb;
      return { pathname, label };
    });

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to={getPath('/')}
              className="flex items-center gap-1.5 group transition-colors hover:text-foreground"
            >
              <Home className="size-3.5 group-hover:scale-110 transition-transform" />
              <span className="sr-only md:not-sr-only md:inline-block font-medium">
                {homeLabel}
              </span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <React.Fragment key={crumb.pathname}>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="animate-in slide-in-from-left-1 duration-200">
                {isLast ? (
                  <BreadcrumbPage className="truncate max-w-[200px] font-semibold text-foreground">
                    {crumb.label as React.ReactNode}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={crumb.pathname}
                      className="truncate max-w-[150px] transition-colors hover:text-foreground"
                    >
                      {crumb.label as React.ReactNode}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
