'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import ClaimReviewDialog from './ClaimReviewDialog';

interface Claim {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  businessRole: string | null;
  message: string;
  status: string;
  documents_json: any;
  created_at: string;
  recyclingCenter: {
    id: string;
    name: string;
    city: string | null;
    address_street: string | null;
    slug: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  reviewed_by: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  admin_response: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
}

interface ClaimsData {
  claims: Claim[];
  counts: Record<string, number>;
}

export default function ClaimsManagement() {
  const [data, setData] = useState<ClaimsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchClaims = async (status: string = 'all', page: string = '1') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/admin/claims?status=${status}&page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch claims');
      const result = await response.json();
      if (result.success && result.data) {
        setData({
          claims: result.data.claims,
          counts: result.data.counts
        });
      } else {
        setData({ claims: [], counts: {} });
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
      setData({ claims: [], counts: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims(activeTab === 'all' ? 'all' : activeTab, '1');
  }, [activeTab]);

  const handleReviewClick = (claim: Claim) => {
    setSelectedClaim(claim);
    setReviewDialogOpen(true);
  };

  const handleReviewComplete = () => {
    setReviewDialogOpen(false);
    setSelectedClaim(null);
    fetchClaims(activeTab === 'all' ? 'all' : activeTab, '1');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'more_info_requested':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><AlertCircle className="w-3 h-3 mr-1" />More Info Requested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const counts = data?.counts || {};
  const pendingCount = counts.pending || 0;
  const approvedCount = counts.approved || 0;
  const rejectedCount = counts.rejected || 0;
  const moreInfoCount = counts.more_info_requested || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Center Ownership Claims</h1>
        <p className="text-muted-foreground mt-1">
          Review and process center ownership claims from users
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">More Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{moreInfoCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="more_info_requested">More Info ({moreInfoCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data?.claims.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <FileText className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No claims found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data?.claims.map((claim) => (
                <Card key={claim.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{claim.name}</h3>
                          {getStatusBadge(claim.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(claim.created_at)}
                          </span>
                          {claim.reviewed_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Reviewed {formatDate(claim.reviewed_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      {claim.status === 'pending' && (
                        <Button onClick={() => handleReviewClick(claim)}>
                          Review Claim
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Recycling Center</p>
                            <Link
                              href={`/recycling-centers/${claim.recyclingCenter.slug}`}
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {claim.recyclingCenter.name}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {claim.recyclingCenter.address_street}, {claim.recyclingCenter.city}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Contact</p>
                            <p className="text-sm">{claim.email}</p>
                            {claim.phone && <p className="text-xs text-muted-foreground">{claim.phone}</p>}
                          </div>
                        </div>

                        {(claim.companyName || claim.businessRole) && (
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Business Details</p>
                              {claim.companyName && <p className="text-sm">{claim.companyName}</p>}
                              {claim.businessRole && <p className="text-xs text-muted-foreground">{claim.businessRole}</p>}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium mb-1">Message</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                            {claim.message}
                          </p>
                        </div>

                        {claim.documents_json && Array.isArray(claim.documents_json) && claim.documents_json.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Documents ({claim.documents_json.length})</p>
                            <div className="space-y-1">
                              {claim.documents_json.map((doc: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <FileText className="w-3 h-3" />
                                  {doc.filename}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {claim.admin_response && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-1">Admin Response</p>
                        <p className="text-sm text-muted-foreground">{claim.admin_response}</p>
                        {claim.rejection_reason && (
                          <>
                            <p className="text-sm font-medium mt-2 mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-600">{claim.rejection_reason}</p>
                          </>
                        )}
                        {claim.reviewed_by && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Reviewed by {claim.reviewed_by.name || claim.reviewed_by.email}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedClaim && (
        <ClaimReviewDialog
          claim={selectedClaim}
          isOpen={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </div>
  );
}
