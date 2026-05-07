import { Link } from 'react-router-dom';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';
import type { InventoryTransferResponse } from '../../api/inventory.api';

export const ReferenceCell = ({
  row,
}: {
  row: { original: InventoryTransferResponse; getValue: (key: string) => unknown };
}) => {
  const { getPath } = useTenantPath();
  const reference = (row.getValue('reference') as string) || row.original.id.slice(0, 8);

  return (
    <Link
      to={getPath(APP_PATHS.inventory.transfers.detail(row.original.id))}
      className="font-medium text-primary hover:underline"
    >
      {reference}
    </Link>
  );
};
