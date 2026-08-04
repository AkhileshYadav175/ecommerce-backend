import { z } from 'zod';
import { getUsersQuerySchema, updateUserSchema } from './validation/user.validation.js';

export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface DBUser {
  id: string;
  full_name: string;
  email: string;
  password?: string;
  phone?: string | null;
  role: 'user' | 'admin';
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface PaginatedUsersResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  users: Omit<DBUser, 'password'>[];
}

export interface UserStatsResult {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  verifiedUsers: number;
  softDeletedUsers: number;
}
