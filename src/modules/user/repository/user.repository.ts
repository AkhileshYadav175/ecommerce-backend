import { db } from '../../../config/database.js';
import { DBUser, GetUsersQueryInput, UpdateUserInput, UserStatsResult } from '../user.types.js';

export class UserRepository {
  /**
   * Fetch a list of users with dynamic searching, sorting, filtering, and pagination.
   */
  async findUsers(filters: GetUsersQueryInput): Promise<{ users: Omit<DBUser, 'password'>[]; total: number }> {
    const { page, limit, search, role, is_active, is_verified, showDeleted, sortBy, sortOrder } = filters;
    const offset = (page - 1) * limit;

    const queryParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 1. Handle Soft Deletion filters
    if (showDeleted === 'false') {
      queryParts.push(`deleted_at IS NULL`);
    } else if (showDeleted === 'only') {
      queryParts.push(`deleted_at IS NOT NULL`);
    }
    // 'true' shows both deleted and non-deleted users, so no deleted_at filter is added

    // 2. Handle Search (full_name, email, phone)
    if (search) {
      queryParts.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    // 3. Handle Filters
    if (role) {
      queryParts.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (is_active !== undefined) {
      queryParts.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (is_verified !== undefined) {
      queryParts.push(`is_verified = $${paramIndex}`);
      values.push(is_verified);
      paramIndex++;
    }

    const whereClause = queryParts.length > 0 ? `WHERE ${queryParts.join(' AND ')}` : '';

    // 4. Get Total Count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // 5. Query results with sorting and pagination
    // sortBy is pre-validated by Zod, and sortOrder is checked, safe from SQL Injection
    const selectQuery = `
      SELECT id, full_name, email, phone, role, is_verified, is_active, created_at, updated_at, deleted_at
      FROM users
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const finalValues = [...values, limit, offset];
    const selectResult = await db.query(selectQuery, finalValues);

    return {
      users: selectResult.rows as Omit<DBUser, 'password'>[],
      total,
    };
  }

  /**
   * Fetch a single user by ID.
   */
  async findById(id: string, includeDeleted = false): Promise<DBUser | null> {
    const query = `
      SELECT * FROM users 
      WHERE id = $1 ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as DBUser;
  }

  /**
   * Update fields of a user.
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<Omit<DBUser, 'password'> | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, val]) => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(val);
      paramIndex++;
    });

    if (fields.length === 0) {
      // Nothing to update
      const user = await this.findById(id);
      if (!user) return null;
      const { password, ...safeUser } = user;
      return safeUser as Omit<DBUser, 'password'>;
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, full_name, email, phone, role, is_verified, is_active, created_at, updated_at, deleted_at
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) return null;

    return result.rows[0] as Omit<DBUser, 'password'>;
  }

  /**
   * Block a user.
   */
  async blockUser(id: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Unblock a user.
   */
  async unblockUser(id: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Soft delete a user.
   */
  async softDeleteUser(id: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Restore a soft-deleted user.
   */
  async restoreUser(id: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NOT NULL
    `;
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get user stats.
   */
  async getStats(): Promise<UserStatsResult> {
    const query = `
      SELECT 
        COUNT(*)::int as total_users,
        COUNT(*) FILTER (WHERE is_active = TRUE AND deleted_at IS NULL)::int as active_users,
        COUNT(*) FILTER (WHERE is_active = FALSE AND deleted_at IS NULL)::int as blocked_users,
        COUNT(*) FILTER (WHERE is_verified = TRUE AND deleted_at IS NULL)::int as verified_users,
        COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int as soft_deleted_users
      FROM users
    `;
    const result = await db.query(query);
    const row = result.rows[0];

    return {
      totalUsers: row.total_users,
      activeUsers: row.active_users,
      blockedUsers: row.blocked_users,
      verifiedUsers: row.verified_users,
      softDeletedUsers: row.soft_deleted_users,
    };
  }
}
