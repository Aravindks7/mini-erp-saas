import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

interface BreadcrumbsProps {
  className?: string;
  homeLabel?: string;
  /**
   * Explicitly override path segments with custom labels or components.
   * Useful for replacing UUIDs with names or 'new' with 'Add Customer'.
   */
  overrides?: Record<string, React.ReactNode>;
  /**
   * If true, dynamic segments that match a UUID pattern (or specific overrides)
   * will show a skeleton instead of the raw value.
   */
  isLoading?: boolean;
}

/**
 * Standard Breadcrumbs for ERP SaaS.
 * Auto-generates path navigation from URL hierarchy with support for dynamic overrides.
 * Provides a clinical, structured wayfinding experience.
 */
export function Breadcrumbs({
  className,
  homeLabel = 'Dashboard',
  overrides = {},
  isLoading = false,
}: BreadcrumbsProps) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  /**
   * Formats a URL segment into a clinical label if no override is provided.
   */
  const formatLabel = (name: string) => {
    if (overrides[name]) return overrides[name];

    // Handle database IDs (e.g., uuid-like strings)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(name)) {
      if (isLoading) return <Skeleton className="h-4 w-24" />;
      return 'Detail View';
    }

    if (name.length > 32) return name.substring(0, 12) + '...';

    return name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Breadcrumb className={cn('mb-4', className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to="/"
              className="flex items-center gap-1.5 group transition-colors hover:text-foreground"
            >
              <Home className="size-3.5 group-hover:scale-110 transition-transform" />
              <span className="sr-only md:not-sr-only md:inline-block font-medium">
                {homeLabel}
              </span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = formatLabel(name);

          // If it's a dynamic segment and we are loading, show skeleton if no custom label exists yet
          const content =
            isLoading && !overrides[name] && /^[0-9a-f]{8,}/i.test(name) ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              label
            );

          return (
            <React.Fragment key={routeTo}>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="animate-in slide-in-from-left-1 duration-200">
                {isLast ? (
                  <BreadcrumbPage className="truncate max-w-[200px] font-semibold text-foreground">
                    {content}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={routeTo}
                      className="truncate max-w-[150px] transition-colors hover:text-foreground"
                    >
                      {content}
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
