import * as React from 'react';
import { EntityDetailsContext } from './EntityDetailsContext';

interface EntityDetailsProviderProps<T> {
  children: React.ReactNode;
  data: T;
  id: string;
  entityType: string;
}

export function EntityDetailsProvider<T>({
  children,
  data,
  id,
  entityType,
}: EntityDetailsProviderProps<T>) {
  const value = React.useMemo(
    () => ({
      data,
      id,
      entityType,
    }),
    [data, id, entityType],
  );

  return <EntityDetailsContext.Provider value={value}>{children}</EntityDetailsContext.Provider>;
}
