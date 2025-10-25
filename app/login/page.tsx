import React, { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm'; // Assuming @ alias
import Link from 'next/link';

// Wrap LoginForm usage in Suspense as it uses useSearchParams
function LoginPageContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-md">
        <h2 className="mb-2 text-3xl font-extrabold text-center text-gray-900">Anmelden</h2>
        <p className="mb-6 text-center text-gray-600">Willkommen zurück. Bitte melden Sie sich an.</p>
        <LoginForm />
        <div className="mt-6 text-sm text-center">
          <p className="text-gray-600">
            Kein Konto?
            <Link href="/register" className="ml-1 font-medium text-indigo-600 hover:text-indigo-500">
              Jetzt registrieren
            </Link>
          </p>
          {/* Add link to password reset if implemented */}
        </div>
      </div>
    </div>
  );
}

// Need to wrap the component using useSearchParams in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
} 