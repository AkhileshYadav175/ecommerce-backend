import { z } from 'zod';
import { createCategorySchema, getCategoriesQuerySchema, updateCategorySchema } from './validation/category.validation.js';

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type GetCategoriesQueryInput = z.infer<typeof getCategoriesQuerySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface DBCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parent_id?: string | null;
  level: number;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CategoryTreeNode extends Omit<DBCategory, 'password'> {
  children: CategoryTreeNode[];
}

export interface PaginatedCategoriesResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: DBCategory[];
}
