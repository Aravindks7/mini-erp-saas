import React, { Suspense } from 'react';
import LoadingOverlay from './LoadingOverlay';
import { SkeletonLoader } from './SkeletonLoader';
import { ErrorBoundary } from './ErrorBoundary';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'overlay' | 'skeleton' | 'none';
  errorFallback?: React.ReactNode;
  message?: string;
}

/**
 * SuspenseWrapper Component
 * A domain-agnostic wrapper for React Suspense and ErrorBoundary.
 * Ensures consistent loading and error states across the ERP.
 */
export const SuspenseWrapper = ({
  children,
  fallback,
  variant = 'skeleton',
  errorFallback,
  message,
}: SuspenseWrapperProps) => {
  const defaultFallback =
    variant === 'skeleton' ? (
      <SkeletonLoader variant="card" />
    ) : variant === 'overlay' ? (
      <LoadingOverlay isVisible={true} message={message} />
    ) : null;

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
};
