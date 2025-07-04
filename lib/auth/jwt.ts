import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

// JWT secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// Type for the user info stored in tokens
export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  isPremium: boolean;
}

/**
 * Sign a JWT token with user information
 */
export function signToken(user: Partial<IUser> & { _id: any }): string {
  // Create a payload with necessary user info
  const payload: JwtPayload = {
    userId: user._id.toString(),
    username: user.username || '',
    email: user.email || '',
    role: user.role || 'user',
    isPremium: user.isPremium || false
  };

  // Sign and return the token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);
}

/**
 * Verify a JWT token and return payload if valid
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get JWT token from authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract the token
  return authHeader.split(' ')[1];
}

export default {
  signToken,
  verifyToken,
  extractTokenFromHeader
}; 