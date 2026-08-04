import { db } from '../../config/database.js';
import { User, RegisterInput } from './auth.types.js';

export class AuthRepository {
  /**
   * Find a user by email.
   * 
   * @param email - User email address
   * @returns User object or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as User;
  }

  /**
   * Find a user by ID.
   * 
   * @param id - User UUID
   * @returns User object or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as User;
  }

  /**
   * Create a new user record.
   * 
   * @param data - User data to insert
   * @param passwordHash - Hashed password
   * @returns The created User object (without password field in returning)
   */
  async createUser(data: RegisterInput, passwordHash: string): Promise<User> {
    const query = `
      INSERT INTO users (full_name, email, password, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, phone, role, is_verified, is_active, created_at, updated_at
    `;
    const params = [data.full_name, data.email, passwordHash, data.phone || null];
    const result = await db.query(query, params);
    
    return result.rows[0] as User;
  }

  /**
   * Update user's password hash.
   * 
   * @param userId - User UUID
   * @param passwordHash - New hashed password
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const query = 'UPDATE users SET password = $1 WHERE id = $2';
    await db.query(query, [passwordHash, userId]);
  }

  /**
   * Set user's email verification status to true.
   * 
   * @param userId - User UUID
   */
  async verifyUserEmail(userId: string): Promise<void> {
    const query = 'UPDATE users SET is_verified = TRUE WHERE id = $1';
    await db.query(query, [userId]);
  }
}
