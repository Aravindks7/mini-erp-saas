'use client';

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

interface BreadcrumbsProps {
  className?: string;
  homeLabel?: string;
}

/**
 * Standard Breadcrumbs for ERP SaaS.
 * Auto-generates path navigation from URL hierarchy using modern shadcn primitives.
 * Provides a clinical, structured wayfinding experience.
 */
export function Breadcrumbs({ className, homeLabel = 'Dashboard' }: BreadcrumbsProps) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  /**
   * Formats a URL segment into a clinical label.
   */
  const formatLabel = (label: string) => {
    // Handle database IDs (e.g., uuid-like strings)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(label)) {
      return 'Detail View';
    }

    if (label.length > 24) return label.substring(0, 10) + '...';

    return label
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Breadcrumb className={cn('mb-4', className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1.5 group">
              <Home className="size-3.5 group-hover:scale-110 transition-transform" />
              <span className="sr-only md:not-sr-only md:inline-block">{homeLabel}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          return (
            <React.Fragment key={name}>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="animate-in slide-in-from-left-1 duration-200">
                {isLast ? (
                  <BreadcrumbPage className="truncate max-w-[200px]">
                    {formatLabel(name)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={routeTo} className="truncate max-w-[150px]">
                      {formatLabel(name)}
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
