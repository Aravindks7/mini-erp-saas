import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="w-full max-w-[450px] space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Branding placeholder */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <span className="text-primary-foreground font-bold text-xl">ERP</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            CloudERP <span className="text-primary">SaaS</span>
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
          <CardContent>{children}</CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground/60 px-8">
          By continuing, you agree to our Terms of Service and Privacy Policy. Built with 100% type
          safety.
        </p>
      </div>
    </div>
  );
}
