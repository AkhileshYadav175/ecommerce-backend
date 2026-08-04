import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validation.js';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { env } from '../../config/env.js';
import jwt from 'jsonwebtoken';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user account.
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const user = await this.authService.register(parseResult.data);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. A verification link has been logged.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Log in user, return Access Token, and set HttpOnly Refresh Token cookie.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      const { user, accessToken, refreshToken } = await this.authService.login(parseResult.data);

      // Set Refresh Token as HTTP-Only Cookie
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Log out user from the current session.
   */
  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const refreshToken = req.cookies.refresh_token;
      let sessionId = '';
      if (refreshToken) {
        try {
          const decoded = jwt.decode(refreshToken) as any;
          if (decoded && decoded.sessionId) {
            sessionId = decoded.sessionId;
          }
        } catch (err) {
          // Ignore token decode error on logout
        }
      }

      const remainingTtlSec = Math.max(0, req.user.exp - Math.floor(Date.now() / 1000));
      await this.authService.logout(req.user.id, sessionId, req.user.jti, remainingTtlSec);

      // Clear the refresh token cookie
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Log out from all devices (deletes all active sessions).
   */
  logoutAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      await this.authService.logoutAll(req.user.id);

      // Clear cookie
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh Access and Refresh Tokens using Rotation.
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const oldRefreshToken = req.cookies.refresh_token;
      if (!oldRefreshToken) {
        res.status(401).json({
          success: false,
          error: { message: 'Refresh token is missing' },
        });
        return;
      }

      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(oldRefreshToken);

      // Rotate Refresh Token Cookie
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken,
        },
      });
    } catch (error) {
      // Clear cookie on verification error to prevent loops
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      next(error);
    }
  };

  /**
   * Retrieve authenticated user profile.
   */
  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const userProfile = await this.authService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: userProfile,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Initiate forgot password process.
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = forgotPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      await this.authService.forgotPassword(parseResult.data.email);

      res.status(200).json({
        success: true,
        message: 'If the email matches an account, a password reset link has been generated and logged.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset user password using token.
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = resetPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      await this.authService.resetPassword(parseResult.data.token, parseResult.data.password);

      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change user password.
   */
  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const parseResult = changePasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      await this.authService.changePassword(req.user.id, parseResult.data);

      // Force user to log in again with new password, clear active refresh cookie
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please log in again.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resend verification email token.
   */
  resendVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      await this.authService.sendVerificationEmail(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Email verification token has been resent and logged.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify user's email address.
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = verifyEmailSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: parseResult.error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
        return;
      }

      await this.authService.verifyEmail(parseResult.data.token);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully!',
      });
    } catch (error) {
      next(error);
    }
  };
}
