'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash, 
  Loader2,
  CheckCircle,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface BlogActionsDropdownProps {
  postId: string;
  postTitle: string;
  postSlug: string;
  status: 'published' | 'draft' | string;
}

export default function BlogActionsDropdown({ 
  postId, 
  postTitle, 
  postSlug,
  status
}: BlogActionsDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Sind Sie sicher, dass Sie den Beitrag "${postTitle}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/admin/blog/posts/${postId}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (response.ok && result.success) {
            toast.success('Blogbeitrag erfolgreich gelöscht.');
            router.refresh();
          } else {
            toast.error(result.error || 'Fehler beim Löschen des Blogbeitrags.');
          }
        } catch (error) {
          console.error('Fehler beim Löschen des Blogbeitrags:', error);
          toast.error('Ein unerwarteter Fehler ist aufgetreten.');
        }
      });
    }
  };

  const handleToggleStatus = (currentStatus: 'published' | 'draft' | string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const actionVerb = newStatus === 'published' ? 'veröffentlichen' : 'zurückziehen';
    const successMessage = `Blogbeitrag erfolgreich ${newStatus === 'published' ? 'veröffentlicht' : 'als Entwurf gespeichert'}.`;
    const errorMessage = `Fehler beim ${actionVerb} des Blogbeitrags.`;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/blog/posts/${postId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast.success(successMessage);
          router.refresh();
        } else {
          toast.error(result.error || errorMessage);
        }
      } catch (error) {
        console.error(`Fehler beim ${actionVerb} des Blogbeitrags:`, error);
        toast.error('Ein unerwarteter Fehler ist aufgetreten.');
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          <span className="sr-only">Menü anzeigen</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={postSlug ? `/blog/${postSlug}` : '#'} target="_blank">
            <Eye className="mr-2 h-4 w-4"/>Ansehen
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/blog/edit/${postId}`}>
            <Edit className="mr-2 h-4 w-4"/>Bearbeiten
          </Link>
        </DropdownMenuItem>
        {status === 'draft' && (
          <DropdownMenuItem onClick={() => handleToggleStatus(status)} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            )}
            Veröffentlichen
          </DropdownMenuItem>
        )}
        {status === 'published' && (
          <DropdownMenuItem onClick={() => handleToggleStatus(status)} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-2 h-4 w-4 text-orange-600" />
            )}
            Zurückziehen (Entwurf)
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-700 focus:bg-red-50"
          onClick={handleDelete}
          disabled={isPending} 
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash className="mr-2 h-4 w-4"/>
          )}
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 