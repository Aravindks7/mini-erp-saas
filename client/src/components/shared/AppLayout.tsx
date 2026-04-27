import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function AppLayout({ children, className }: AppLayoutProps) {
  const isDesktop = useBreakpoint('lg');

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {isDesktop && <Sidebar />}

      <div className="flex flex-1 flex-col overflow-y-auto relative">
        <Navbar />

        <main className={cn('flex-1 pb-safe', className)}>{children}</main>
      </div>
    </div>
  );
}
