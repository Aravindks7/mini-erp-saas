import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOrganizations, useCreateOrganization } from '../organizations.hooks';
import { organizationsApi } from '../../api/organizations.api';
import type { CreateOrganizationInput } from '@shared/contracts/organizations.contract';

// Mock the API
vi.mock('../../api/organizations.api', () => ({
  organizationsApi: {
    fetchMyOrganizations: vi.fn(),
    createOrganization: vi.fn(),
  },
}));

describe('Organizations Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useOrganizations', () => {
    it('should fetch organizations successfully', async () => {
      const mockOrgs = [{ id: 'org-1', name: 'Org 1' }];
      vi.mocked(organizationsApi.fetchMyOrganizations).mockResolvedValue(
        mockOrgs as unknown as Awaited<ReturnType<typeof organizationsApi.fetchMyOrganizations>>,
      );

      const { result } = renderHook(() => useOrganizations(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockOrgs);
      expect(organizationsApi.fetchMyOrganizations).toHaveBeenCalledTimes(1);
    });
  });

  describe('useCreateOrganization', () => {
    it('should invalidate organization list after creating one', async () => {
      const newOrg = { id: 'org-2', name: 'New Org' };
      vi.mocked(organizationsApi.createOrganization).mockResolvedValue(
        newOrg as unknown as Awaited<ReturnType<typeof organizationsApi.createOrganization>>,
      );

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateOrganization(), { wrapper });

      await result.current.mutateAsync({
        name: 'New Org',
        defaultCountry: 'US',
      } as unknown as CreateOrganizationInput);

      expect(organizationsApi.createOrganization).toHaveBeenCalledWith({
        name: 'New Org',
        defaultCountry: 'US',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['organizations', 'mine'],
      });
    });
  });
});
