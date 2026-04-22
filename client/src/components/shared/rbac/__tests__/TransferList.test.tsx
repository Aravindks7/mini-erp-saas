import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransferList, type TransferItem } from '../TransferList';

const mockItems: TransferItem[] = [
  { id: '1', label: 'Item 1', description: 'Description 1' },
  { id: '2', label: 'Item 2', description: 'Description 2' },
  { id: '3', label: 'Item 3', description: 'Description 3' },
];

describe('TransferList', () => {
  it('renders available and selected items', () => {
    render(<TransferList items={mockItems} value={['2']} onChange={() => {}} />);

    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('Item 3')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();

    // Check titles (Available (2) and Selected (1))
    expect(screen.getByText(/Available \(2\)/)).toBeDefined();
    expect(screen.getByText(/Selected \(1\)/)).toBeDefined();
  });

  it('filters items based on search', () => {
    render(<TransferList items={mockItems} value={[]} onChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText('Search available...');
    fireEvent.change(searchInput, { target: { value: 'Item 1' } });

    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.queryByText('Item 2')).toBeNull();
  });

  it('calls onChange when an item is moved', () => {
    const onChange = vi.fn();
    render(<TransferList items={mockItems} value={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText('Item 1'));
    expect(onChange).toHaveBeenCalledWith(['1']);
  });

  it('calls onChange with all filtered items when Add All is clicked', () => {
    const onChange = vi.fn();
    render(<TransferList items={mockItems} value={[]} onChange={onChange} />);

    const addAllButton = screen.getByTitle('Add filtered items');
    fireEvent.click(addAllButton);
    expect(onChange).toHaveBeenCalledWith(['1', '2', '3']);
  });

  it('calls onChange with remaining items when Remove All is clicked', () => {
    const onChange = vi.fn();
    render(<TransferList items={mockItems} value={['1', '2']} onChange={onChange} />);

    const removeAllButton = screen.getByTitle('Remove filtered items');
    fireEvent.click(removeAllButton);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
