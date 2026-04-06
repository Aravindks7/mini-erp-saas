import { DataTable } from '@/components/shared/data-table/DataTable';
import { columns } from './columns';
import { useCustomers } from '../hooks/customers.hooks';
import { AlertCircle } from 'lucide-react';

export function CustomerList() {
  const { data: customers, isLoading, isError } = useCustomers();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-destructive/5 rounded-lg border border-dashed border-destructive/20 animate-in fade-in duration-500">
        <AlertCircle className="h-10 w-10 text-destructive mb-3 opacity-50" />
        <h3 className="text-lg font-bold text-destructive">Failed to load customers</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          We encountered an error while fetching the customer directory. Please check your network
          or try again.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={customers || []}
      searchKey="companyName"
      isLoading={isLoading}
      emptyState={{
        title: 'Customer Directory is empty',
        description: 'You haven\'t added any customers yet. Click "Add Customer" to get started.',
      }}
      bulkActions={[
        {
          label: 'Delete Selected',
          onAction: (rows) =>
            console.log(
              'Bulk delete:',
              rows.map((r) => r.id),
            ),
          variant: 'destructive',
        },
      ]}
    />
  );
}
