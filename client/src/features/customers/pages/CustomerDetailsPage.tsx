import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomer } from '../api/customers';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, MapPin, Phone, Mail, ArrowLeft, FileEdit, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { DetailView } from '@/components/shared/DetailView';
import { UserDisplay } from '@/components/shared/UserDisplay';
import { AuditInfo } from '@/components/shared/AuditInfo';

const customerStatusMap: StatusMap<string> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, isLoading, isError } = useCustomer(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Customer not found</h2>
        <Button variant="outline" onClick={() => navigate('/customers')}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
        </Button>
        <Button asChild>
          <Link to={`/customers/${customer.id}/edit`}>
            <FileEdit className="mr-2 h-4 w-4" /> Edit Customer
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{customer.companyName}</h2>
            <StatusBadge value={customer.status} statusMap={customerStatusMap} />
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-1 bg-muted w-fit px-2 py-0.5 rounded">
            ID: {customer.id}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="addresses">Addresses ({customer.addresses?.length || 0})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({customer.contacts?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailView
                columns={2}
                sections={[
                  {
                    items: [
                      {
                        label: 'Company Name',
                        value: (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary/60" />
                            <span>{customer.companyName}</span>
                          </div>
                        ),
                      },
                      { label: 'Tax Number', value: customer.taxNumber },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>

          <AuditInfo createdAt={customer.createdAt} updatedAt={customer.updatedAt} />
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {customer.addresses?.length ? (
              customer.addresses.map((address) => (
                <Card
                  key={address.id}
                  className={address.isPrimary ? 'border-primary/50 shadow-sm' : ''}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {address.addressType || 'General Address'}
                      </CardTitle>
                      {address.isPrimary && (
                        <StatusBadge
                          value="primary"
                          statusMap={{ primary: { label: 'Primary', tone: 'info' } }}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>
                      {address.city}, {address.state || ''} {address.postalCode || ''}
                    </p>
                    <p className="font-medium">{address.country}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground p-4">No addresses registered.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {customer.contacts?.length ? (
              customer.contacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={contact.isPrimary ? 'border-primary/50 shadow-sm' : ''}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <UserDisplay
                        name={`${contact.firstName} ${contact.lastName}`}
                        email={contact.email}
                        size="sm"
                      />
                      {contact.isPrimary && (
                        <StatusBadge
                          value="primary"
                          statusMap={{ primary: { label: 'Primary', tone: 'info' } }}
                        />
                      )}
                    </div>
                    {contact.jobTitle && (
                      <CardDescription className="pl-[41px]">{contact.jobTitle}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-primary hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground p-4">No contacts registered.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
