'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { PlusCircle, Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import BlogPostEditorDialog from '@/components/dashboard/admin/BlogPostEditorDialog';
import BlogPostDeleteDialog from '@/components/dashboard/admin/BlogPostDeleteDialog';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author_name: string | null;
  category: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  status: string;
  featured: boolean;
  image_url: string | null;
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
  data: {
    posts: BlogPost[];
    pagination: Pagination;
  };
  error?: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState<{ id: string; title: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchBlogPosts(currentPage);
  }, [currentPage]);

  const fetchBlogPosts = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dashboard/admin/blog?page=${page}&limit=10`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setPosts(result.data?.posts || []);
        setPagination(result.data?.pagination || null);
      } else {
        toast.error(result.error || 'Failed to load blog posts');
      }
    } catch (error) {
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handleEditClick = (post: BlogPost) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleDeleteClick = (post: BlogPost) => {
    setDeletingPost({ id: post.id, title: post.title });
    setIsDeleteDialogOpen(true);
  };

  const handlePostSaved = (savedPost: BlogPost) => {
    // Update the posts list with the saved post
    if (editingPost?.id) {
      // Update existing post
      setPosts(posts.map(post => 
        post.id === savedPost.id ? savedPost : post
      ));
    } else {
      // Add new post to the beginning of the list
      setPosts([savedPost, ...posts]);
    }
    fetchBlogPosts(currentPage);
  };

  const handlePostDeleted = (deletedPostId: string) => {
    // Remove the deleted post from the list
    setPosts(posts.filter(post => post.id !== deletedPostId));
    fetchBlogPosts(currentPage);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-1">
            Manage blog posts and content on the platform.
          </p>
        </div>
        <Button onClick={() => { setEditingPost(null); setIsEditorOpen(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>
            A list of all blog posts including their publication status and author.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-center text-gray-500">No blog posts found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                        <TableCell>{post.author_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              post.status === 'published' ? 'default' : 
                              post.status === 'draft' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{post.category || 'N/A'}</TableCell>
                        <TableCell>{post.published_at ? format(new Date(post.published_at), 'PPP') : 'Not published'}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => handleEditClick(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteClick(post)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <BlogPostEditorDialog
        post={editingPost}
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSave={handlePostSaved}
      />

      <BlogPostDeleteDialog
        post={deletingPost}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handlePostDeleted}
      />
    </div>
  );
}