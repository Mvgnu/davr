'use client'; // Layouts often interact with hooks, marking as client component

import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LayoutDashboard, Users, ShoppingBag, Building2, Package } from 'lucide-react'; // Icons

// Extend session type to include our custom isAdmin flag
// You might need to adjust this based on how your session is structured
// See `lib/auth/options.ts` or wherever the session callback is defined
interface AdminSession {
    user?: {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        isAdmin?: boolean | null; // Ensure this matches session data
    } | null;
    expires: string;
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession() as { data: AdminSession | null, status: string };

    // Handle Loading State
    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading admin session...</p>
                {/* Add a spinner here if desired */}
            </div>
        );
    }

    // Handle Unauthenticated or Not Admin
    if (status === 'unauthenticated' || !session?.user?.isAdmin) {
        // Redirect non-admins away
        // You could redirect to a specific 'unauthorized' page or home
        console.log("Redirecting: Unauthenticated or not admin.", { status, isAdmin: session?.user?.isAdmin });
        redirect('/'); // Redirect to homepage
        // Note: redirect() must be called outside of JSX return
        // return null; // Or render null if redirect handles it
    }

    // Render layout for authenticated admins
    return (
        <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-gray-800 text-gray-100 p-4 fixed h-full">
                <div className="mb-8">
                    <Link href="/admin" className="flex items-center space-x-2 text-xl font-semibold">
                         <ShieldCheck className="w-6 h-6 text-indigo-400" />
                         <span>Admin Panel</span>
                    </Link>
                </div>
                <nav className="space-y-2">
                    <Link href="/admin" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-700">
                         <LayoutDashboard className="w-5 h-5" />
                         <span>Dashboard</span>
                    </Link>
                    <Link href="/admin/users" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-700">
                         <Users className="w-5 h-5" />
                         <span>Users</span>
                    </Link>
                    <Link href="/admin/listings" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-700">
                         <ShoppingBag className="w-5 h-5" />
                         <span>Listings</span>
                    </Link>
                    <Link href="/admin/recycling-centers" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-700">
                         <Building2 className="w-5 h-5" />
                         <span>Centers</span>
                    </Link>
                    <Link href="/admin/materials" className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-700">
                         <Package className="w-5 h-5" />
                         <span>Materials</span>
                    </Link>
                    {/* Add more admin links here as needed */}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-8 ml-64 bg-gray-100">
                {children}
            </main>
        </div>
    );
} 