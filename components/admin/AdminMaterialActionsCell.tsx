'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface AdminMaterialActionsCellProps {
    materialId: string;
    materialName: string;
}

export default function AdminMaterialActionsCell({ materialId, materialName }: AdminMaterialActionsCellProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDelete = async () => {
        startTransition(async () => {
            try {
                const response = await fetch(`/api/admin/materials/${materialId}`, {
                    method: 'DELETE',
                });

                if (response.status === 404) {
                    throw new Error("Material not found. It might have already been deleted.");
                }
                if (response.status === 409) { // Conflict - material in use
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || "Cannot delete: Material is currently in use.");
                }
                if (!response.ok && response.status !== 204) { // 204 is success with no content
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to delete material (${response.status})`);
                }

                toast.success(`Material "${materialName}" deleted successfully.`);
                setIsDeleteDialogOpen(false); // Close dialog on success
                router.refresh(); // Refresh the list

            } catch (error) {
                console.error("Error deleting material:", error);
                toast.error(error instanceof Error ? error.message : 'Could not delete material.');
                // Keep dialog open on error
            }
        });
    };

    return (
        <div className="flex space-x-2">
            {/* Edit Button */}
            <Button asChild variant="outline" size="sm" aria-label={`Edit material ${materialName}`}>
                <Link href={`/admin/materials/${materialId}/edit`}>
                    <Pencil className="w-4 h-4" />
                </Link>
            </Button>

            {/* Delete Button with Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        aria-label={`Delete material ${materialName}`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete the material
                            <span className="font-medium"> "{materialName}"</span>?
                            This action cannot be undone. Ensure the material is not currently in use by listings or recycling centers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isPending ? 'Deleting...' : 'Delete Material'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 