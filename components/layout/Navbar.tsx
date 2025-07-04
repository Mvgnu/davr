'use client'; // Navbar needs client-side interactivity from AuthStatus

import Link from 'next/link';
import AuthStatus from '@/components/auth/AuthStatus'; // Assuming @ alias

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Title */}
        <div className="text-xl font-bold">
          <Link href="/" className="hover:text-gray-300">
            MyApp
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-4">
          <Link href="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-gray-300">
            Dashboard
          </Link>
          {/* Add other main navigation links here */}
        </div>

        {/* Auth Status - Login/Logout */}
        <div className="flex items-center">
          <AuthStatus />
        </div>

        {/* Mobile Menu Button (Placeholder) */}
        {/* <div className="md:hidden">
          <button>Menu</button>
        </div> */}
      </div>
      {/* Mobile Menu (Placeholder) */}
      {/* <div className="md:hidden">
        Mobile menu content here
      </div> */}
    </nav>
  );
} 