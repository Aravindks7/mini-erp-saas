import { useParams } from 'react-router-dom';
import { useCallback } from 'react';

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
      if (!slug) return path;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;

      // IDEMPOTENCY CHECK: If the path already starts with /slug/ or is exactly /slug, return it as is.
      if (cleanPath === `/${slug}` || cleanPath.startsWith(`/${slug}/`)) {
        return cleanPath;
      }

      return `/${slug}${cleanPath}`;
    },
    [slug],
  );

  return { slug, getPath };
}
