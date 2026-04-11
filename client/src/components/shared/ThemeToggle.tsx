import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function ThemeToggle({ variant = 'compact', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /**
   * Orchestrates a smooth circular reveal transition when switching themes.
   * This uses the experimental View Transitions API with a fallback for
   * unsupported browsers and users who prefer reduced motion.
   */
  const handleThemeChange = useCallback(
    (newTheme: string, event: React.MouseEvent) => {
      // Fallback for browsers that don't support the API or users with motion sensitivities
      if (
        !document.startViewTransition ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setTheme(newTheme);
        return;
      }

      const { clientX, clientY } = event;
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();

      // Use precise click coordinates, or default to element center for keyboard interactions
      const x = clientX > 0 ? clientX : rect.left + rect.width / 2;
      const y = clientY > 0 ? clientY : rect.top + rect.height / 2;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = (document as any).startViewTransition(async () => {
        setTheme(newTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
          },
          {
            duration: 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      });
    },
    [setTheme],
  );

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
          onClick={(e) => handleThemeChange('light', e)}
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
          onClick={(e) => handleThemeChange('dark', e)}
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
        onClick={(e) => handleThemeChange('light', e)}
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
        onClick={(e) => handleThemeChange('dark', e)}
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
        onClick={(e) => handleThemeChange('system', e)}
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
