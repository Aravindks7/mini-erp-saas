import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function ThemeToggle({ variant = 'compact', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-1 p-1 bg-muted/50 rounded-full border border-border/40',
          className,
        )}
      >
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'p-1.5 rounded-full transition-all duration-200',
            theme === 'light'
              ? 'bg-background text-foreground shadow-sm scale-110'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title="Light Mode"
        >
          <Sun size={14} />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'p-1.5 rounded-full transition-all duration-200',
            theme === 'dark'
              ? 'bg-background text-foreground shadow-sm scale-110'
              : 'text-muted-foreground hover:text-foreground',
          )}
          title="Dark Mode"
        >
          <Moon size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/50',
        className,
      )}
    >
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          theme === 'light'
            ? 'bg-background text-foreground shadow-sm border border-border/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        )}
      >
        <Sun size={14} />
        <span>Light</span>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          theme === 'dark'
            ? 'bg-background text-foreground shadow-sm border border-border/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        )}
      >
        <Moon size={14} />
        <span>Dark</span>
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
          theme === 'system'
            ? 'bg-background text-foreground shadow-sm border border-border/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        )}
      >
        <Monitor size={14} />
        <span>System</span>
      </button>
    </div>
  );
}
