import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  gap?: number | string;
}

/**
 * Flex Component
 * A general-purpose flexbox container for more complex 1D and 2D layouts.
 * Domain-agnostic layout primitive.
 */
export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      className,
      align = 'center',
      justify = 'start',
      wrap = 'nowrap',
      direction = 'row',
      gap = 2,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          {
            'items-start': align === 'start',
            'items-center': align === 'center',
            'items-end': align === 'end',
            'items-baseline': align === 'baseline',
            'items-stretch': align === 'stretch',
            'justify-start': justify === 'start',
            'justify-center': justify === 'center',
            'justify-end': justify === 'end',
            'justify-between': justify === 'between',
            'justify-around': justify === 'around',
            'justify-evenly': justify === 'evenly',
            'flex-nowrap': wrap === 'nowrap',
            'flex-wrap': wrap === 'wrap',
            'flex-wrap-reverse': wrap === 'wrap-reverse',
            'flex-row': direction === 'row',
            'flex-row-reverse': direction === 'row-reverse',
            'flex-col': direction === 'col',
            'flex-col-reverse': direction === 'col-reverse',
          },
          className,
        )}
        style={{ gap: typeof gap === 'number' ? `${gap * 0.25}rem` : gap, ...style }}
        {...props}
      />
    );
  },
);

Flex.displayName = 'Flex';
