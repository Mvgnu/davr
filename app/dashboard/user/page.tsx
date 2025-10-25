import { Suspense } from 'react';
import { ShoppingBag, Star, PackageCheck, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/shared/StatsCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { getCurrentUser } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

async function getUserStats(userId: string) {
  const [totalListings, activeListings, totalReviews, averageRating] =
    await Promise.all([
      prisma.marketplaceListing.count({
        where: { seller_id: userId },
      }),
      prisma.marketplaceListing.count({
        where: {
          seller_id: userId,
          status: 'ACTIVE',
        },
      }),
      prisma.review.count({
        where: { userId },
      }),
      prisma.review.aggregate({
        where: { userId },
        _avg: { rating: true },
      }),
    ]);

  return {
    totalListings,
    activeListings,
    inactiveListings: totalListings - activeListings,
    totalReviews,
    averageRating: averageRating._avg.rating
      ? Number(averageRating._avg.rating.toFixed(1))
      : 0,
  };
}

async function getRecentListings(userId: string) {
  return prisma.marketplaceListing.findMany({
    where: { seller_id: userId },
    include: {
      material: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: 5,
  });
}

async function getRecentReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    include: {
      center: {
        select: {
          name: true,
          slug: true,
          city: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: 5,
  });
}

function getListingStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'FLAGGED':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [stats, recentListings, recentReviews] = await Promise.all([
    getUserStats(user.id),
    getRecentListings(user.id),
    getRecentReviews(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your account
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Listings"
          value={stats.totalListings}
          icon={ShoppingBag}
          description="All time"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Active Listings"
          value={stats.activeListings}
          icon={PackageCheck}
          description="Currently live"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Reviews Written"
          value={stats.totalReviews}
          icon={Star}
          description="All time"
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-100"
        />
        <StatsCard
          title="Avg Rating Given"
          value={stats.averageRating}
          icon={TrendingUp}
          description="Out of 5.0"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Listings</CardTitle>
                <CardDescription>Your latest marketplace items</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/user/listings">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentListings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No listings yet.{' '}
                <Link
                  href="/dashboard/user/listings/new"
                  className="text-green-600 hover:underline"
                >
                  Create your first listing
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {recentListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/user/listings/${listing.id}`}
                        className="font-medium text-sm text-gray-900 hover:text-green-600 truncate block"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {listing.material?.name || 'No material'} •{' '}
                        {formatDistanceToNow(new Date(listing.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge
                      className={getListingStatusColor(listing.status)}
                      variant="secondary"
                    >
                      {listing.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Reviews you've written</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/user/reviews">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No reviews yet.{' '}
                <Link
                  href="/recycling-centers"
                  className="text-green-600 hover:underline"
                >
                  Find centers to review
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/recycling-centers/${review.center.slug}`}
                        className="font-medium text-sm text-gray-900 hover:text-green-600 block"
                      >
                        {review.center.name}
                      </Link>
                      <div className="flex items-center mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDistanceToNow(new Date(review.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ready to recycle?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Find recycling centers near you or list materials for sale
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild className="bg-white">
                <Link href="/recycling-centers">Find Centers</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/user/listings/new">Create Listing</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardContent />
    </Suspense>
  );
}
