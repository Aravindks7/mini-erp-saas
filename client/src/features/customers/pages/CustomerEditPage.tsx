import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer, useCreateCustomer, useUpdateCustomer } from '../api/customers';
import { CustomerForm } from '../components/CustomerForm';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import type { CreateCustomerInput } from '@shared/contracts/customers.contract';
import { Button } from '@/components/ui/button';

export default function CustomerEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = !!id;
  const { data: customer, isLoading, isError } = useCustomer(id);
  const { mutateAsync: createCustomer, status: createStatus } = useCreateCustomer();
  const { mutateAsync: updateCustomer, status: updateStatus } = useUpdateCustomer();

  const isSubmitting = createStatus === 'pending' || updateStatus === 'pending';

  const onSubmit = async (data: CreateCustomerInput) => {
    try {
      if (isEditing && id) {
        await updateCustomer({ id, data });
      } else {
        await createCustomer(data);
      }
      navigate('/customers');
    } catch (error) {
      // Error handled by mutation/controller
      console.error('Submission failed:', error);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (isEditing && isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Failed to load customer</h2>
        <Button variant="outline" onClick={() => navigate('/customers')}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">
          {isEditing ? `Edit ${customer?.companyName}` : 'New Customer'}
        </h2>
        <p className="text-muted-foreground">
          {isEditing
            ? 'Modify existing customer information.'
            : 'Onboard a new customer to the platform.'}
        </p>
      </div>

      <CustomerForm initialData={customer} onSubmit={onSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
