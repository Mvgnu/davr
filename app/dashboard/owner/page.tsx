'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Building2,
  Star,
  Package,
  Settings,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface Center {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  verification_status: string;
  averageRating: number;
  reviewCount: number;
  _count: {
    offers: number;
    reviews: number;
  };
}

function getVerificationColor(status: string) {
  switch (status) {
    case 'VERIFIED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getVerificationIcon(status: string) {
  switch (status) {
    case 'VERIFIED':
      return CheckCircle;
    case 'PENDING':
      return Clock;
    case 'REJECTED':
      return XCircle;
    default:
      return Clock;
  }
}

export default function OwnerDashboardPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/dashboard/owner/centers');
      const data = await response.json();

      if (data.success) {
        setCenters(data.centers);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load centers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load centers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const totalOffers = centers.reduce((sum, c) => sum + c._count.offers, 0);
  const totalReviews = centers.reduce((sum, c) => sum + c._count.reviews, 0);
  const verifiedCenters = centers.filter(
    (c) => c.verification_status === 'VERIFIED'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Centers</h1>
        <p className="text-gray-600 mt-1">
          Manage your recycling centers and their details
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Centers
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {centers.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {verifiedCenters}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Materials
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalOffers}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Reviews
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalReviews}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {centers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No centers yet"
          description="You don't have any recycling centers yet. Contact support to claim a center or create a new one."
          action={{
            label: 'Contact Support',
            href: '/contact',
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map((center) => {
            const VerificationIcon = getVerificationIcon(
              center.verification_status
            );

            return (
              <Card
                key={center.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge
                      className={getVerificationColor(
                        center.verification_status
                      )}
                    >
                      <VerificationIcon className="h-3 w-3 mr-1" />
                      {center.verification_status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {center.name}
                      </h3>
                      {center.city && (
                        <p className="text-sm text-gray-600 mt-1">
                          📍 {center.city}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">
                          {center.averageRating}
                        </span>
                        <span className="text-gray-500 ml-1">
                          ({center.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Package className="h-4 w-4 mr-1" />
                        {center._count.offers} materials
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/recycling-centers/${center.slug}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/dashboard/owner/centers/${center.id}`}>
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
