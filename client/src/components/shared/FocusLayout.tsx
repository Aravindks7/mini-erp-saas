import Navbar from '@/components/shared/Navbar';
import { cn } from '@/lib/utils';

interface FocusLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function FocusLayout({ children, className }: FocusLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Navbar />

      <main className={cn('flex-1 overflow-y-auto bg-muted/40', className)}>{children}</main>
    </div>
  );
}
