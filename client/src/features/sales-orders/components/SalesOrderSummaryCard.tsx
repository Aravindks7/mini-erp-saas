import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/features/currencies/hooks/use-currency';
import { Calculator } from 'lucide-react';

interface SalesOrderSummaryCardProps {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  itemCount: number;
  paidAmount?: number;
}

export function SalesOrderSummaryCard({
  subtotal,
  taxAmount,
  totalAmount,
  itemCount,
  paidAmount = 0,
}: SalesOrderSummaryCardProps) {
  const { format: formatCurrency } = useCurrency();

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 py-3 border-b">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Order Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-6 space-y-4">
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              Subtotal
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium uppercase tracking-tight">
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </span>
            </span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">-$0.00</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">{formatCurrency(0)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-foreground">Total</span>
            <span className="text-base font-bold text-foreground">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid by customer</span>
              <span className="font-medium">{formatCurrency(paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground italic">Payment due when invoice is sent</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
