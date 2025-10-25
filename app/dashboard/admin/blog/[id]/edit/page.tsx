'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import BlogPostEditorDialog from '@/components/dashboard/admin/BlogPostEditorDialog';

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

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(true);

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

  const handlePostSaved = (savedPost: BlogPost) => {
    toast.success('Blog post updated successfully!');
    router.push('/dashboard/admin/blog');
  };

  const handleCloseEditor = () => {
    router.push('/dashboard/admin/blog');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Post Editor</CardTitle>
          <CardDescription>
            Edit your blog post details and content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Update your blog post with new content, images, or metadata.
          </p>
        </CardContent>
      </Card>

      {post && (
        <BlogPostEditorDialog
          post={post}
          isOpen={isEditorOpen}
          onOpenChange={(open) => {
            setIsEditorOpen(open);
            if (!open) {
              handleCloseEditor();
            }
          }}
          onSave={handlePostSaved}
        />
      )}
    </div>
  );
}