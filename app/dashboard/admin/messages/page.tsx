'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Message {
  id: string;
  subject: string;
  content: string;
  senderUserId: string | null;
  senderName: string | null;
  senderEmail: string | null;
  recipientUserId: string | null;
  centerId: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  success: boolean;
  messages: Message[];
  pagination: Pagination;
  error?: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMessages(currentPage);
  }, [currentPage]);

  const fetchMessages = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dashboard/admin/messages?page=${page}&limit=10`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setMessages(result.data?.messages || []);
        setPagination(result.data?.pagination || null);
      } else {
        toast.error(result.error || 'Failed to load messages');
      }
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messages Management</h1>
        <p className="text-gray-600 mt-1">
          View and manage all messages on the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Messages</CardTitle>
          <CardDescription>
            A list of all messages including their read status and participants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-center text-gray-500">No messages found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium max-w-xs truncate">{message.subject}</TableCell>
                        <TableCell>
                          {message.senderName || message.senderEmail || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {message.recipientUserId || message.centerId || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              message.status === 'new' ? 'secondary' : 
                              message.status === 'read' ? 'default' : 
                              'outline'
                            }
                          >
                            {message.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{message.created_at ? format(new Date(message.created_at), 'PP') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Reply
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm text-gray-500">
                    Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}{' '}
                    of {pagination.totalItems} results
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-2 text-sm text-gray-500">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}