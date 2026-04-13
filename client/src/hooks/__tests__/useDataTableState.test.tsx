import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { z } from 'zod';
import { describe, it, expect } from 'vitest';
import { useDataTableState } from '../useDataTableState';

const testSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
});

describe('useDataTableState', () => {
  it('should parse default empty URL params', () => {
    const { result } = renderHook(() => useDataTableState(testSchema), {
      wrapper: MemoryRouter,
    });
    expect(result.current.parsedParams).toEqual({
      page: 1,
      pageSize: 10,
      view: 'list',
    });
    expect(result.current.tableState.pagination.pageIndex).toBe(0);
  });
});
