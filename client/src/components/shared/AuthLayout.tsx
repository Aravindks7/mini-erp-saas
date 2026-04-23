import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Shared Layout for unauthenticated pages (Login, Register, etc.)
 * Provides a centered card with consistent branding and spacing.
 */
export default function AuthLayout({ children, title, description, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 relative overflow-hidden">
      {/* Absolute theme toggle location for auth screens */}
      <div className="absolute top-4 right-4 z-50 md:top-8 md:right-8">
        <ThemeToggle variant="compact" />
      </div>

      {/* Decorative background elements for premium feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-[450px] space-y-8 relative z-10">
        {/* Branding placeholder */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 mb-4 ring-4 ring-primary/10">
            <span className="text-primary-foreground font-black text-2xl tracking-tighter">
              ERP
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            ERP SaaS
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Manage your organization with clinical precision and enterprise-grade tools.
          </p>
        </div>

        <Card className={cn('border-border shadow-2xl shadow-primary/5', className)}>
          {(title || description) && (
            <CardHeader className="space-y-1 pb-6">
              {title && <h2 className="text-2xl font-bold tracking-tight text-center">{title}</h2>}
              {description && (
                <p className="text-muted-foreground text-sm text-center">{description}</p>
              )}
            </CardHeader>
          )}
          <CardContent className="p-0">{children}</CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground/60 px-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
