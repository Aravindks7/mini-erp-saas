import { ReceiptText, CreditCard, Calendar, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { format } from 'date-fns';
import { useCurrency } from '@/features/currencies/hooks/use-currency';
import { APP_PATHS } from '@/lib/paths';

interface BillingHistoryCardProps {
  invoices: Array<{
    id: string;
    documentNumber: string;
    status: string;
    totalAmount: string;
    balanceDue: string;
    createdAt: string;
  }>;
}

export function BillingHistoryCard({ invoices }: BillingHistoryCardProps) {
  const { format: formatCurrency } = useCurrency();

  if (!invoices || invoices.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-muted/10 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
            Billing & Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col items-center justify-center py-8 text-center">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <CreditCard className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">No invoices generated yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 py-3 border-b">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Billing & Invoices</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/10 text-[10px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/40">
                <th className="px-4 py-2 font-bold">Invoice Ref</th>
                <th className="px-4 py-2 font-bold">Status</th>
                <th className="px-4 py-2 font-bold text-right">Amount</th>
                <th className="px-4 py-2 font-bold text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <Link
                        to={APP_PATHS.sales.invoices.detail(invoice.id)}
                        className="text-sm font-bold text-foreground hover:text-primary hover:underline transition-colors"
                      >
                        {invoice.documentNumber}
                      </Link>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={invoice.status} entityType="invoice" />
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                    {formatCurrency(Number(invoice.totalAmount))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono font-bold text-sm ${Number(invoice.balanceDue) > 0 ? 'text-destructive' : 'text-emerald-600'}`}
                    >
                      {formatCurrency(Number(invoice.balanceDue))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
