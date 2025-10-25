'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Image, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  author_name: string;
  category?: string | null;
  published_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  status: 'draft' | 'published';
  featured: boolean;
  image_url?: string | null;
}

interface BlogPostEditorDialogProps {
  post: BlogPost | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedPost: BlogPost) => void;
}

export default function BlogPostEditorDialog({ post, isOpen, onOpenChange, onSave }: BlogPostEditorDialogProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [category, setCategory] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form fields when post changes or dialog opens
  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || '');
      setContent(post.content);
      setAuthorName(post.author_name);
      setCategory(post.category || '');
      setIsPublished(post.status === 'published');
      setIsFeatured(post.featured);
      setImageUrl(post.image_url || '');
    } else if (isOpen) {
      // Reset for new post
      setTitle('');
      setSlug('');
      setExcerpt('');
      setContent('');
      setAuthorName('');
      setCategory('');
      setIsPublished(false);
      setIsFeatured(false);
      setImageUrl('');
    }
  }, [post, isOpen]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Update slug when title changes
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!post?.id) { // Only auto-generate slug for new posts
      setSlug(generateSlug(value));
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to server
      const response = await fetch('/api/dashboard/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageUrl(result.data.url);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !slug.trim() || !authorName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const postData = {
        id: post?.id,
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        author_name: authorName.trim(),
        category: category.trim() || null,
        published: isPublished,
        featured: isFeatured,
        image_url: imageUrl || null,
      };

      const url = post?.id 
        ? `/api/dashboard/admin/blog/${post.id}`
        : '/api/dashboard/admin/blog';
      
      const method = post?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(post?.id ? 'Post updated successfully!' : 'Post created successfully!');
        onSave({
          ...postData,
          id: result.data?.id || post?.id,
          status: isPublished ? 'published' : 'draft',
          created_at: result.data?.created_at || post?.created_at,
          updated_at: result.data?.updated_at || new Date(),
          published_at: isPublished ? (result.data?.published_at || new Date()) : null,
        } as BlogPost);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to save post');
      }
    } catch (error) {
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      // Reset form when closing
      setTitle(post?.title || '');
      setSlug(post?.slug || '');
      setExcerpt(post?.excerpt || '');
      setContent(post?.content || '');
      setAuthorName(post?.author_name || '');
      setCategory(post?.category || '');
      setIsPublished(post?.status === 'published' || false);
      setIsFeatured(post?.featured || false);
      setImageUrl(post?.image_url || '');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {post?.id ? 'Edit Blog Post' : 'Create New Blog Post'}
          </DialogTitle>
          <DialogDescription>
            {post?.id 
              ? 'Update your blog post details and content.' 
              : 'Create a new blog post with rich content and media.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-title-slug"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content here. HTML tags are supported."
                  rows={20}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  HTML tags are supported. Use &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="author">Author Name *</Label>
                <Input
                  id="author"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Author name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Recycling Tips">Recycling Tips</SelectItem>
                    <SelectItem value="Industry News">Industry News</SelectItem>
                    <SelectItem value="Environmental Impact">Environmental Impact</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Policy Updates">Policy Updates</SelectItem>
                    <SelectItem value="Community Stories">Community Stories</SelectItem>
                    <SelectItem value="Events">Events</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Featured Image</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                  {imageUrl ? (
                    <div className="relative">
                      <img 
                        src={imageUrl} 
                        alt="Featured" 
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setImageUrl('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No image uploaded
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={triggerFileInput}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="published">Publish Post</Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublished ? 'Post will be live' : 'Post will be saved as draft'}
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="featured">Feature Post</Label>
                  <p className="text-sm text-muted-foreground">
                    {isFeatured ? 'Post will be featured' : 'Post will not be featured'}
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {post?.id ? 'Update Post' : 'Create Post'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}