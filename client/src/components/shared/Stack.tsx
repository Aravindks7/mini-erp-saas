import React from 'react';
import { cn } from '@/lib/utils';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  spacing?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
}

const spacingMap = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
};

const directionMap = {
  row: 'flex-row',
  col: 'flex-col',
};

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

/**
 * Stack Component
 * A functional layout primitive for managing 1D layouts with consistent spacing.
 */
export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    { className, direction = 'col', spacing = 4, align = 'stretch', justify = 'start', ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionMap[direction],
          spacingMap[spacing],
          alignMap[align],
          justifyMap[justify],
          className,
        )}
        {...props}
      />
    );
  },
);

Stack.displayName = 'Stack';
