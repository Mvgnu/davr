import { randomBytes, createHmac } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * CSRF Protection Implementation
 *
 * Uses double-submit cookie pattern with HMAC signing
 * - Token generated and stored in HTTP-only cookie
 * - Same token must be sent in request header
 * - Tokens are signed with secret key to prevent tampering
 */

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'development-csrf-secret-change-in-production';
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('base64url');
}

/**
 * Sign a token with HMAC to prevent tampering
 */
function signToken(token: string): string {
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  return hmac.digest('base64url');
}

/**
 * Verify a signed token
 */
function verifyToken(token: string, signature: string): boolean {
  const expectedSignature = signToken(token);

  // Use timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Generate a new CSRF token and store it in a cookie
 * Call this from Server Components or API routes
 */
export async function generateCsrfToken(): Promise<string> {
  const token = generateToken();
  const signature = signToken(token);
  const signedToken = `${token}.${signature}`;

  // Set HTTP-only cookie to prevent XSS attacks
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Validate CSRF token from request
 * Call this from API routes before processing state-changing requests
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  try {
    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!headerToken) {
      console.warn('[CSRF] No token in request header');
      return false;
    }

    // Get signed token from cookie
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    if (!cookieToken) {
      console.warn('[CSRF] No token in cookie');
      return false;
    }

    // Split signed token
    const [token, signature] = cookieToken.split('.');

    if (!token || !signature) {
      console.warn('[CSRF] Invalid token format in cookie');
      return false;
    }

    // Verify signature
    if (!verifyToken(token, signature)) {
      console.warn('[CSRF] Token signature verification failed');
      return false;
    }

    // Verify header token matches cookie token
    if (token !== headerToken) {
      console.warn('[CSRF] Header token does not match cookie token');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CSRF] Validation error:', error);
    return false;
  }
}

/**
 * Get CSRF token for client-side use
 * Returns only the token part (not the signature) for including in requests
 */
export async function getCsrfToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const signedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!signedToken) {
      return null;
    }

    const [token] = signedToken.split('.');
    return token || null;
  } catch (error) {
    console.error('[CSRF] Error getting token:', error);
    return null;
  }
}

/**
 * API route helper to enforce CSRF protection
 */
export async function requireCsrfToken(
  request: NextRequest
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    return {
      success: false,
      error: 'CSRF token validation failed',
      status: 403,
    };
  }

  return { success: true };
}

/**
 * Exempt safe HTTP methods from CSRF protection
 * Only state-changing methods (POST, PUT, PATCH, DELETE) require CSRF tokens
 */
export function requiresCsrfProtection(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}

/**
 * Middleware helper to validate CSRF for state-changing requests
 */
export async function csrfMiddleware(request: NextRequest): Promise<Response | null> {
  // Skip CSRF check for safe methods
  if (!requiresCsrfProtection(request.method)) {
    return null;
  }

  const validation = await requireCsrfToken(request);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: 'CSRF_TOKEN_INVALID',
        message: 'CSRF-Token-Validierung fehlgeschlagen. Bitte laden Sie die Seite neu.',
      }),
      {
        status: validation.status,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null;
}
