'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import BlogPostEditorDialog from '@/components/dashboard/admin/BlogPostEditorDialog';

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  author_name?: string | null;
  category?: string | null;
  published_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  status: 'draft' | 'published';
  featured: boolean;
  image_url?: string | null;
}

export default function CreateBlogPostPage() {
  const router = useRouter();
  const [isEditorOpen, setIsEditorOpen] = useState(true);

  const handlePostSaved = (savedPost: BlogPost) => {
    router.push('/dashboard/admin/blog');
  };

  const handleCloseEditor = () => {
    router.push('/dashboard/admin/blog');
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Create New Blog Post</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Post Editor</CardTitle>
          <CardDescription>
            Create a new blog post with rich content, images, and formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Use the editor below to create your new blog post. You can format text with HTML tags, 
            upload images, and set publishing options.
          </p>
        </CardContent>
      </Card>

      <BlogPostEditorDialog
        post={null}
        isOpen={isEditorOpen}
        onOpenChange={(open) => {
          setIsEditorOpen(open);
          if (!open) {
            handleCloseEditor();
          }
        }}
        onSave={handlePostSaved}
      />
    </div>
  );
}