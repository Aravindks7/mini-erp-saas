/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react';
import type { UIMatch } from 'react-router-dom';

export interface UIMetadata {
  crumb?: string | ((data: any) => string | ReactNode);
  title?: string | ((data: any) => string);
}

export type AppUIMatch = UIMatch<any, UIMetadata>;
