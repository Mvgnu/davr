import { getServerSession } from 'next-auth/next';
import { authOptions } from './options';
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

/**
 * Extended session user type with role information
 */
export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role: UserRole;
  isAdmin: boolean;
}

/**
 * Get the current authenticated user session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return session.user as SessionUser;
}

/**
 * Require authentication - throws 401 if not authenticated
 * Use this in API routes to ensure user is logged in
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}

/**
 * Require specific role(s) - throws 403 if user doesn't have required role
 * Use this in API routes to enforce role-based access control
 *
 * @param allowedRoles - Single role or array of roles that are allowed
 * @returns The authenticated user if they have the required role
 *
 * @example
 * // Require admin role
 * const user = await requireRole('ADMIN');
 *
 * @example
 * // Allow both CENTER_OWNER and ADMIN
 * const user = await requireRole(['CENTER_OWNER', 'ADMIN']);
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[]
): Promise<SessionUser> {
  const user = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

/**
 * Check if user has specific role
 * Returns boolean without throwing errors
 */
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated
 * Returns boolean without throwing errors
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Middleware helper for API routes
 * Wraps your handler with authentication and role checking
 *
 * @example
 * export const GET = withAuth(async (req, user) => {
 *   // user is guaranteed to be authenticated
 *   return NextResponse.json({ data: 'protected data' });
 * });
 *
 * @example
 * export const POST = withAuth(async (req, user) => {
 *   // Only admins can access this endpoint
 *   return NextResponse.json({ data: 'admin only' });
 * }, { roles: ['ADMIN'] });
 */
export function withAuth<T extends any[]>(
  handler: (request: Request, user: SessionUser, ...args: T) => Promise<Response>,
  options?: {
    roles?: UserRole | UserRole[];
  }
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      let user: SessionUser;

      if (options?.roles) {
        user = await requireRole(options.roles);
      } else {
        user = await requireAuth();
      }

      return await handler(request, user, ...args);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'UNAUTHORIZED') {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        if (error.message === 'FORBIDDEN') {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      console.error('[Auth Middleware Error]', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to check if user owns a resource
 * Common pattern for user-owned resources like listings, reviews, etc.
 */
export async function requireOwnership(
  resourceOwnerId: string,
  options?: {
    allowRoles?: UserRole[]; // Additional roles that can bypass ownership check (e.g., ADMIN)
  }
): Promise<SessionUser> {
  const user = await requireAuth();

  // Check if user owns the resource
  if (user.id === resourceOwnerId) {
    return user;
  }

  // Check if user has a role that bypasses ownership
  if (options?.allowRoles && options.allowRoles.includes(user.role)) {
    return user;
  }

  throw new Error('FORBIDDEN');
}

/**
 * Role hierarchy utility
 * Check if a role has permission level >= another role
 */
export function hasPermissionLevel(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    USER: 1,
    CENTER_OWNER: 2,
    ADMIN: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    USER: 'User',
    CENTER_OWNER: 'Center Owner',
    ADMIN: 'Administrator',
  };

  return displayNames[role];
}
