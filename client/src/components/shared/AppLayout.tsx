import Sidebar from '@/components/shared/Sidebar';
import Navbar from '@/components/shared/Navbar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar remains fixed/sticky depending on its internal implementation */}
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className={cn('flex-1 overflow-y-auto bg-muted/40', className)}>{children}</main>
      </div>
    </div>
  );
}
