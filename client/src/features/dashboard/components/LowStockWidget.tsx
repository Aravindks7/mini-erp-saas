import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { LowStockItem } from '@shared/contracts/dashboard.contract';

interface LowStockWidgetProps {
  items: LowStockItem[];
}

/**
 * Widget displaying items with critical stock levels.
 * Axiom: Real-time query (not materialized) for operational urgency.
 */
export function LowStockWidget({ items }: LowStockWidgetProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Critical Stock Levels</CardTitle>
        <AlertTriangle className="h-4 w-4 text-rose-500" />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No items below threshold.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={`${item.productId}-${item.warehouseName}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                  <TableCell>{item.warehouseName}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive" className="ml-auto">
                      {item.quantityOnHand}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
