'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DOMPurify from 'dompurify';

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
  status: 'draft' | 'published';
  featured: boolean;
  image_url: string | null;
}

export default function AdminBlogPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchBlogPost();
    }
  }, [postId]);

  const fetchBlogPost = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dashboard/admin/blog?page=1&limit=10`);
      const result = await response.json();

      if (result.success) {
        const foundPost = result.data?.posts?.find((p: BlogPost) => p.id === postId);
        if (foundPost) {
          setPost(foundPost);
        } else {
          toast.error('Blog post not found');
          router.push('/dashboard/admin/blog');
        }
      } else {
        toast.error(result.error || 'Failed to load blog post');
        router.push('/dashboard/admin/blog');
      }
    } catch (error) {
      toast.error('Failed to load blog post');
      router.push('/dashboard/admin/blog');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Blog post not found.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/dashboard/admin/blog')}
          >
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Blog Post Detail</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/blog/${post.slug}`)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Public
          </Button>
          <Button 
            variant="default" 
            onClick={() => router.push(`/dashboard/admin/blog/${postId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Post
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-3xl">{post.title}</CardTitle>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm rounded-full ${
                post.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {post.status === 'published' ? 'Published' : 'Draft'}
              </span>
              {post.featured && (
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  Featured
                </span>
              )}
            </div>
          </div>
          
          {post.excerpt && (
            <p className="text-xl text-gray-600 mt-2">{post.excerpt}</p>
          )}
          
          <div className="flex flex-wrap items-center justify-between mt-6 text-sm text-gray-500 gap-4">
            <div>
              By <span className="font-medium">{post.author_name || 'N/A'}</span>
            </div>
            <div>
              {post.published_at 
                ? `Published ${format(new Date(post.published_at), 'PPP', { locale: de })}`
                : `Created ${format(new Date(post.created_at), 'PPP', { locale: de })}`}
            </div>
            <div>
              {post.category || 'Uncategorized'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {post.image_url && (
            <div className="mb-8">
              <img 
                src={post.image_url} 
                alt={post.title} 
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(post.content) 
            }}
          />
          
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Last updated: {format(new Date(post.updated_at), 'PPP', { locale: de })}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/blog/${post.slug}`)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Public
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/admin/blog/${postId}/edit`)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}