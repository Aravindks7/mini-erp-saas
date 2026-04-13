import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../customers.hooks';
import { customersApi } from '../../api/customers.api';
import { useTenant } from '@/contexts/TenantContext';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@shared/contracts/customers.contract';

// Mock the API and Tenant context
vi.mock('../../api/customers.api', () => ({
  customersApi: {
    fetchCustomers: vi.fn(),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    deleteCustomer: vi.fn(),
  },
}));

vi.mock('@/contexts/TenantContext', () => ({
  useTenant: vi.fn(),
}));

describe('Customers Hooks (Multi-Tenant Data Engine)', () => {
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

    vi.mocked(useTenant).mockReturnValue({
      activeOrganizationId: 'org-123',
    } as unknown as ReturnType<typeof useTenant>);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useCustomers', () => {
    it('should fetch customers successfully', async () => {
      const mockCustomers = [{ id: '1', companyName: 'Acme Corp' }];
      vi.mocked(customersApi.fetchCustomers).mockResolvedValue(
        mockCustomers as unknown as Awaited<ReturnType<typeof customersApi.fetchCustomers>>,
      );

      const { result } = renderHook(() => useCustomers(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockCustomers);
      expect(customersApi.fetchCustomers).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mutations & Cache Invalidation', () => {
    it('should invalidate customer list after creating a customer', async () => {
      const newCustomer = { id: '2', companyName: 'New Corp' };
      vi.mocked(customersApi.createCustomer).mockResolvedValue(
        newCustomer as unknown as Awaited<ReturnType<typeof customersApi.createCustomer>>,
      );

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateCustomer(), { wrapper });

      await result.current.mutateAsync({
        companyName: 'New Corp',
      } as unknown as CreateCustomerInput);

      expect(customersApi.createCustomer).toHaveBeenCalledWith({ companyName: 'New Corp' });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customers', 'list'],
      });
    });

    it('should invalidate list and details after updating a customer', async () => {
      const updatedCustomer = { id: '1', companyName: 'Updated Corp' };
      vi.mocked(customersApi.updateCustomer).mockResolvedValue(
        updatedCustomer as unknown as Awaited<ReturnType<typeof customersApi.updateCustomer>>,
      );

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateCustomer(), { wrapper });

      await result.current.mutateAsync({
        id: '1',
        data: { companyName: 'Updated Corp' } as unknown as UpdateCustomerInput,
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customers', 'list'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customers', 'detail', '1'],
      });
    });

    it('should invalidate list after deleting a customer', async () => {
      vi.mocked(customersApi.deleteCustomer).mockResolvedValue({
        message: 'Deleted',
      } as unknown as Awaited<ReturnType<typeof customersApi.deleteCustomer>>);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteCustomer(), { wrapper });

      await result.current.mutateAsync('1');

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customers', 'list'],
      });
    });
  });
});
