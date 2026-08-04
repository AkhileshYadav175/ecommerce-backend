import { z } from 'zod';

const preprocessBool = (val: unknown) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
};

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Category name must be at least 2 characters long' })
    .max(100, { message: 'Category name cannot exceed 100 characters' }),
  description: z.string().optional().or(z.null()),
  image: z.string().optional().or(z.null()),
  parent_id: z.string().uuid({ message: 'Parent ID must be a valid UUID' }).optional().or(z.null()),
  sort_order: z.number().int().default(0),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  meta_title: z.string().max(100).optional().or(z.null()),
  meta_description: z.string().max(255).optional().or(z.null()),
  meta_keywords: z.string().max(255).optional().or(z.null()),
});

export const getCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  parent_id: z
    .string()
    .trim()
    .optional()
    .transform((val) => {
      if (val === 'null') return 'null';
      return val;
    }),
  is_featured: z.preprocess(preprocessBool, z.boolean().optional()),
  is_active: z.preprocess(preprocessBool, z.boolean().optional()),
  showDeleted: z.enum(['true', 'false', 'only']).default('false'),
  sortBy: z.enum(['created_at', 'updated_at', 'name', 'sort_order']).default('sort_order'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('asc').transform(val => val.toLowerCase() as 'asc' | 'desc'),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Category name must be at least 2 characters' })
    .max(100, { message: 'Category name cannot exceed 100 characters' })
    .optional(),
  description: z.string().optional().or(z.null()),
  image: z.string().optional().or(z.null()),
  parent_id: z.string().uuid({ message: 'Parent ID must be a valid UUID' }).optional().or(z.null()),
  sort_order: z.number().int().optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  meta_title: z.string().max(100).optional().or(z.null()),
  meta_description: z.string().max(255).optional().or(z.null()),
  meta_keywords: z.string().max(255).optional().or(z.null()),
}).strict();
