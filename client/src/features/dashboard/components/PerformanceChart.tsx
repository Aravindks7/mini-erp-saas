import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/features/currencies/hooks/use-currency';
import type { PerformancePoint } from '@shared/contracts/dashboard.contract';

interface PerformanceChartProps {
  data: PerformancePoint[];
}

/**
 * Custom Tooltip for the Performance Chart.
 * Axiom: Maintains aesthetic parity with the ERP's design system using shadcn/ui patterns.
 */
function ChartTooltip({ active, payload, label }: TooltipContentProps<any, any>) {
  const { format } = useCurrency();

  if (active && payload && payload.length && label) {
    return (
      <div className="rounded-lg border border-border bg-card/80 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {new Date(label as string | number).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-medium capitalize">{entry.name}</span>
              </div>
              <span className="text-xs font-bold tabular-nums">{format(Number(entry.value))}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Performance Chart: Visualizes Revenue vs. Expenses.
 * Axiom: Uses a modern Line Chart with custom HSL strokes and clinical grid layout.
 */
export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">
            Revenue vs. Expenses (Last 30 Days)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                opacity={0.4}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 500 }}
                tickFormatter={(str) => {
                  const date = new Date(str);
                  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                }}
                minTickGap={30}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 500 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="var(--muted-foreground)"
                width={40}
              />
              <Tooltip
                content={ChartTooltip}
                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Line
                name="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                animationDuration={1500}
              />
              <Line
                name="expenses"
                type="monotone"
                dataKey="expenses"
                stroke="var(--chart-2)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
