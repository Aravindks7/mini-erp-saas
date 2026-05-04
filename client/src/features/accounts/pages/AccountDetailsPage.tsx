import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, FileEdit, AlertCircle } from 'lucide-react';
import * as React from 'react';

import { useAccount } from '../hooks/accounts.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { DetailView } from '@/components/shared/DetailView';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { AccountForm } from '../components/AccountForm';

const accountStatusMap: StatusMap<string> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

export default function AccountDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: account, isLoading, isError } = useAccount(id);

  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !account) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Account Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The account record you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/finance/accounts'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Chart of Accounts
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${account.code} - ${account.name}`}
        description="Detailed view of the account classification and settings."
        backButton={{ href: getPath('/finance/accounts'), label: 'Back to CoA' }}
        actions={[
          {
            label: 'Edit Account',
            onClick: () => setIsEditDrawerOpen(true),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge
            value={account.isActive ? 'active' : 'inactive'}
            statusMap={accountStatusMap}
          />
        </div>
      </PageHeader>

      <div className="grid gap-6">
        <Card className="border-muted-foreground/20 shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">Account Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <DetailView
              columns={2}
              sections={[
                {
                  items: [
                    { label: 'Account Code', value: account.code, valueClassName: 'font-mono' },
                    { label: 'Account Name', value: account.name },
                    {
                      label: 'Account Type',
                      value: <span className="capitalize">{account.type}</span>,
                    },
                    {
                      label: 'Status',
                      value: (
                        <StatusBadge
                          value={account.isActive ? 'active' : 'inactive'}
                          statusMap={accountStatusMap}
                        />
                      ),
                    },
                    {
                      label: 'Description',
                      value: account.description || 'No description provided.',
                      fullWidth: true,
                    },
                  ],
                },
              ]}
            />
          </CardContent>
        </Card>

        <AuditInfo createdAt={account.createdAt} updatedAt={account.updatedAt} />
      </div>

      <AccountForm
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        account={account}
      />
    </PageContainer>
  );
}
