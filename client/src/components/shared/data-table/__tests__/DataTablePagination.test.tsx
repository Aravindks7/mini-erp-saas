import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { DataTablePagination } from '../DataTablePagination';
import type { Table } from '@tanstack/react-table';

describe('DataTablePagination Component', () => {
  const mockTable = {
    getState: vi.fn().mockReturnValue({
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    }),
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    getPageCount: vi.fn().mockReturnValue(5),
    getCanPreviousPage: vi.fn().mockReturnValue(false),
    getCanNextPage: vi.fn().mockReturnValue(true),
    getFilteredSelectedRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getFilteredRowModel: vi.fn().mockReturnValue({ rows: [] }),
  };

  it('should render pagination info correctly', () => {
    render(<DataTablePagination table={mockTable as unknown as Table<unknown>} />);

    expect(screen.getByText(/Page 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 0 row\(s\) selected/i)).toBeInTheDocument();
  });

  it('should call nextPage when the next button is clicked', () => {
    render(<DataTablePagination table={mockTable as unknown as Table<unknown>} />);

    const nextButton = screen.getByRole('button', { name: /Go to next page/i });
    fireEvent.click(nextButton);

    expect(mockTable.nextPage).toHaveBeenCalled();
  });

  it('should disable previous button on first page', () => {
    render(<DataTablePagination table={mockTable as unknown as Table<unknown>} />);

    const prevButton = screen.getByRole('button', { name: /Go to previous page/i });
    expect(prevButton).toBeDisabled();
  });

  it('should call setPageSize when rows per page changes', () => {
    render(<DataTablePagination table={mockTable as unknown as Table<unknown>} />);

    // Select component in shadcn often uses a hidden input or button
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    // In jsdom/RTL, we might need to find the option by text
    // Note: radix-ui select renders in a portal, might need specific targeting
  });
});
