import React, { Suspense } from 'react';
import RegisterForm from '@/components/auth/RegisterForm'; // Assuming @ alias for src/components
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Laden…</div>}>
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">
        <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-md">
          <h2 className="mb-2 text-3xl font-extrabold text-center text-gray-900">Konto erstellen</h2>
          <p className="mb-6 text-center text-gray-600">Schnell registrieren und loslegen.</p>
          <RegisterForm />
          <div className="mt-6 text-sm text-center">
            <p className="text-gray-600">
              Bereits ein Konto?
              <Link href="/login" className="ml-1 font-medium text-indigo-600 hover:text-indigo-500">
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}