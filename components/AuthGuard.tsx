'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard protects client-side routes from unauthorized access
 * It checks if the user is authenticated and redirects to login if not
 */
export default function AuthGuard({ 
  children, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If auth state is no longer loading and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      // Redirect to login with the current path as a redirect parameter
      if (pathname) {
        const encodedRedirect = encodeURIComponent(pathname);
        router.push(`${redirectTo}?redirect=${encodedRedirect}`);
      } else {
        router.push(redirectTo);
      }
    } else if (!isLoading) {
      // User is authenticated, stop checking
      setIsChecking(false);
    }
  }, [isLoading, isAuthenticated, router, pathname, redirectTo]);

  // Show loading spinner while checking authentication or loading auth state
  if (isChecking || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
} 