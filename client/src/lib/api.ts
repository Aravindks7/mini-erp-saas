const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

/**
 * A centralized fetch wrapper to communicate with the ERP backend.
 * Automatically injects the `x-organization-id` header to maintain tenant isolation.
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Always accept and send JSON by default
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Inject the active organization ID from local storage.
  // This aligns with our TenantContext which persists to `erp_active_org_id`.
  const activeOrgId = localStorage.getItem('erp_active_org_id');
  if (activeOrgId) {
    headers.set('x-organization-id', activeOrgId);
  }

  // ensure cookies are included for better-auth session
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, fetchOptions);

  // Handle successful No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  // Parse JSON if possible
  const text = await response.text();
  const isJson = response.headers.get('content-type')?.includes('application/json');
  let data: unknown;

  try {
    data = isJson && text ? JSON.parse(text) : text;
  } catch (err) {
    console.error('Failed to parse API response:', { err, text });
    data = text;
  }

  if (!response.ok) {
    const errorData = data as Record<string, unknown>; // Narrowing for error extraction
    const errorMessage =
      (errorData?.message as string) || (errorData?.error as string) || response.statusText;
    // Standardize error throwing for React Query to catch
    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}
