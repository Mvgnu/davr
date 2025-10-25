import { NextResponse } from 'next/server';
import { generateCsrfToken, getCsrfToken } from '@/lib/csrf';

/**
 * GET /api/csrf-token
 *
 * Returns a CSRF token for client-side use
 * If a token already exists in the cookie, returns it
 * Otherwise, generates a new token
 */
export async function GET() {
  try {
    // Check if token already exists
    let token = await getCsrfToken();

    // Generate new token if none exists
    if (!token) {
      token = await generateCsrfToken();
    }

    return NextResponse.json({
      token,
    });
  } catch (error) {
    console.error('[CSRF Token API] Error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Fehler beim Abrufen des CSRF-Tokens',
      },
      { status: 500 }
    );
  }
}
