import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ProfitAndLossResponse } from '@shared/contracts/finance.contract';

interface PnLTableProps {
  data: ProfitAndLossResponse;
}

export function PnLTable({ data }: PnLTableProps) {
  const revenueLines = (data.details || []).filter((l) => l.type === 'revenue');
  const expenseLines = (data.details || []).filter((l) => l.type === 'expense');

  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card className="overflow-hidden border-muted-foreground/20 shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-muted/40">
              <th className="px-6 py-4 text-left font-semibold uppercase tracking-wider text-muted-foreground/80">
                Account
              </th>
              <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-muted-foreground/80">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted/20">
            {/* Revenue Section */}
            <tr className="bg-success/5">
              <td className="px-6 py-3 font-bold text-success uppercase text-xs tracking-widest">
                Operating Revenue
              </td>
              <td></td>
            </tr>
            {revenueLines.map((line) => (
              <tr key={line.accountName} className="hover:bg-muted/10 transition-colors">
                <td className="px-10 py-3 text-muted-foreground">{line.accountName}</td>
                <td className="px-6 py-3 text-right font-mono">$ {formatCurrency(line.balance)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-muted/40 font-bold bg-muted/20">
              <td className="px-6 py-4">Total Operating Revenue</td>
              <td className="px-6 py-4 text-right font-mono">$ {formatCurrency(data.revenue)}</td>
            </tr>

            {/* Expense Section */}
            <tr className="bg-destructive/5 mt-4">
              <td className="px-6 py-3 font-bold text-destructive uppercase text-xs tracking-widest">
                Operating Expenses
              </td>
              <td></td>
            </tr>
            {expenseLines.map((line) => (
              <tr key={line.accountName} className="hover:bg-muted/10 transition-colors">
                <td className="px-10 py-3 text-muted-foreground">{line.accountName}</td>
                <td className="px-6 py-3 text-right font-mono text-destructive">
                  ($ {formatCurrency(line.balance)})
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-muted/40 font-bold bg-muted/20">
              <td className="px-6 py-4">Total Operating Expenses</td>
              <td className="px-6 py-4 text-right font-mono text-destructive">
                ($ {formatCurrency(data.expenses)})
              </td>
            </tr>

            {/* Summary Section */}
            <tr className="bg-primary/10 font-black text-lg border-t-4 border-primary/20">
              <td className="px-6 py-6">Net Income</td>
              <td
                className={cn(
                  'px-6 py-6 text-right font-mono',
                  data.netIncome >= 0 ? 'text-success' : 'text-destructive',
                )}
              >
                $ {formatCurrency(data.netIncome)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
