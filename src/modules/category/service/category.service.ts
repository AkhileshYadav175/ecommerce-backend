import { CategoryRepository } from '../repository/category.repository.js';
import { CreateCategoryInput, GetCategoriesQueryInput, UpdateCategoryInput, DBCategory, PaginatedCategoriesResult, CategoryTreeNode } from '../category.types.js';
import { slugify } from '../../../utils/slug.js';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Create a new category with auto slug generation and level computation.
   */
  async createCategory(input: CreateCategoryInput): Promise<DBCategory> {
    // 1. Resolve unique URL slug
    const baseSlug = slugify(input.name);
    let slug = baseSlug;
    let counter = 1;
    while (await this.categoryRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 2. Resolve level hierarchy
    let level = 1;
    if (input.parent_id) {
      const parent = await this.categoryRepository.findById(input.parent_id);
      if (!parent) {
        const error: any = new Error('Parent category not found');
        error.status = 400;
        throw error;
      }
      level = parent.level + 1;
    }

    // 3. Create category
    return this.categoryRepository.createCategory(input, slug, level);
  }

  /**
   * Fetch paginated list of categories.
   */
  async getCategories(query: GetCategoriesQueryInput): Promise<PaginatedCategoriesResult> {
    const { categories, total } = await this.categoryRepository.findCategories(query);
    const totalPages = Math.ceil(total / query.limit);

    return {
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      categories,
    };
  }

  /**
   * Fetch categories structured as a tree.
   */
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.categoryRepository.findAllActiveNonDeleted();

    const nodeMap = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // Map all database rows to node objects containing a children array
    allCategories.forEach((cat) => {
      nodeMap.set(cat.id, {
        ...cat,
        children: [],
      });
    });

    // Link nodes to parents or register as root nodes
    allCategories.forEach((cat) => {
      const node = nodeMap.get(cat.id)!;
      if (!cat.parent_id) {
        roots.push(node);
      } else {
        const parentNode = nodeMap.get(cat.parent_id);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // If parent is not active/deleted, treat as a root node to prevent dropping orphaned subtrees
          roots.push(node);
        }
      }
    });

    return roots;
  }

  /**
   * Get single category details by ID.
   */
  async getCategoryById(id: string): Promise<DBCategory> {
    const category = await this.categoryRepository.findById(id, true);
    if (!category) {
      const error: any = new Error('Category not found');
      error.status = 404;
      throw error;
    }
    return category;
  }

  /**
   * Update category properties, checks circular loops, recomputes levels and rotates slugs.
   */
  async updateCategory(id: string, data: UpdateCategoryInput): Promise<DBCategory> {
    const category = await this.categoryRepository.findById(id, false);
    if (!category) {
      const error: any = new Error('Category not found or is deleted');
      error.status = 404;
      throw error;
    }

    let slug: string | undefined;
    let level: number | undefined;

    // 1. If name is modified, generate a new unique slug
    if (data.name && data.name !== category.name) {
      const baseSlug = slugify(data.name);
      let activeSlug = baseSlug;
      let counter = 1;
      while (await this.categoryRepository.findBySlug(activeSlug, id)) {
        activeSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = activeSlug;
    }

    // 2. If parent_id is modified, prevent circular loops and compute level
    if (data.parent_id !== undefined && data.parent_id !== category.parent_id) {
      if (data.parent_id === id) {
        const error: any = new Error('A category cannot be its own parent');
        error.status = 400;
        throw error;
      }

      if (data.parent_id === null) {
        level = 1;
      } else {
        // Prevent Circular references: parent cannot be one of target's children
        let currentParentId: string | null | undefined = data.parent_id;
        while (currentParentId) {
          if (currentParentId === id) {
            const error: any = new Error('Circular parent reference detected. Parent cannot be a subcategory.');
            error.status = 400;
            throw error;
          }
          const parent = await this.categoryRepository.findById(currentParentId);
          currentParentId = parent ? parent.parent_id : null;
        }

        const parentCategory = await this.categoryRepository.findById(data.parent_id);
        if (!parentCategory) {
          const error: any = new Error('Parent category not found');
          error.status = 400;
          throw error;
        }
        level = parentCategory.level + 1;
      }
    }

    // 3. Update category
    const updated = await this.categoryRepository.updateCategory(id, data, slug, level);
    if (!updated) {
      const error: any = new Error('Failed to update category');
      error.status = 500;
      throw error;
    }

    // If level of this category was updated, update all descendants level recursively
    if (level !== undefined && level !== category.level) {
      await this.syncDescendantLevels(id, level);
    }

    return updated;
  }

  /**
   * Soft delete category and recursively soft delete all its child categories.
   */
  async softDeleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id, false);
    if (!category) {
      const error: any = new Error('Category not found or already deleted');
      error.status = 404;
      throw error;
    }

    await this.categoryRepository.recursiveSoftDelete(id);
  }

  /**
   * Restore a soft-deleted category and all parent categories along its path to the root.
   */
  async restoreCategory(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id, true);
    if (!category) {
      const error: any = new Error('Category not found');
      error.status = 404;
      throw error;
    }

    if (!category.deleted_at) {
      const error: any = new Error('Category is not soft-deleted');
      error.status = 400;
      throw error;
    }

    await this.categoryRepository.recursiveRestoreParents(id);
  }

  /**
   * Set category features active status.
   */
  async setFeaturedStatus(id: string, isFeatured: boolean): Promise<void> {
    const category = await this.categoryRepository.findById(id, false);
    if (!category) {
      const error: any = new Error('Category not found or is deleted');
      error.status = 404;
      throw error;
    }

    await this.categoryRepository.setFeatured(id, isFeatured);
  }

  /**
   * Recursive helper to recompute level hierarchy of child subtrees when a parent moves level.
   */
  private async syncDescendantLevels(parentId: string, parentLevel: number): Promise<void> {
    // 1. Fetch direct active children
    const listRes = await this.categoryRepository.findCategories({
      page: 1,
      limit: 100,
      parent_id: parentId,
      showDeleted: 'false',
      sortBy: 'sort_order',
      sortOrder: 'asc',
    });

    const children = listRes.categories;
    const nextLevel = parentLevel + 1;

    for (const child of children) {
      // Update child level in database
      await this.categoryRepository.updateCategory(child.id, {}, undefined, nextLevel);
      // Recursively sync its children
      await this.syncDescendantLevels(child.id, nextLevel);
    }
  }
}
