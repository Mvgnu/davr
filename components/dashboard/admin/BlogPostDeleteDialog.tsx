'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BlogPostDeleteDialogProps {
  post: { id: string; title: string } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (postId: string) => void;
}

export default function BlogPostDeleteDialog({ post, isOpen, onOpenChange, onDelete }: BlogPostDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!post) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dashboard/admin/blog/${post.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Blog post deleted successfully');
        onDelete(post.id);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to delete blog post');
      }
    } catch (error) {
      toast.error('Failed to delete blog post');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Blog Post
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the blog post <span className="font-semibold">"{post?.title}"</span>? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}