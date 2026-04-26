/**
 * Utility to translate Better Auth and server errors into user-friendly messages.
 * Follows industry standards for security (opaque auth errors) and clarity.
 */
export const getAuthErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  // 1. Handle Better Auth error structure { status, message }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const errorWithStatus = error as Record<string, unknown>;
    if (typeof errorWithStatus.status === 'number') {
      switch (errorWithStatus.status) {
        case 401:
          return 'Invalid email or password.';
        case 403:
          return 'Account access denied. Please verify your email or contact support.';
        case 422:
          return 'The information provided is invalid. Please check your inputs.';
        case 429:
          return 'Too many attempts. Please try again in a few minutes.';
        case 500:
          return 'Server error. Our team has been notified. Please try again later.';
      }
    }
  }

  // 2. Handle generic Error objects or custom message strings
  const message = (error as Record<string, unknown>)?.message
    ? String((error as Record<string, unknown>).message)
    : typeof error === 'string'
      ? error
      : '';

  const isNetworkError =
    message.toLowerCase().includes('network error') ||
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('econnrefused');

  if (isNetworkError) {
    return 'Service is temporarily unavailable. Please try again later.';
  }

  return message || 'Something went wrong. Please try again.';
};
