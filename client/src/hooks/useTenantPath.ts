import { useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { getTenantPath } from '@/lib/path-utils';

/**
 * Hook to handle tenant-aware navigation and path generation.
 * Ensures that all internal links are correctly prefixed with the organization slug.
 */
export function useTenantPath() {
  const { slug } = useParams<{ slug: string }>();

  /**
   * Generates a path prefixed with the current organization slug.
   * If no slug is present (e.g., on public pages), returns the path as-is.
   */
  const getPath = useCallback(
    (path: string) => {
      return getTenantPath(path, slug);
    },
    [slug],
  );

  return { slug, getPath };
}
