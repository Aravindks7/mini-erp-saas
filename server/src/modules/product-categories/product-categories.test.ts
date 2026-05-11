import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productCategoriesService } from './product-categories.service.js';
import { db } from '../../db/index.js';

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      productCategories: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn((cb) => cb(db)),
  },
}));

describe('ProductCategoriesService', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCategories', () => {
    it('should return categories for the organization', async () => {
      const mockData = [{ id: '1', name: 'Cat 1', organizationId: mockOrgId }];
      vi.mocked(db.query.productCategories.findMany).mockResolvedValue(mockData as any);

      const result = await productCategoriesService.listCategories(mockOrgId);

      expect(result).toEqual(mockData);
      expect(db.query.productCategories.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        }),
      );
    });
  });

  describe('checkDuplicate', () => {
    it('should return a category if a duplicate code exists', async () => {
      const mockCategory = { id: '1', code: 'CODE1', organizationId: mockOrgId };
      vi.mocked(db.query.productCategories.findFirst).mockResolvedValue(mockCategory as any);

      const result = await productCategoriesService.checkDuplicate(mockOrgId, 'CODE1');

      expect(result).toEqual(mockCategory);
    });

    it('should return null if no duplicate exists', async () => {
      vi.mocked(db.query.productCategories.findFirst).mockResolvedValue(null as any);

      const result = await productCategoriesService.checkDuplicate(mockOrgId, 'NEWCODE');

      expect(result).toBeNull();
    });
  });

  describe('validateHierarchy', () => {
    it('should throw error if category is its own parent', async () => {
      await expect(
        productCategoriesService.validateHierarchy(mockOrgId, 'cat-1', 'cat-1'),
      ).rejects.toThrow('A category cannot be its own parent');
    });

    it('should detect circular dependencies', async () => {
      // Hierarchy: Root -> Parent -> Child
      // Attempting to set Child as Parent's parent

      // When walking up from parentId (Child), we should find categoryId (Parent)
      vi.mocked(db.query.productCategories.findFirst)
        .mockResolvedValueOnce({ parentId: 'cat-parent' } as any) // Child's parent is Parent
        .mockResolvedValueOnce({ parentId: null } as any); // Parent's parent is null

      await expect(
        productCategoriesService.validateHierarchy(mockOrgId, 'cat-parent', 'cat-child'),
      ).rejects.toThrow('Circular dependency detected');
    });

    it('should pass for valid hierarchies', async () => {
      vi.mocked(db.query.productCategories.findFirst).mockResolvedValue({ parentId: null } as any);

      const result = await productCategoriesService.validateHierarchy(
        mockOrgId,
        'cat-child',
        'cat-parent',
      );
      expect(result).toBe(true);
    });
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const input = { name: 'New Cat', code: 'NEW' };
      const mockNewCat = { id: 'new-id', ...input };

      vi.mocked(db.query.productCategories.findFirst)
        .mockResolvedValueOnce(null as any) // No duplicate check
        .mockResolvedValueOnce(mockNewCat as any); // Re-fetch after create

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockNewCat]),
        }),
      } as any);

      const result = await productCategoriesService.createCategory(mockOrgId, mockUserId, input);

      expect(result).toEqual(mockNewCat);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should fail if code is duplicate', async () => {
      vi.mocked(db.query.productCategories.findFirst).mockResolvedValue({ id: 'existing' } as any);

      await expect(
        productCategoriesService.createCategory(mockOrgId, mockUserId, {
          name: 'Name',
          code: 'DUP',
        }),
      ).rejects.toThrow('already exists');
    });
  });

  describe('deleteCategory', () => {
    it('should soft delete successfully', async () => {
      const mockExistingCat = { id: 'cat-1', code: 'C1', name: 'Cat 1' };
      vi.mocked(db.query.productCategories.findFirst)
        .mockResolvedValueOnce(mockExistingCat as any) // existence check
        .mockResolvedValueOnce(null as any); // No children check

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'cat-1', deletedAt: new Date() }]),
          }),
        }),
      } as any);

      const result = await productCategoriesService.deleteCategory(mockOrgId, mockUserId, 'cat-1');

      expect(result).not.toBeNull();
      expect(db.update).toHaveBeenCalled();
    });

    it('should fail if category has children', async () => {
      vi.mocked(db.query.productCategories.findFirst).mockResolvedValue({ id: 'child-id' } as any);

      await expect(
        productCategoriesService.deleteCategory(mockOrgId, mockUserId, 'parent-id'),
      ).rejects.toThrow('Cannot delete category that has sub-categories');
    });
  });
});
