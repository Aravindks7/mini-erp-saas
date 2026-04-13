import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSignOutMutation } from '../auth.hooks';
import { authApi } from '../../api/auth.api';
import { TenantProvider } from '@/contexts/TenantContext';

// Mock authApi
vi.mock('../../api/auth.api', () => ({
  authApi: {
    logout: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock localStorage to avoid persistence during tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useSignOutMutation (Nuclear Cleanup)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>{children}</TenantProvider>
    </QueryClientProvider>
  );

  it('should perform "Nuclear Cleanup" on successful logout', async () => {
    // 1. Seed the cache with sensitive data
    const queryKey = ['customers', 'list'];
    const sensitiveData = [{ id: '1', name: 'Secret Customer' }];
    queryClient.setQueryData(queryKey, sensitiveData);

    // Verify it exists in cache
    expect(queryClient.getQueryData(queryKey)).toEqual(sensitiveData);

    // 2. Execute logout
    const { result } = renderHook(() => useSignOutMutation(), { wrapper });

    await result.current.mutateAsync();

    // 3. Verify clinical teardown
    await waitFor(() => {
      // Assert that sensitive data is removed from cache
      expect(queryClient.getQueryData(queryKey)).toBeUndefined();

      // Assert that the entire cache is cleared (no queries remaining)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);

      // Assert that the tenant ID is cleared from localStorage
      expect(localStorage.getItem('erp_active_org_id')).toBeNull();
    });

    expect(authApi.logout).toHaveBeenCalledTimes(1);
  });
});
