import * as React from 'react';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader, type PageHeaderAction } from '@/components/shared/PageHeader';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { Button } from '@/components/ui/button';
import { useTenantPath } from '@/hooks/useTenantPath';

interface EntityDetailsWrapperProps<T = unknown> {
  /** Loading state from query hook */
  isLoading: boolean;
  /** Error state from query hook */
  isError: boolean;
  /** Hydrated entity data */
  data: T | undefined | null;
  /** Primary title (e.g. Document Number or Company Name) */
  title: string;
  /** Secondary description */
  description?: string;
  /** Navigation config for the back button */
  backButton: {
    label: string;
    href: string;
  };
  /** Standardized header actions */
  actions?: PageHeaderAction[];
  /** Optional slot for status badges or extra header info */
  headerStatus?: React.ReactNode;
  /** Optional lifecycle stepper */
  stepper?: React.ReactNode;
  /** Optional KPI cards/stats */
  stats?: React.ReactNode;
  /** Main page content (Tabs, Cards, etc.) */
  children: React.ReactNode;
  /** Custom not found UI config */
  notFoundConfig?: {
    title: string;
    description: string;
  };
}

/**
 * Standardized Scaffold for Entity Details Pages.
 * Implements the Slot Pattern (C) for layout abstraction.
 * Handles Loading, Error, and Not Found states internally.
 */
export function EntityDetailsWrapper<T>({
  isLoading,
  isError,
  data,
  title,
  description,
  backButton,
  actions = [],
  headerStatus,
  stepper,
  stats,
  children,
  notFoundConfig,
}: EntityDetailsWrapperProps<T>) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="details" />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            {notFoundConfig?.title || 'Record Not Found'}
          </h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            {notFoundConfig?.description ||
              "The record you are looking for doesn't exist or you don't have access."}
          </p>
          <Button
            variant="link"
            onClick={() => navigate(getPath(backButton.href))}
            className="text-primary font-semibold"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {backButton.label}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={description}
        backButton={{
          onClick: () => navigate(getPath(backButton.href)),
          label: backButton.label,
        }}
        actions={actions}
      >
        {headerStatus && <div className="hidden sm:block ml-4 border-l pl-4">{headerStatus}</div>}
      </PageHeader>

      {stepper && <div className="mb-12 mt-2">{stepper}</div>}

      {stats && <div className="mb-6">{stats}</div>}

      {children}
    </PageContainer>
  );
}
