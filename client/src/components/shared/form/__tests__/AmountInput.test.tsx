import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AmountInput } from '../AmountInput';

const AmountInputWrapper = ({
  initialValue,
  currency,
}: {
  initialValue?: number;
  currency: string;
}) => {
  const [value, setValue] = React.useState<number | undefined>(initialValue);
  return <AmountInput value={value} onChange={setValue} currency={currency} />;
};

describe('AmountInput Component', () => {
  it('should display initial value formatted as currency', () => {
    render(<AmountInputWrapper initialValue={1234.56} currency="USD" />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('$1,234.56');
  });

  it('should show numeric value on focus for editing', () => {
    render(<AmountInputWrapper initialValue={1234.56} currency="USD" />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);

    expect(input.value).toBe('1234.56');
  });

  it('should format as currency on blur', () => {
    render(<AmountInputWrapper initialValue={1234.56} currency="USD" />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(input.value).toBe('$1,234.56');
  });

  it('should sanitize non-numeric characters while typing', () => {
    render(<AmountInputWrapper initialValue={undefined} currency="USD" />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12abc3.45' } });

    expect(input.value).toBe('123.45');
  });

  it('should handle decimal points correctly', () => {
    render(<AmountInputWrapper initialValue={undefined} currency="USD" />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '10.50' } });

    expect(input.value).toBe('10.50');
  });

  it('should clear value when input is emptied', () => {
    render(<AmountInputWrapper initialValue={100} currency="USD" />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });

    expect(input.value).toBe('');
  });

  it('should update display when currency prop changes', () => {
    const { rerender } = render(<AmountInputWrapper initialValue={100} currency="USD" />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('$100.00');

    rerender(<AmountInputWrapper initialValue={100} currency="EUR" />);
    expect(input.value).toContain('100.00');
    expect(input.value).toMatch(/[€]?100.00[€]?/);
  });
});
