import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  jti: string;
  exp: number;
  iat: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  jti: string;
  exp?: number;
  iat?: number;
}

/**
 * Signs a short-lived access token.
 */
export const signAccessToken = (userId: string, email: string, role: string): { token: string; jti: string } => {
  const jti = uuidv4();
  const payload = {
    userId,
    email,
    role,
  };
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m',
    jwtid: jti,
    subject: userId,
  });
  return { token, jti };
};

/**
 * Signs a long-lived refresh token containing a sessionId and a unique token id (jti) for rotation detection.
 */
export const signRefreshToken = (userId: string, sessionId: string): { token: string; jti: string } => {
  const jti = uuidv4();
  const payload = {
    userId,
    sessionId,
  };
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
    jwtid: jti,
    subject: userId,
  });
  return { token, jti };
};

/**
 * Verifies any JWT signed with JWT_SECRET and returns the decoded payload.
 * Throws an error if verification fails or token is expired.
 */
export const verifyToken = <T extends object>(token: string): T => {
  return jwt.verify(token, env.JWT_SECRET) as T;
};
