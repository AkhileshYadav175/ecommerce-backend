import { AuthRepository } from './auth.repository.js';
import { RegisterInput, LoginInput, ChangePasswordInput, User } from './auth.types.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken, verifyToken, RefreshTokenPayload } from '../../utils/jwt.js';
import { redis } from '../../config/redis.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../config/logger.js';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  /**
   * Register a new user.
   */
  async register(input: RegisterInput): Promise<User> {
    const existingUser = await this.authRepository.findByEmail(input.email);
    if (existingUser) {
      const error: any = new Error('Email is already registered');
      error.status = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.authRepository.createUser(input, hashedPassword);

    // Send verification link in background (simulated via logs)
    this.sendVerificationEmail(user.id).catch((err) => {
      logger.error(err, `Failed to generate email verification token for user ${user.id}`);
    });

    return user;
  }

  /**
   * Log in user and establish a Redis session.
   */
  async login(input: LoginInput): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findByEmail(input.email);
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    if (!user.is_active) {
      const error: any = new Error('Your account has been deactivated. Please contact support.');
      error.status = 403;
      throw error;
    }

    // Verify password
    const isPasswordMatch = await comparePassword(input.password, user.password || '');
    if (!isPasswordMatch) {
      const error: any = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    // Establish session
    const sessionId = uuidv4();
    const { token: accessToken } = signAccessToken(user.id, user.email, user.role);
    const { token: refreshToken, jti: refreshJti } = signRefreshToken(user.id, sessionId);

    // Store active session in Redis: key namespace -> auth:session:<userId>:<sessionId>
    // Value is the active refresh token's jti (used for rotation/reuse check)
    // Expiration: 7 days
    const sessionKey = `auth:session:${user.id}:${sessionId}`;
    await redis.set(sessionKey, refreshJti, 'EX', 7 * 24 * 60 * 60);

    // Remove password field before returning user
    const { password, ...safeUser } = user;

    return {
      user: safeUser as User,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Log out a specific session by deleting it from Redis and blacklisting the access token.
   */
  async logout(userId: string, sessionId: string, accessTokenJti: string, remainingTtlSec: number): Promise<void> {
    // Delete refresh session from Redis
    const sessionKey = `auth:session:${userId}:${sessionId}`;
    await redis.del(sessionKey);

    // Blacklist access token if it still has time remaining
    if (remainingTtlSec > 0) {
      await redis.set(`auth:blacklist:${accessTokenJti}`, '1', 'EX', remainingTtlSec);
    }
  }

  /**
   * Log out all active sessions of a user (Logout All Devices).
   */
  async logoutAll(userId: string): Promise<void> {
    const pattern = `auth:session:${userId}:*`;
    let cursor = '0';
    
    // Find and delete all session keys using SCAN for safety/performance
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  /**
   * Refresh credentials using Refresh Token Rotation.
   */
  async refreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: RefreshTokenPayload;
    try {
      decoded = verifyToken<RefreshTokenPayload>(oldRefreshToken);
    } catch (err: any) {
      const error: any = new Error('Invalid or expired refresh token');
      error.status = 401;
      throw error;
    }

    const { userId, sessionId, jti: incomingJti } = decoded;
    const sessionKey = `auth:session:${userId}:${sessionId}`;

    // Get the active jti stored in Redis for this session
    const activeJti = await redis.get(sessionKey);

    // If the session does not exist at all, the user has logged out
    if (!activeJti) {
      const error: any = new Error('Session expired or logged out');
      error.status = 401;
      throw error;
    }

    // Token Reuse / Replay Attack detection
    if (activeJti !== incomingJti) {
      // Revoke the session immediately (potential theft of refresh token)
      await redis.del(sessionKey);
      logger.warn(`⚠️ Security Alert: Replay attack detected for userId ${userId} on sessionId ${sessionId}`);
      const error: any = new Error('Security breach detected. All sessions revoked.');
      error.status = 401;
      throw error;
    }

    // Fetch user details to sign new access token
    const user = await this.authRepository.findById(userId);
    if (!user || !user.is_active) {
      await redis.del(sessionKey);
      const error: any = new Error('User account is invalid or deactivated');
      error.status = 403;
      throw error;
    }

    // Generate new Access and Refresh tokens
    const { token: newAccessToken } = signAccessToken(user.id, user.email, user.role);
    const { token: newRefreshToken, jti: newRefreshJti } = signRefreshToken(user.id, sessionId);

    // Update active jti in Redis and reset TTL to 7 days
    await redis.set(sessionKey, newRefreshJti, 'EX', 7 * 24 * 60 * 60);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Initiate forgot password flow by generating a secure verification token.
   */
  async forgotPassword(email: string): Promise<string> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      const error: any = new Error('No account found with this email address');
      error.status = 404;
      throw error;
    }

    const resetToken = uuidv4();
    const redisKey = `auth:reset-password:${resetToken}`;
    // Token valid for 1 hour
    await redis.set(redisKey, user.id, 'EX', 1 * 60 * 60);

    // Simulate sending email by logging the reset link
    const resetLink = `http://localhost:5000/auth/reset-password?token=${resetToken}`;
    logger.info(`📧 [EMAIL SIMULATION] Password Reset Link for ${email}: ${resetLink}`);

    return resetToken;
  }

  /**
   * Reset user password using a valid reset token.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const redisKey = `auth:reset-password:${token}`;
    const userId = await redis.get(redisKey);

    if (!userId) {
      const error: any = new Error('Invalid or expired reset token');
      error.status = 400;
      throw error;
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await this.authRepository.updatePassword(userId, hashedPassword);

    // Revoke all sessions (Logout all devices) for security
    await this.logoutAll(userId);

    // Delete reset token from Redis
    await redis.del(redisKey);
  }

  /**
   * Authenticated user password update.
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Verify old password
    const isPasswordMatch = await comparePassword(input.old_password, user.password || '');
    if (!isPasswordMatch) {
      const error: any = new Error('Incorrect old password');
      error.status = 401;
      throw error;
    }

    // Hash and save new password
    const hashedPassword = await hashPassword(input.new_password);
    await this.authRepository.updatePassword(userId, hashedPassword);

    // Revoke all sessions for security
    await this.logoutAll(userId);
  }

  /**
   * Generate an email verification token.
   */
  async sendVerificationEmail(userId: string): Promise<string> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.status = 404;
      throw error;
    }

    if (user.is_verified) {
      const error: any = new Error('Email is already verified');
      error.status = 400;
      throw error;
    }

    const verificationToken = uuidv4();
    const redisKey = `auth:verify-email:${verificationToken}`;
    // Token valid for 24 hours
    await redis.set(redisKey, userId, 'EX', 24 * 60 * 60);

    const verificationLink = `http://localhost:5000/auth/verify-email?token=${verificationToken}`;
    logger.info(`📧 [EMAIL SIMULATION] Email Verification Link for ${user.email}: ${verificationLink}`);

    return verificationToken;
  }

  /**
   * Verify email using a valid token.
   */
  async verifyEmail(token: string): Promise<void> {
    const redisKey = `auth:verify-email:${token}`;
    const userId = await redis.get(redisKey);

    if (!userId) {
      const error: any = new Error('Invalid or expired email verification token');
      error.status = 400;
      throw error;
    }

    await this.authRepository.verifyUserEmail(userId);
    await redis.del(redisKey);
  }

  /**
   * Get user profile details by ID.
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.status = 404;
      throw error;
    }
    
    const { password, ...safeUser } = user;
    return safeUser as User;
  }
}
