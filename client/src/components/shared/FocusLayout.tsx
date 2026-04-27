import Navbar from '@/components/shared/Navbar';
import { cn } from '@/lib/utils';

interface FocusLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function FocusLayout({ children, className }: FocusLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-y-auto bg-background relative">
      <Navbar />

      <main className={cn('flex-1 bg-muted/40', className)}>{children}</main>
    </div>
  );
}
