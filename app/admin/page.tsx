import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, CheckCircle, Building2, Package, AlertCircle } from 'lucide-react';

// Type for the statistics data
type AdminStats = {
  totalUsers: number;
  activeListings: number;
  totalListings: number;
  totalRecyclingCenters: number;
  totalMaterials: number;
};

// Fetch function to get statistics from the admin API
async function getStats(): Promise<{ data?: AdminStats; error?: string }> {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/stats`;
  try {
    // Server-side fetch automatically includes necessary cookies
    const response = await fetch(apiUrl, { cache: 'no-store' }); 

    if (response.status === 403) {
        return { error: 'Forbidden: You do not have permission to view stats.' };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
    }
    const data: AdminStats = await response.json();
    return { data };

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred while fetching stats' };
  }
}

// We assume the layout already handles admin check, 
// but we can grab the session here again for display purposes if needed.

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);
    // We don't strictly need to re-check for admin here because the layout should handle it,
    // but it's good practice if this page component could hypothetically be rendered outside the layout.
    // If re-checking: if (!session?.user?.isAdmin) { return <p>Access Denied</p>; }

    const userName = session?.user?.name ?? session?.user?.email ?? 'Admin';

    // Fetch the stats
    const statsResult = await getStats();
    const stats = statsResult.data;
    const statsError = statsResult.error;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Admin Dashboard</h1>
            <p className="mb-6 text-lg">Welcome, {userName}!</p>

            {/* Display error if stats fetching failed */} 
            {statsError && (
                <div className="mb-6 flex items-center p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <p>Could not load dashboard statistics: {statsError}</p>
                </div>
            )}

            {/* Grid for Stat Cards */} 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Users Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers ?? 'N/A'}</div>
                        {/* <p className="text-xs text-muted-foreground">+X% from last month</p> // Optional: Add comparison later */}
                    </CardContent>
                </Card>

                {/* Active Listings Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeListings ?? 'N/A'}</div>
                    </CardContent>
                </Card>
                
                {/* Total Listings Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalListings ?? 'N/A'}</div>
                    </CardContent>
                </Card>

                {/* Total Recycling Centers Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recycling Centers</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalRecyclingCenters ?? 'N/A'}</div>
                    </CardContent>
                </Card>

                {/* Total Materials Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Materials</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalMaterials ?? 'N/A'}</div>
                    </CardContent>
                </Card>

                {/* Add more cards here if needed */}
            </div>

            {/* Original welcome message area - can be kept or removed */}
            {/* 
            <div className="mt-6 p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-3">Overview</h2>
                <p className="text-gray-600">
                    This is the main dashboard for the admin panel. 
                    Use the navigation on the left to manage different parts of the application.
                </p>
            </div>
            */}
        </div>
    );
} 