import { Activity, TrendingUp, Layers, type LucideIcon } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { PageContainer } from './PageContainer';
import { StatsCard } from './StatsCard';
import DashboardGrid from './DashboardGrid';
import { ModuleCard } from './ModuleCard';
import { Stack } from './Stack';

interface SubModule {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  stats?: string;
  actionLabel?: string;
  color?: string;
}

interface ModuleLandingPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  modules: SubModule[];
}

/**
 * Standardized Module Landing Page for the ERP.
 * Provides a clinical overview of a module category with KPIs and navigation cards.
 */
export default function ModuleLandingPage({
  title,
  description,
  icon: Icon,
  modules,
}: ModuleLandingPageProps) {
  return (
    <PageContainer>
      <Stack spacing={8}>
        {/* Header Section */}
        <PageHeader title={title} description={description} className="pb-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm ring-1 ring-primary/20">
            <Icon size={24} />
          </div>
        </PageHeader>

        {/* Analytics Overview (Mock KPIs) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 px-1">
            Module Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Activity Index"
              value="84"
              icon={Activity}
              trend={{ value: 12, isPositive: true }}
              description="Active sessions today"
            />
            <StatsCard
              title="Revenue Velocity"
              value="+18.4%"
              icon={TrendingUp}
              iconColor="text-emerald-500"
              trend={{ value: 4.2, isPositive: true }}
              description="vs last period"
            />
            <StatsCard
              title="System Load"
              value="42%"
              icon={Layers}
              iconColor="text-amber-500"
              trend={{ value: 2, isPositive: false }}
              description="Average queue depth"
            />
          </div>
        </div>

        {/* Feature Navigation Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 px-1">
            Business Features
          </h2>
          <DashboardGrid className="md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard
                key={module.path}
                title={module.title}
                description={module.description}
                path={module.path}
                icon={module.icon}
                stats={module.stats}
                actionLabel={module.actionLabel}
                color={module.color}
              />
            ))}
          </DashboardGrid>
        </div>
      </Stack>
    </PageContainer>
  );
}
