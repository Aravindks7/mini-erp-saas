import { describe, it, expect } from 'vitest';
import { DiffUtility } from './diff.js';

describe('DiffUtility', () => {
  it('should detect changes in basic fields', () => {
    const oldObj = { name: 'Old Name', status: 'draft' };
    const newObj = { name: 'New Name', status: 'approved' };

    const delta = DiffUtility.getDelta(oldObj, newObj);

    expect(delta).toEqual({
      name: { from: 'Old Name', to: 'New Name' },
      status: { from: 'draft', to: 'approved' },
    });
  });

  it('should ignore fields in IGNORE_FIELDS', () => {
    const oldObj = { id: '1', updatedAt: new Date('2024-01-01'), count: 10 };
    const newObj = { id: '1', updatedAt: new Date('2024-01-02'), count: 20 };

    const delta = DiffUtility.getDelta(oldObj, newObj);

    expect(delta).toEqual({
      count: { from: 10, to: 20 },
    });
    expect(delta.id).toBeUndefined();
    expect(delta.updatedAt).toBeUndefined();
  });

  it('should handle Date comparisons correctly', () => {
    const date1 = new Date('2024-01-01');
    const date2 = new Date('2024-01-01'); // Same time
    const date3 = new Date('2024-01-02'); // Different time

    const oldObj = { date: date1 };
    const newObjSame = { date: date2 };
    const newObjDiff = { date: date3 };

    expect(DiffUtility.getDelta(oldObj, newObjSame)).toEqual({});
    expect(DiffUtility.getDelta(oldObj, newObjDiff)).toEqual({
      date: { from: date1.toISOString(), to: date3.toISOString() },
    });
  });

  it('should handle string vs number comparison for decimals', () => {
    const oldObj = { amount: '100.00' };
    const newObj = { amount: 100 };

    const delta = DiffUtility.getDelta(oldObj, newObj);
    expect(delta).toEqual({});
  });

  it('should handle added fields and ignore missing fields (Partial Update Logic)', () => {
    const oldObj = { a: 1 };
    const newObj = { b: 2 };

    const delta = DiffUtility.getDelta(oldObj, newObj);
    expect(delta).toEqual({
      b: { from: undefined, to: 2 },
    });
    expect(delta.a).toBeUndefined();
  });

  it('should handle null and undefined as equal', () => {
    const oldObj = { a: null };
    const newObj = { a: undefined };

    const delta = DiffUtility.getDelta(oldObj, newObj);
    expect(delta).toEqual({});
  });
});
