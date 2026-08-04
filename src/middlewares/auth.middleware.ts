import { Request, Response, NextFunction } from 'express';
import { verifyToken, AccessTokenPayload } from '../utils/jwt.js';
import { redis } from '../config/redis.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    jti: string;
    exp: number;
  };
}

/**
 * Middleware to authenticate requests using JWT Access Tokens.
 * Checks the Authorization header (Bearer token) and verifies it against the Redis blacklist.
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // Fallback: Check cookies
    else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication token is missing' },
      });
      return;
    }

    // 2. Verify token signature and expiration
    let decoded: AccessTokenPayload;
    try {
      decoded = verifyToken<AccessTokenPayload>(token);
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: { message: err.name === 'TokenExpiredError' ? 'Access token has expired' : 'Invalid access token' },
      });
      return;
    }

    // 3. Check if token's JTI is blacklisted in Redis
    const isBlacklisted = await redis.get(`auth:blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        error: { message: 'Session has been invalidated. Please log in again.' },
      });
      return;
    }

    // 4. Attach decoded token user payload to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict route access to specific roles.
 * Must be used AFTER the authenticate middleware.
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. User context not found.' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden. You do not have permission to access this resource.' },
      });
      return;
    }

    next();
  };
};
