import type { SalesOrderResponse } from '../api/sales-orders.api';
import { PartyDetailsCard } from '@/components/shared/domain/PartyDetailsCard';
import { EntityActivityTimeline } from '@/components/shared/domain/EntityActivityTimeline';

interface SalesOrderSidebarProps {
  order: SalesOrderResponse;
}

export function SalesOrderSidebar({ order }: SalesOrderSidebarProps) {
  const primaryContact =
    order.customer.contacts.find((c) => c.isPrimary) || order.customer.contacts[0];
  const shippingAddress = order.customer.addresses[0]?.address;
  const billingAddress = order.customer.addresses[1]?.address; // For demo, use 2nd if exists

  return (
    <aside className="space-y-6">
      {/* Party Details Consolidated Card */}
      <PartyDetailsCard
        type="Customer"
        name={order.customer.companyName}
        contact={primaryContact?.contact}
        shippingAddress={shippingAddress}
        billingAddress={billingAddress}
      />
      <EntityActivityTimeline entityType="sales_order" entityId={order.id} />
    </aside>
  );
}
