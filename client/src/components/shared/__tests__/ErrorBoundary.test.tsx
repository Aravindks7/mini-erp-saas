import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

const ProblematicComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test Error');
  }
  return <div>Safe Content</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors during test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('should catch errors and render fallback UI', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Module Error/i)).toBeInTheDocument();
    expect(screen.getByText(/A critical error occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('should render custom fallback if provided', () => {
    const customFallback = <div>Custom Fallback</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });

  it('should call onReset and clear error state when retry is clicked', () => {
    const onReset = vi.fn();

    const TestWrapper = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary
          onReset={() => {
            onReset();
            setShouldThrow(false);
          }}
        >
          <ProblematicComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestWrapper />);

    expect(screen.getByText(/Module Error/i)).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    expect(onReset).toHaveBeenCalled();
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
    expect(screen.queryByText(/Module Error/i)).not.toBeInTheDocument();
  });
});
