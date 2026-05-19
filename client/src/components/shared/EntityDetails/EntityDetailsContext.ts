import * as React from 'react';

export interface EntityDetailsContextValue<T = unknown> {
  data: T;
  id: string;
  entityType: string;
}

export const EntityDetailsContext = React.createContext<
  EntityDetailsContextValue<unknown> | undefined
>(undefined);

export function useEntityDetails<T>() {
  const context = React.useContext(EntityDetailsContext);
  if (context === undefined) {
    throw new Error('useEntityDetails must be used within an EntityDetailsProvider');
  }
  return context as EntityDetailsContextValue<T>;
}
