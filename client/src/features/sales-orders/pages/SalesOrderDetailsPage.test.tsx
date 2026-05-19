import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SalesOrderDetailsPage from '../pages/SalesOrderDetailsPage';
import { useSalesOrder, useSalesOrdersQuery } from '../hooks/sales-orders.hooks';
import { useSalesOrderActions } from '../hooks/use-sales-order-actions';
import { useShipmentsQuery, useCreateShipment } from '@/features/shipments/hooks/shipments.hooks';

// Mock the hooks
vi.mock('../hooks/sales-orders.hooks', () => ({
  useSalesOrder: vi.fn(),
  useSalesOrdersQuery: vi.fn(),
}));

vi.mock('../hooks/use-sales-order-actions', () => ({
  useSalesOrderActions: vi.fn(),
}));

vi.mock('@/features/shipments/hooks/shipments.hooks', () => ({
  useShipmentsQuery: vi.fn(),
  useCreateShipment: vi.fn(),
}));

vi.mock('@/features/warehouses/hooks/warehouses.hooks', () => ({
  useWarehousesQuery: vi.fn(),
}));

// Mock Currency hook
vi.mock('@/features/currencies/hooks/use-currency', () => ({
  useCurrency: () => ({
    format: (val: number) => `$${val.toFixed(2)}`,
  }),
}));

const mockSalesOrder = {
  id: 'so_123',
  documentNumber: 'SO-2024-001',
  status: 'approved',
  totalAmount: '100.00',
  createdAt: new Date().toISOString(),
  customer: {
    id: 'cust_123',
    companyName: 'Test Corp',
    contacts: [],
    addresses: [],
  },
  lines: [
    {
      id: 'line_1',
      productId: 'prod_1',
      quantity: '2',
      unitPrice: '50.00',
      taxAmount: '0.00',
      product: {
        id: 'prod_1',
        sku: 'SKU-001',
        name: 'Test Product',
      },
    },
  ],
};

// Mock matchMedia for ResponsiveDrawer
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import { useWarehousesQuery } from '@/features/warehouses/hooks/warehouses.hooks';

describe('SalesOrderDetailsPage (Redesign)', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    queryClient = new QueryClient();

    vi.mocked(useSalesOrder).mockReturnValue({
      data: mockSalesOrder,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSalesOrder>);

    vi.mocked(useSalesOrdersQuery).mockReturnValue({
      data: [mockSalesOrder],
      isLoading: false,
    } as unknown as ReturnType<typeof useSalesOrdersQuery>);

    vi.mocked(useSalesOrderActions).mockReturnValue({
      handleEdit: vi.fn(),
      onApprove: vi.fn(),
      onGenerateInvoice: vi.fn(),
      isUpdatingStatus: false,
      isGeneratingInvoice: false,
    } as unknown as ReturnType<typeof useSalesOrderActions>);

    vi.mocked(useShipmentsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useShipmentsQuery>);

    vi.mocked(useCreateShipment).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateShipment>);

    vi.mocked(useWarehousesQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useWarehousesQuery>);
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/sales/orders/so_123']}>
          <Routes>
            <Route path="/sales/orders/:id" element={<SalesOrderDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders the order header with document number and status', () => {
    renderPage();
    expect(screen.getByText(/Order ID:/i)).toBeInTheDocument();
    expect(screen.getByText(/SO-2024-001/i)).toBeInTheDocument();
    // Use getAllByText for status since it might appear in multiple places (header and badges)
    expect(screen.getAllByText(/Approved/i).length).toBeGreaterThan(0);
  });

  it('renders the order items card', () => {
    renderPage();
    expect(screen.getByText(/Order Items/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
  });

  it('renders the order summary card', () => {
    renderPage();
    // Be more specific about the "Order Summary" text to avoid the description match
    expect(screen.getByText(/^Order Summary$/)).toBeInTheDocument();
    expect(screen.getAllByText(/\$100.00/i).length).toBeGreaterThan(0);
  });

  it('renders the sidebar with customer info', () => {
    renderPage();
    // Match the header in the PartyDetailsCard
    expect(screen.getByText(/Customer Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Corp/i)).toBeInTheDocument();
  });
});
