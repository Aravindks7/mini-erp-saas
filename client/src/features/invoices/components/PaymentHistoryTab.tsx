import { Receipt, Clock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@shared/utils/date';
import { usePaymentsQuery, usePaymentIntentsQuery } from '@/features/payments/hooks/payments.hooks';
import type { PaymentResponse, PaymentIntentResponse } from '@/features/payments/api/payments.api';
import type { InvoiceResponse } from '../api/invoices.api';

interface PaymentHistoryTabProps {
  invoice: InvoiceResponse;
}

const paymentMethodMap: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  credit_card: 'Stripe / Card',
};

import { useCurrency } from '@/features/currencies/hooks/use-currency';

export function PaymentHistoryTab({ invoice }: PaymentHistoryTabProps) {
  const { format: formatCurrency } = useCurrency();
  const { data: allPayments } = usePaymentsQuery();
  const { data: intents } = usePaymentIntentsQuery({ invoiceId: invoice.id });

  const invoicePayments = (allPayments || []).filter(
    (p: PaymentResponse) => p.invoiceId === invoice.id,
  );
  const pendingIntents = (intents || []).filter(
    (i: PaymentIntentResponse) => i.status === 'pending',
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
      {/* Realized Payments */}
      <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">Completed Payments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {invoicePayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right pr-6">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicePayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-6">{formatDate(p.paymentDate)}</TableCell>
                    <TableCell>{paymentMethodMap[p.paymentMethod] || p.paymentMethod}</TableCell>
                    <TableCell className="font-mono text-xs">{p.referenceNumber || '-'}</TableCell>
                    <TableCell className="text-right pr-6 font-bold text-emerald-600">
                      {formatCurrency(Number(p.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
              <p>No payments recorded for this invoice.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Intents / Online Requests */}
      {pendingIntents.length > 0 && (
        <Card className="border-muted-foreground/20 overflow-hidden shadow-sm border-dashed">
          <CardHeader className="bg-amber-500/5 border-b pb-4 border-dashed">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-lg text-amber-900">Active Payment Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="pl-6">Requested On</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingIntents.map((i: PaymentIntentResponse) => (
                  <TableRow key={i.id} className="opacity-70">
                    <TableCell className="pl-6">{formatDate(i.createdAt)}</TableCell>
                    <TableCell className="capitalize">{i.provider}</TableCell>
                    <TableCell>
                      <StatusBadge value={i.status} entityType="payment_intent" />
                    </TableCell>
                    <TableCell className="text-right pr-6 font-semibold">
                      {formatCurrency(Number(i.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
