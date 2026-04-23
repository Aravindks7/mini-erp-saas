import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { DataTableToolbar } from '../DataTableToolbar';
import type { Table } from '@tanstack/react-table';

describe('DataTableToolbar', () => {
  const mockTable = {
    getState: vi.fn().mockReturnValue({ columnFilters: [] }),
    getFilteredSelectedRowModel: vi.fn().mockReturnValue({ rows: [] }),
    resetColumnFilters: vi.fn(),
  } as unknown as Table<unknown>;

  it('renders searchNode when provided', () => {
    render(
      <DataTableToolbar
        table={mockTable}
        searchNode={<div data-testid="search-node">Search</div>}
      />,
    );

    expect(screen.getByTestId('search-node')).toBeInTheDocument();
  });

  it('renders filterNode when provided and toggles it', () => {
    render(
      <DataTableToolbar
        table={mockTable}
        filterNode={<div data-testid="filter-node">Filter</div>}
      />,
    );

    const filterButton = screen.getByRole('button', { name: /filter/i });
    expect(filterButton).toBeInTheDocument();

    // Filter node should not be visible initially
    expect(screen.queryByTestId('filter-node')).not.toBeInTheDocument();

    // Click filter button to show it
    fireEvent.click(filterButton);
    expect(screen.getByTestId('filter-node')).toBeInTheDocument();

    // Click again to hide it
    fireEvent.click(filterButton);
    expect(screen.queryByTestId('filter-node')).not.toBeInTheDocument();
  });

  it('shows active filter count excluding searchKey', () => {
    (mockTable.getState as Mock).mockReturnValue({
      columnFilters: [
        { id: 'companyName', value: 'Acme' },
        { id: 'status', value: 'active' },
      ],
    });

    render(
      <DataTableToolbar
        table={mockTable}
        filterNode={<div data-testid="filter-node">Filter</div>}
        searchKey="companyName"
      />,
    );

    // Should show count of 1 (only 'status')
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls resetColumnFilters when reset button clicked', () => {
    (mockTable.getState as Mock).mockReturnValue({
      columnFilters: [{ id: 'status', value: 'active' }],
    });

    render(<DataTableToolbar table={mockTable} />);

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    expect(mockTable.resetColumnFilters).toHaveBeenCalled();
  });
});
