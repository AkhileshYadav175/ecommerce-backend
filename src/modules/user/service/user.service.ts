import { UserRepository } from '../repository/user.repository.js';
import { GetUsersQueryInput, UpdateUserInput, DBUser, PaginatedUsersResult, UserStatsResult } from '../user.types.js';
import { redis } from '../../../config/redis.js';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Get filtered, searched, sorted, and paginated list of users.
   */
  async getUsers(query: GetUsersQueryInput): Promise<PaginatedUsersResult> {
    const { users, total } = await this.userRepository.findUsers(query);
    const totalPages = Math.ceil(total / query.limit);

    return {
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      users,
    };
  }

  /**
   * Get user details by ID (including soft deleted).
   */
  async getUserById(id: string): Promise<Omit<DBUser, 'password'>> {
    const user = await this.userRepository.findById(id, true);
    if (!user) {
      const error: any = new Error('User not found');
      error.status = 404;
      throw error;
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update user details (restricted to non-soft-deleted users).
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<Omit<DBUser, 'password'>> {
    // 1. Verify user exists and is not soft-deleted
    const user = await this.userRepository.findById(id, false);
    if (!user) {
      const error: any = new Error('User not found or is deleted');
      error.status = 404;
      throw error;
    }

    // 2. Perform update
    const updatedUser = await this.userRepository.updateUser(id, data);
    if (!updatedUser) {
      const error: any = new Error('Failed to update user');
      error.status = 500;
      throw error;
    }

    // If role, verified, or active fields are updated, revoke active sessions as a security precaution
    if (data.role !== undefined || data.is_active === false || data.is_verified !== undefined) {
      await this.revokeSessions(id);
    }

    return updatedUser;
  }

  /**
   * Block user and revoke all active sessions.
   */
  async blockUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id, false);
    if (!user) {
      const error: any = new Error('User not found or is deleted');
      error.status = 404;
      throw error;
    }

    if (!user.is_active) {
      // Already blocked
      return;
    }

    await this.userRepository.blockUser(id);
    await this.revokeSessions(id);
  }

  /**
   * Unblock user.
   */
  async unblockUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id, false);
    if (!user) {
      const error: any = new Error('User not found or is deleted');
      error.status = 404;
      throw error;
    }

    if (user.is_active) {
      // Already active
      return;
    }

    await this.userRepository.unblockUser(id);
  }

  /**
   * Soft delete user and revoke all active sessions.
   */
  async softDeleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id, false);
    if (!user) {
      const error: any = new Error('User not found or already deleted');
      error.status = 404;
      throw error;
    }

    await this.userRepository.softDeleteUser(id);
    await this.revokeSessions(id);
  }

  /**
   * Restore a soft-deleted user.
   */
  async restoreUser(id: string): Promise<void> {
    // Check if user exists (includeDeleted = true)
    const user = await this.userRepository.findById(id, true);
    if (!user) {
      const error: any = new Error('User not found');
      error.status = 404;
      throw error;
    }

    if (!user.deleted_at) {
      const error: any = new Error('User is not soft-deleted');
      error.status = 400;
      throw error;
    }

    await this.userRepository.restoreUser(id);
  }

  /**
   * Get user management dashboard overview statistics.
   */
  async getStats(): Promise<UserStatsResult> {
    return this.userRepository.getStats();
  }

  /**
   * Helper utility to scan and delete all Redis session keys associated with a user ID.
   */
  private async revokeSessions(userId: string): Promise<void> {
    const pattern = `auth:session:${userId}:*`;
    let cursor = '0';

    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  }
}
