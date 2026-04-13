import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DataTableFilter } from '../DataTableFilter';
import type { Column } from '@tanstack/react-table';

describe('DataTableFilter Component', () => {
  const mockColumn = {
    getFilterValue: vi.fn(),
    setFilterValue: vi.fn(),
  };

  const options = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the filter trigger with title', () => {
    mockColumn.getFilterValue.mockReturnValue(undefined);

    render(
      <DataTableFilter
        column={mockColumn as unknown as Column<unknown, unknown>}
        title="Status"
        options={options}
      />,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should show selected count when items are filtered', () => {
    mockColumn.getFilterValue.mockReturnValue('active,inactive');

    render(
      <DataTableFilter
        column={mockColumn as unknown as Column<unknown, unknown>}
        title="Status"
        options={options}
      />,
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should call setFilterValue when an option is selected', () => {
    mockColumn.getFilterValue.mockReturnValue(undefined);

    render(
      <DataTableFilter
        column={mockColumn as unknown as Column<unknown, unknown>}
        title="Status"
        options={options}
      />,
    );

    // Open popover
    fireEvent.click(screen.getByText('Status'));

    // Select "Active"
    // Note: CommandItem might need a more specific selector depending on implementation
    const activeOption = screen.getByText('Active');
    fireEvent.click(activeOption);

    expect(mockColumn.setFilterValue).toHaveBeenCalledWith('active');
  });

  it('should clear filters when "Clear filters" is clicked', () => {
    mockColumn.getFilterValue.mockReturnValue('active');

    render(
      <DataTableFilter
        column={mockColumn as unknown as Column<unknown, unknown>}
        title="Status"
        options={options}
      />,
    );

    // Open popover
    fireEvent.click(screen.getByText('Status'));

    const clearButton = screen.getByText('Clear filters');
    fireEvent.click(clearButton);

    expect(mockColumn.setFilterValue).toHaveBeenCalledWith(undefined);
  });
});
