'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and manage CSRF token for client-side requests
 *
 * Usage:
 * ```tsx
 * const { token, loading, error } = useCsrfToken();
 *
 * // Use in fetch requests
 * const response = await fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-csrf-token': token || '',
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/csrf-token');

        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        console.error('Error fetching CSRF token:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, []);

  return { token, loading, error };
}

/**
 * Helper function to add CSRF token to fetch headers
 *
 * Usage:
 * ```tsx
 * const response = await fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: withCsrfToken(token, {
 *     'Content-Type': 'application/json',
 *   }),
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function withCsrfToken(
  token: string | null,
  headers: HeadersInit = {}
): HeadersInit {
  const headersObj = headers instanceof Headers
    ? Object.fromEntries(headers.entries())
    : Array.isArray(headers)
    ? Object.fromEntries(headers)
    : headers;

  if (token) {
    return {
      ...headersObj,
      'x-csrf-token': token,
    };
  }

  return headersObj;
}
