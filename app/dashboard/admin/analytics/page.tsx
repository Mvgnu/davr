'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/shared/StatsCard';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  Package, 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Filter,
  BarChart3,
  CheckCircle,
  Star,
  Mail,
  Wrench,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsData {
  totals: {
    totalUsers: number;
    totalCenters: number;
    totalMaterials: number;
    totalListings: number;
    activeListings: number;
    pendingVerifications: number;
    verifiedCenters: number;
    totalReviews: number;
    totalMessages: number;
    totalClaims: number;
  };
  growth: {
    newUserCount30Days: number;
    newCenterCount30Days: number;
    newListingsCount30Days: number;
  };
  dailyStats: Array<{ date: Date; count: number }>;
  monthlyStats: Array<{ month: Date; count: number }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ 
    start: null, 
    end: null 
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      let url = '/api/dashboard/admin/analytics';
      
      if (dateRange.start && dateRange.end) {
        const params = new URLSearchParams();
        params.append('startDate', dateRange.start.toISOString());
        params.append('endDate', dateRange.end.toISOString());
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      } else {
        toast.error(result.error || 'Failed to load analytics');
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    // For simplicity, we'll just refetch with the current date range
    fetchAnalytics();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Platform analytics and performance metrics.
          </p>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load analytics data</p>
          <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Platform analytics and performance metrics.
        </p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filter Analytics</CardTitle>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value ? new Date(e.target.value) : null})}
              className="border rounded px-3 py-2 text-sm"
            />
            <span className="mx-2">to</span>
            <input
              type="date"
              value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value ? new Date(e.target.value) : null})}
              className="border rounded px-3 py-2 text-sm"
            />
            <Button onClick={handleDateRangeChange} variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={analytics.totals.totalUsers}
          icon={Users}
          description={`+${analytics.growth.newUserCount30Days} in last 30 days`}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Total Centers"
          value={analytics.totals.totalCenters}
          icon={Building2}
          description={`+${analytics.growth.newCenterCount30Days} in last 30 days`}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Total Materials"
          value={analytics.totals.totalMaterials}
          icon={Package}
          description="In database"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatsCard
          title="Total Listings"
          value={analytics.totals.totalListings}
          icon={ShoppingBag}
          description={`${analytics.totals.activeListings} active`}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Pending Verifications"
          value={analytics.totals.pendingVerifications}
          icon={Activity}
          description="Awaiting review"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatsCard
          title="Verified Centers"
          value={analytics.totals.verifiedCenters}
          icon={CheckCircle}
          description="Approved centers"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Total Reviews"
          value={analytics.totals.totalReviews}
          icon={Star}
          description="All reviews"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Messages"
          value={analytics.totals.totalMessages}
          icon={Mail}
          description="Platform communications"
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
        />
        <StatsCard
          title="Total Claims"
          value={analytics.totals.totalClaims}
          icon={Wrench}
          description="Recycling center claims"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
        />
        <StatsCard
          title="Active Listings"
          value={analytics.totals.activeListings}
          icon={TrendingUp}
          description="Currently active"
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
        />
      </div>

      {/* Placeholder for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Daily user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">User growth chart</p>
                <p className="text-sm text-gray-400">Daily registrations over time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listing Activity</CardTitle>
            <CardDescription>Marketplace listing metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Listing activity chart</p>
                <p className="text-sm text-gray-400">Active vs. inactive listings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}