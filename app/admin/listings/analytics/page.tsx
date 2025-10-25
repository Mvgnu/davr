import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, CheckCircle, AlertTriangle, Ban, Clock } from 'lucide-react';
import { ListingStatus } from '@prisma/client';

// Type for the listing statistics data
type ListingStats = {
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  rejectedListings: number;
  flaggedListings: number;
  totalSellers: number;
  listingsByType: { type: string; count: number }[];
  listingsByStatus: { status: string; count: number }[];
};

// Fetch function to get listing statistics from the admin API
async function getListingStats(): Promise<{ data?: ListingStats; error?: string }> {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/listings/stats`;
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
    const data: ListingStats = await response.json();
    return { data };

  } catch (error) {
    console.error("Error fetching admin listing stats:", error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred while fetching stats' };
  }
}

export default async function AdminListingsAnalyticsPage() {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name ?? session?.user?.email ?? 'Admin';

    // Fetch the stats
    const statsResult = await getListingStats();
    const stats = statsResult.data;
    const statsError = statsResult.error;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Listings Analytics</h1>
            <p className="mb-8 text-lg">Welcome, {userName}! Here's an overview of marketplace listings.</p>

            {/* Display error if stats fetching failed */} 
            {statsError && (
                <div className="mb-6 flex items-center p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <p>Could not load dashboard statistics: {statsError}</p>
                </div>
            )}

            {/* Grid for Stat Cards */} 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                
                {/* Pending Listings Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending for Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.pendingListings ?? 'N/A'}</div>
                    </CardContent>
                </Card>

                {/* Rejected Listings Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected Listings</CardTitle>
                        <Ban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.rejectedListings ?? 'N/A'}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats Grid */} 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Total Sellers Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Sellers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalSellers ?? 'N/A'}</div>
                    </CardContent>
                </Card>

                {/* Flagged Listings Card */} 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Flagged Listings</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.flaggedListings ?? 'N/A'}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts/Visualizations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Listings by Type */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Listings by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.listingsByType && stats.listingsByType.length > 0 ? (
                            <div className="space-y-2">
                                {stats.listingsByType.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span>{item.type}</span>
                                        <span className="font-medium">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No data available</p>
                        )}
                    </CardContent>
                </Card>

                {/* Listings by Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Listings by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.listingsByStatus && stats.listingsByStatus.length > 0 ? (
                            <div className="space-y-2">
                                {stats.listingsByStatus.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span>{item.status}</span>
                                        <span className="font-medium">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No data available</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}