import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm'; // Assuming @ alias for src/components
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-3xl font-extrabold text-center text-gray-900">
          Create your account
        </h2>
        <RegisterForm />
        <div className="mt-6 text-sm text-center">
          <p className="text-gray-600">
            Already have an account?
            <Link href="/login" className="ml-1 font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 