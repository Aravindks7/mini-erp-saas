import { createAdjustment, createTransfer } from '../factories/inventory.factory.js';

export async function runInventoryScenario(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  userId: string;
  productId: string;
  createdAt: Date;
  quantity: string;
  warehouseId: string;
  binId: string;
  toWarehouseId?: string;
  flow:
    | 'positive_adjustment'
    | 'negative_adjustment'
    | 'draft_adjustment'
    | 'cancelled_adjustment'
    | 'transfer_shipped'
    | 'transfer_received'
    | 'transfer_draft'
    | 'transfer_cancelled';
}) {
  switch (config.flow) {
    case 'positive_adjustment':
      await createAdjustment({
        ...config,
        quantityChange: config.quantity,
        reason: 'Stock Increase (Scenario Engine)',
        status: 'approved',
      });
      break;

    case 'negative_adjustment':
      await createAdjustment({
        ...config,
        quantityChange: `-${config.quantity}`,
        reason: 'Damage Write-off (Scenario Engine)',
        status: 'approved',
      });
      break;

    case 'draft_adjustment':
      await createAdjustment({
        ...config,
        quantityChange: config.quantity,
        reason: 'Draft Correction (Scenario Engine)',
        status: 'draft',
      });
      break;

    case 'cancelled_adjustment':
      await createAdjustment({
        ...config,
        quantityChange: config.quantity,
        reason: 'Cancelled Correction (Scenario Engine)',
        status: 'cancelled',
      });
      break;

    case 'transfer_shipped':
      if (!config.toWarehouseId) throw new Error('toWarehouseId required for transfer');
      await createTransfer({
        ...config,
        fromWarehouseId: config.warehouseId,
        toWarehouseId: config.toWarehouseId,
        status: 'shipped',
      });
      break;

    case 'transfer_received':
      if (!config.toWarehouseId) throw new Error('toWarehouseId required for transfer');
      await createTransfer({
        ...config,
        fromWarehouseId: config.warehouseId,
        toWarehouseId: config.toWarehouseId,
        status: 'received',
      });
      break;

    case 'transfer_draft':
      if (!config.toWarehouseId) throw new Error('toWarehouseId required for transfer');
      await createTransfer({
        ...config,
        fromWarehouseId: config.warehouseId,
        toWarehouseId: config.toWarehouseId,
        status: 'draft',
      });
      break;

    case 'transfer_cancelled':
      if (!config.toWarehouseId) throw new Error('toWarehouseId required for transfer');
      await createTransfer({
        ...config,
        fromWarehouseId: config.warehouseId,
        toWarehouseId: config.toWarehouseId,
        status: 'cancelled',
      });
      break;
  }
}
