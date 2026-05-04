import { Card } from '@/components/ui/card';
import type { BalanceSheetResponse } from '@shared/contracts/finance.contract';

interface BalanceSheetTableProps {
  data: BalanceSheetResponse;
}

export function BalanceSheetTable({ data }: BalanceSheetTableProps) {
  const assetLines = (data.details || []).filter((l) => l.type === 'asset');
  const liabilityLines = (data.details || []).filter((l) => l.type === 'liability');
  const equityLines = (data.details || []).filter((l) => l.type === 'equity');

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
            {/* Assets Section */}
            <tr className="bg-success/5">
              <td className="px-6 py-3 font-bold text-success uppercase text-xs tracking-widest">
                Assets
              </td>
              <td></td>
            </tr>
            {assetLines.map((line) => (
              <tr key={line.accountName} className="hover:bg-muted/10 transition-colors">
                <td className="px-10 py-3 text-muted-foreground">{line.accountName}</td>
                <td className="px-6 py-3 text-right font-mono">$ {formatCurrency(line.balance)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-muted/40 font-bold bg-muted/20">
              <td className="px-6 py-4">Total Assets</td>
              <td className="px-6 py-4 text-right font-mono underline decoration-double decoration-primary/40">
                $ {formatCurrency(data.assets)}
              </td>
            </tr>

            {/* Liabilities Section */}
            <tr className="bg-destructive/5 mt-4">
              <td className="px-6 py-3 font-bold text-destructive uppercase text-xs tracking-widest">
                Liabilities
              </td>
              <td></td>
            </tr>
            {liabilityLines.map((line) => (
              <tr key={line.accountName} className="hover:bg-muted/10 transition-colors">
                <td className="px-10 py-3 text-muted-foreground">{line.accountName}</td>
                <td className="px-6 py-3 text-right font-mono text-destructive">
                  $ {formatCurrency(line.balance)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-muted/40 font-bold bg-muted/20">
              <td className="px-6 py-4">Total Liabilities</td>
              <td className="px-6 py-4 text-right font-mono text-destructive">
                $ {formatCurrency(data.liabilities)}
              </td>
            </tr>

            {/* Equity Section */}
            <tr className="bg-primary/5 mt-4">
              <td className="px-6 py-3 font-bold text-primary uppercase text-xs tracking-widest">
                Equity
              </td>
              <td></td>
            </tr>
            {equityLines.map((line) => (
              <tr key={line.accountName} className="hover:bg-muted/10 transition-colors">
                <td className="px-10 py-3 text-muted-foreground">{line.accountName}</td>
                <td className="px-6 py-3 text-right font-mono">$ {formatCurrency(line.balance)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-muted/40 font-bold bg-muted/20">
              <td className="px-6 py-4">Total Equity</td>
              <td className="px-6 py-4 text-right font-mono">$ {formatCurrency(data.equity)}</td>
            </tr>

            {/* Summary Section */}
            <tr className="bg-muted/50 font-black text-lg border-t-4 border-muted/40">
              <td className="px-6 py-6">Total Liabilities & Equity</td>
              <td className="px-6 py-6 text-right font-mono underline decoration-double decoration-muted-foreground/40">
                $ {formatCurrency(data.liabilities + data.equity)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
