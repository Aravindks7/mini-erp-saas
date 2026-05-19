import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useCurrency } from '@/features/currencies/hooks/use-currency';
import type { SalesOrderLineResponse } from '../api/sales-orders.api';

interface SalesOrderItemsCardProps {
  lines: SalesOrderLineResponse[];
}

export function SalesOrderItemsCard({ lines }: SalesOrderItemsCardProps) {
  const { format: formatCurrency } = useCurrency();

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 py-3 border-b">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Order Items</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 px-0">
        <div className="divide-y divide-border/40 pb-4">
          {lines.map((line) => (
            <div
              key={line.id}
              className="group flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
            >
              {/* Product Image Placeholder */}
              <div className="h-16 w-16 shrink-0 rounded-md bg-muted border border-border/40 flex items-center justify-center overflow-hidden">
                <Package className="h-8 w-8 text-muted-foreground/40" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {line.product.name}
                    </h4>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{line.quantity}</span>
                      <span className="text-xs">x</span>
                      <span>{formatCurrency(Number(line.unitPrice))}</span>
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(Number(line.unitPrice) * Number(line.quantity))}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">SKU: {line.product.sku}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
