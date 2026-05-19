import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCurrency } from '@/features/currencies/hooks/use-currency';
import { cn } from '@/lib/utils';

export interface LineItem {
  id: string;
  product: {
    sku: string;
    name: string;
  };
  quantity: string | number;
  unitPrice: string | number;
  taxAmount: string | number;
  quantityShipped?: string | number; // For Sales
  quantityReceived?: string | number; // For Purchase
}

interface LineItemsTableProps {
  lines: LineItem[];
  type?: 'sales' | 'purchase' | 'invoice';
  className?: string;
}

/**
 * Reusable Line Items Table for Order Documents.
 * Implements Rule 7.6 (Domain-Specific Shared Abstractions).
 */
export function LineItemsTable({ lines, type = 'sales', className }: LineItemsTableProps) {
  const { format: formatCurrency } = useCurrency();

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-[100px] pl-6 font-semibold">SKU</TableHead>
          <TableHead className="font-semibold">Product</TableHead>
          <TableHead className="text-right font-semibold">
            {type === 'sales' ? 'Ordered' : 'Quantity'}
          </TableHead>
          {type === 'sales' && (
            <>
              <TableHead className="text-right font-semibold">Shipped</TableHead>
              <TableHead className="text-right font-semibold">Remaining</TableHead>
            </>
          )}
          {type === 'purchase' && (
            <>
              <TableHead className="text-right font-semibold">Received</TableHead>
            </>
          )}
          <TableHead className="text-right font-semibold">Unit Price</TableHead>
          <TableHead className="text-right pr-6 font-semibold">Line Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => {
          const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
          const lineTotal = lineSubtotal + Number(line.taxAmount);
          const fulfilled = Number(line.quantityShipped || line.quantityReceived || 0);
          const remaining = Math.max(0, Number(line.quantity) - fulfilled);

          return (
            <TableRow key={line.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-xs pl-6">{line.product.sku}</TableCell>
              <TableCell className="font-medium">{line.product.name}</TableCell>
              <TableCell className="text-right">{line.quantity}</TableCell>
              {(type === 'sales' || type === 'purchase') && (
                <TableCell className="text-right text-blue-600 font-medium">
                  {fulfilled > 0 ? fulfilled : '-'}
                </TableCell>
              )}
              {type === 'sales' && (
                <TableCell className="text-right font-medium">
                  {remaining > 0 ? (
                    <span
                      className={cn(remaining === Number(line.quantity) ? '' : 'text-amber-600')}
                    >
                      {remaining}
                    </span>
                  ) : (
                    <span className="text-green-600">Filled</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-right">{formatCurrency(Number(line.unitPrice))}</TableCell>
              <TableCell className="text-right font-semibold pr-6 text-primary">
                {formatCurrency(lineTotal)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
