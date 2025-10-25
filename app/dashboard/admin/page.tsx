'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/dashboard/shared/StatsCard';
import { LoadingState } from '@/components/shared/LoadingState';
import {
  Users,
  Building2,
  Package,
  ShoppingBag,
  Shield,
  CheckCircle,
  Star,
  Flag,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface Stats {
  totalUsers: number;
  totalCenters: number;
  totalMaterials: number;
  totalListings: number;
  pendingVerifications: number;
  verifiedCenters: number;
  totalReviews: number;
  pendingClaims: number;
  totalClaims: number;
  roleDistribution: Record<string, number>;
  recentActivity: {
    users: number;
    listings: number;
    centers: number;
    reviews: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error(data.error || 'Failed to load statistics');
      }
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load statistics</p>
        <Button onClick={fetchStats} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Platform overview and management tools
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Registered users"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Recycling Centers"
          value={stats.totalCenters}
          icon={Building2}
          description={`${stats.verifiedCenters} verified`}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Materials"
          value={stats.totalMaterials}
          icon={Package}
          description="In database"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatsCard
          title="Marketplace Listings"
          value={stats.totalListings}
          icon={ShoppingBag}
          description="Total listings"
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={Shield}
          description="Awaiting review"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatsCard
          title="Verified Centers"
          value={stats.verifiedCenters}
          icon={CheckCircle}
          description="Approved centers"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Total Reviews"
          value={stats.totalReviews}
          icon={Star}
          description="All reviews"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/admin/centers">
                <Shield className="h-4 w-4 mr-2" />
                Review Pending Verifications ({stats.pendingVerifications})
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/admin/materials">
                <Package className="h-4 w-4 mr-2" />
                Manage Materials
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database Status</span>
                <span className="text-sm font-medium text-green-600">
                  ● Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="text-sm font-medium text-green-600">
                  ● Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cache Status</span>
                <span className="text-sm font-medium text-green-600">
                  ● Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
