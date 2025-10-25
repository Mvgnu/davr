'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import Link from 'next/link';

interface BlogPostPreviewProps {
  post: {
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
  };
  className?: string;
}

export default function BlogPostPreview({ post, className }: BlogPostPreviewProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
          {post.featured && (
            <Badge variant="default" className="ml-2">
              Featured
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
          {post.category && (
            <Badge variant="secondary">{post.category}</Badge>
          )}
          
          <span>
            {post.published_at 
              ? format(new Date(post.published_at), 'PPP') 
              : format(new Date(post.created_at), 'PPP')}
          </span>
          
          {post.author_name && (
            <span>by {post.author_name}</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {post.image_url && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        
        {post.excerpt && (
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <Badge 
            variant={
              post.status === 'published' ? 'default' : 
              post.status === 'draft' ? 'secondary' : 
              'outline'
            }
          >
            {post.status}
          </Badge>
          
          <Link 
            href={`/blog/${post.slug}`} 
            target="_blank"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Eye className="h-4 w-4" />
            View Post
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}