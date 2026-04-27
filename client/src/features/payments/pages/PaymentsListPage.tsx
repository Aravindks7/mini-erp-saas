import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function PaymentsListPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Payments"
        description="Monitor cash flow and process payments to vendors or from customers."
      />

      <Card className="mt-6 border-dashed">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CreditCard className="text-primary" size={24} />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Payments module is currently under development. It will provide tools for cash
            management and settlement of bills and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-b-lg">
          <div className="text-muted-foreground text-sm italic">
            Financial Accounting Engine (Phase 2)
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
