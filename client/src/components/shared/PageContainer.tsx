import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-none',
};

export function PageContainer({ children, className, maxWidth = 'xl' }: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full px-4 py-6 md:px-6 md:py-8 lg:px-8 mx-auto',
        MAX_WIDTH_MAP[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}
