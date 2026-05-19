/**
 * Standard utility for generating tenant-aware paths.
 * Can be used in both hook contexts and raw utility functions.
 *
 * @param path The absolute path to the resource (e.g., /dashboard, /sales/customers)
 * @param slug The organization slug (optional)
 */
export function getTenantPath(path: string, slug?: string | null): string {
  if (!slug) return path;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // IDEMPOTENCY CHECK: If the path already starts with /slug/ or is exactly /slug, return it as is.
  if (cleanPath === `/${slug}` || cleanPath.startsWith(`/${slug}/`)) {
    return cleanPath;
  }

  // Ensure we don't end up with double slashes if path is '/'
  if (cleanPath === '/') {
    return `/${slug}`;
  }

  return `/${slug}${cleanPath}`;
}
