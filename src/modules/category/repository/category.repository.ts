import { db } from '../../../config/database.js';
import { DBCategory, CreateCategoryInput, GetCategoriesQueryInput, UpdateCategoryInput } from '../category.types.js';

export class CategoryRepository {
  /**
   * Create a new category.
   */
  async createCategory(data: CreateCategoryInput, slug: string, level: number): Promise<DBCategory> {
    const query = `
      INSERT INTO categories (
        name, slug, description, image, parent_id, level, 
        sort_order, is_featured, is_active, meta_title, meta_description, meta_keywords
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const params = [
      data.name,
      slug,
      data.description || null,
      data.image || null,
      data.parent_id || null,
      level,
      data.sort_order || 0,
      data.is_featured || false,
      data.is_active || true,
      data.meta_title || null,
      data.meta_description || null,
      data.meta_keywords || null,
    ];
    const result = await db.query(query, params);
    return result.rows[0] as DBCategory;
  }

  /**
   * Find categories with pagination, sorting, filters, and search.
   */
  async findCategories(filters: GetCategoriesQueryInput): Promise<{ categories: DBCategory[]; total: number }> {
    const { page, limit, search, parent_id, is_featured, is_active, showDeleted, sortBy, sortOrder } = filters;
    const offset = (page - 1) * limit;

    const queryParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 1. Soft Delete filter
    if (showDeleted === 'false') {
      queryParts.push(`deleted_at IS NULL`);
    } else if (showDeleted === 'only') {
      queryParts.push(`deleted_at IS NOT NULL`);
    }

    // 2. Search (name or slug)
    if (search) {
      queryParts.push(`(name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    // 3. Parent ID filter
    if (parent_id !== undefined) {
      if (parent_id === 'null') {
        queryParts.push(`parent_id IS NULL`);
      } else {
        queryParts.push(`parent_id = $${paramIndex}`);
        values.push(parent_id);
        paramIndex++;
      }
    }

    // 4. Featured filter
    if (is_featured !== undefined) {
      queryParts.push(`is_featured = $${paramIndex}`);
      values.push(is_featured);
      paramIndex++;
    }

    // 5. Active filter
    if (is_active !== undefined) {
      queryParts.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    const whereClause = queryParts.length > 0 ? `WHERE ${queryParts.join(' AND ')}` : '';

    // Total Count
    const countQuery = `SELECT COUNT(*) as total FROM categories ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Select results
    const selectQuery = `
      SELECT * FROM categories
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const finalValues = [...values, limit, offset];
    const selectResult = await db.query(selectQuery, finalValues);

    return {
      categories: selectResult.rows as DBCategory[],
      total,
    };
  }

  /**
   * Find a category by ID.
   */
  async findById(id: string, includeDeleted = false): Promise<DBCategory | null> {
    const query = `
      SELECT * FROM categories 
      WHERE id = $1 ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as DBCategory;
  }

  /**
   * Find a category by slug.
   */
  async findBySlug(slug: string, excludeId?: string): Promise<DBCategory | null> {
    let query = 'SELECT * FROM categories WHERE slug = $1';
    const params = [slug];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as DBCategory;
  }

  /**
   * Update category properties.
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryInput,
    slug?: string,
    level?: number
  ): Promise<DBCategory | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Map body inputs
    Object.entries(data).forEach(([key, val]) => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(val);
      paramIndex++;
    });

    // Add optional custom slug override
    if (slug !== undefined) {
      fields.push(`slug = $${paramIndex}`);
      values.push(slug);
      paramIndex++;
    }

    // Add optional custom level override
    if (level !== undefined) {
      fields.push(`level = $${paramIndex}`);
      values.push(level);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE categories
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) return null;

    return result.rows[0] as DBCategory;
  }

  /**
   * Set featured status.
   */
  async setFeatured(id: string, isFeatured: boolean): Promise<boolean> {
    const query = `
      UPDATE categories
      SET is_featured = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [isFeatured, id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Recursively soft-delete a category and all its subcategories (children).
   */
  async recursiveSoftDelete(id: string): Promise<number> {
    const query = `
      WITH RECURSIVE category_tree AS (
          SELECT id FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id FROM categories c
          JOIN category_tree ct ON c.parent_id = ct.id
      )
      UPDATE categories 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (SELECT id FROM category_tree) AND deleted_at IS NULL
    `;
    const result = await db.query(query, [id]);
    return result.rowCount ?? 0;
  }

  /**
   * Recursively restore a category and all its parents up to the root.
   */
  async recursiveRestoreParents(id: string): Promise<number> {
    const query = `
      WITH RECURSIVE parent_tree AS (
          SELECT id, parent_id FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id, c.parent_id FROM categories c
          JOIN parent_tree pt ON c.id = pt.parent_id
      )
      UPDATE categories
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (SELECT id FROM parent_tree) AND deleted_at IS NOT NULL
    `;
    const result = await db.query(query, [id]);
    return result.rowCount ?? 0;
  }

  /**
   * Fetch all active and non-deleted categories for tree building.
   */
  async findAllActiveNonDeleted(): Promise<DBCategory[]> {
    const query = `
      SELECT * FROM categories 
      WHERE is_active = TRUE AND deleted_at IS NULL 
      ORDER BY level ASC, sort_order ASC, name ASC
    `;
    const result = await db.query(query);
    return result.rows as DBCategory[];
  }
}
