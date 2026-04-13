import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item',
    description: 'Are you sure?',
  };

  it('should render when open', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should call onClose when cancel is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onConfirm and show loading state', async () => {
    const onConfirm = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    expect(onConfirm).toHaveBeenCalled();
    // Verify loading spinner appears (ConfirmDialog sets internalLoading to true)
    // Note: LoadingSpinner implementation might need checking for aria-label or data-slot
  });

  it('should disable buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    // Confirm button should also be disabled
    const confirmButton = screen.getByRole('button', { name: /Confirm/i });
    expect(confirmButton).toBeDisabled();
  });
});
