import { z } from 'zod';

const preprocessBool = (val: unknown) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
};

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  role: z.enum(['user', 'admin']).optional(),
  is_active: z.preprocess(preprocessBool, z.boolean().optional()),
  is_verified: z.preprocess(preprocessBool, z.boolean().optional()),
  showDeleted: z.enum(['true', 'false', 'only']).default('false'),
  sortBy: z.enum(['created_at', 'updated_at', 'full_name', 'email', 'phone']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc').transform(val => val.toLowerCase() as 'asc' | 'desc'),
});

export const updateUserSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters long' })
    .max(100, { message: 'Full name cannot exceed 100 characters' })
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
    .optional()
    .or(z.literal(''))
    .or(z.null()),
  role: z.enum(['user', 'admin']).optional(),
  is_verified: z.boolean().optional(),
  is_active: z.boolean().optional(),
}).strict();
