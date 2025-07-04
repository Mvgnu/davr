'use client';

import React, { useState, useTransition } from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ShieldCheck, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import type { ClientAdminUser } from '@/app/admin/users/page';

interface AdminUserRowProps {
  user: ClientAdminUser;
  currentAdminId: string;
}

export default function AdminUserRow({ user, currentAdminId }: AdminUserRowProps) {
  const router = useRouter();
  const [isAdminState, setIsAdminState] = useState(user.role === 'admin');
  const [isPending, startTransition] = useTransition();

  const handleAdminStatusChange = async (newIsAdmin: boolean) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isAdmin: newIsAdmin }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update status (${response.status})`);
        }

        setIsAdminState(newIsAdmin);
        user.role = newIsAdmin ? 'admin' : 'user';
        toast.success(`User ${user.email} admin status updated.`);
        
        router.refresh();

      } catch (error) {
        console.error("Error updating admin status:", error);
        toast.error(error instanceof Error ? error.message : 'Could not update admin status.');
      }
    });
  };

  const isCurrentUser = user.id === currentAdminId;

  return (
    <TableRow key={user.id}>
      <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
      <TableCell>{user.name ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
      <TableCell>{user.email ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
      <TableCell>
        <AlertDialog>
          <AlertDialogTrigger asChild disabled={isCurrentUser || isPending}>
            <Switch
              id={`admin-switch-${user.id}`}
              checked={isAdminState}
              disabled={isCurrentUser || isPending}
              aria-label={`Toggle admin status for ${user.email}`}
              className={isPending ? 'opacity-50 cursor-not-allowed' : ''}
            />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Admin Status Change</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {isAdminState ? 'revoke' : 'grant'} admin privileges for user 
                <span className="font-medium">{user.email ?? user.id}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleAdminStatusChange(!isAdminState)} 
                disabled={isPending}
                className={isAdminState ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {isPending ? 'Processing...' : (isAdminState ? 'Revoke Admin' : 'Grant Admin')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Badge variant={isAdminState ? 'destructive' : 'secondary'} className="ml-2 align-middle">
          {isAdminState ? (
            <><ShieldCheck className="w-3 h-3 mr-1 inline-block"/>Admin</>
          ) : (
            <><UserCheck className="w-3 h-3 mr-1 inline-block"/>User</>
          )}
        </Badge>
      </TableCell>
      <TableCell>
        {user.verified 
            ? <Badge variant="default" className="bg-blue-500 text-white">Verified</Badge>
            : <Badge variant="outline">Unverified</Badge>}
      </TableCell>
      <TableCell>{user.status ?? 'N/A'}</TableCell>
      <TableCell>{user.registeredAt ?? 'N/A'}</TableCell>
      <TableCell>{user.lastLogin ?? 'N/A'}</TableCell>
    </TableRow>
  );
} 