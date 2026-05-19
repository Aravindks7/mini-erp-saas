import { useNavigate } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTenantPath } from '@/hooks/useTenantPath';

export interface ModuleCardProps {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  stats?: string;
  actionLabel?: string;
  color?: string;
  className?: string;
}

/**
 * Premium Module Navigation Card.
 * Designed for ERP Landing Pages to provide clear, actionable feature entry points.
 */
export function ModuleCard({
  title,
  description,
  path,
  icon: Icon,
  stats,
  actionLabel = 'Explore',
  color = 'bg-primary',
  className,
}: ModuleCardProps) {
  const { getPath } = useTenantPath();
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(getPath(path))}
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 bg-card/50 backdrop-blur-sm cursor-pointer',
        className,
      )}
    >
      {/* Decorative Background Accent */}
      <div
        className={cn(
          'absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-125',
          color,
        )}
      />

      <CardHeader className="pb-4">
        <div
          className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ring-1 ring-border shadow-sm',
            'bg-muted group-hover:bg-primary/10 group-hover:text-primary group-hover:ring-primary/20',
          )}
        >
          <Icon
            size={22}
            className="shrink-0 transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm leading-relaxed font-medium text-muted-foreground/80">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-between pt-0">
        <div className="text-xs font-bold uppercase tracking-widest text-primary/70">
          {stats || 'View Details'}
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-primary transition-colors">
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </CardContent>

      {/* Subtle bottom accent line */}
      <div className="h-[2px] w-full bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}
