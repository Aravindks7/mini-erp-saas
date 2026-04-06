import { DataTable } from '@/components/shared/data-table/DataTable';
import { columns } from './columns';
import { useCustomers } from '../hooks/customers.hooks';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerList() {
  const { data: customers, isLoading, isError } = useCustomers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-destructive bg-destructive/10 rounded-md">
        Failed to load customers.
      </div>
    );
  }

  return <DataTable columns={columns} data={customers || []} searchKey="companyName" />;
}
