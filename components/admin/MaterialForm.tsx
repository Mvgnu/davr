'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, XCircle, CheckCircle2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Progress } from "@/components/ui/progress";

// --- Image Upload Constants ---
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Zod schema for form validation
const materialFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  category: z.string().min(1, 'Category is required').max(50, 'Category must be 50 characters or less'),
  image_url: z.string().url().optional().nullable(),
  // Add parentMaterialId later if needed (might require fetching materials for a dropdown)
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface MaterialFormProps {
  initialData?: Partial<MaterialFormValues> & { id?: string }; // Optional initial data for editing
  isEditing: boolean;
}

export default function MaterialForm({ initialData, isEditing }: MaterialFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // --- Image Upload State ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCompleteUrl, setUploadCompleteUrl] = useState<string | null>(initialData?.image_url ?? null);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      image_url: initialData?.image_url || null,
    },
  });

  // Sync uploadCompleteUrl with form state if it changes externally
  const watchedImageUrl = form.watch('image_url');
  useEffect(() => {
      setUploadCompleteUrl(watchedImageUrl ?? null);
  }, [watchedImageUrl]);

  // --- Image Upload Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageFile(null);
    setUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
    if (!file) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError(`Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File too large. Max size: ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setImageFile(file);
    handleImageUpload(file);
  };

  const handleImageUpload = async (fileToUpload: File) => {
    if (!fileToUpload) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    try {
      const presignResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileToUpload.name, contentType: fileToUpload.type }),
      });
      if (!presignResponse.ok) {
        const errorData = await presignResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get upload URL');
      }
      const { presignedUrl, imageUrl: finalImageUrl } = await presignResponse.json();
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', fileToUpload.type);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadCompleteUrl(finalImageUrl);
          form.setValue('image_url', finalImageUrl, { shouldValidate: true, shouldDirty: true });
          toast.success('Image uploaded successfully.');
          setImageFile(null);
        } else {
          const errorMsg = `Upload failed: ${xhr.statusText || xhr.status}`;
          console.error("Upload error:", xhr);
          setUploadError(errorMsg);
          toast.error(`Upload Error: ${errorMsg}`);
          setImageFile(null);
        }
        setIsUploading(false);
      };
      xhr.onerror = () => {
        const errorMsg = 'Network error during upload.';
        console.error("Upload error:", xhr);
        setUploadError(errorMsg);
        toast.error(`Upload Error: ${errorMsg}`);
        setIsUploading(false);
        setImageFile(null);
      };
      xhr.send(fileToUpload);
    } catch (uploadErrorObj) {
      const message = uploadErrorObj instanceof Error ? uploadErrorObj.message : 'Image upload failed';
      console.error("Upload preparation/request error:", uploadErrorObj);
      setUploadError(message);
      toast.error(`Upload Error: ${message}`);
      setIsUploading(false);
      setImageFile(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadError(null);
    setUploadCompleteUrl(null);
    form.setValue('image_url', null, { shouldValidate: true, shouldDirty: true });
    toast.success('Image Removed. Save changes to confirm.');
  };

  const onSubmit = async (values: MaterialFormValues) => {
    setIsSubmitting(true);
    const apiUrl = isEditing
      ? `/api/admin/materials/${initialData?.id}`
      : '/api/admin/materials';
    const method = isEditing ? 'PATCH' : 'POST';

    // Include the final image URL from state
    const payload = { ...values, image_url: uploadCompleteUrl };

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} material`);
      }

      toast.success(`Material ${isEditing ? 'updated' : 'created'} successfully!`);
      router.push('/admin/materials'); // Redirect back to the list
      router.refresh(); // Refresh server components

    } catch (error) {
      console.error("Error submitting material form:", error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow border">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Aluminum Cans" {...field} disabled={isSubmitting || isUploading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Field */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <FormControl>
                {/* Consider using a Select component if categories become predefined */}
                <Input placeholder="e.g., Metal" {...field} disabled={isSubmitting || isUploading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a brief description of the material..."
                  className="resize-y"
                  {...field}
                  value={field.value ?? ''} // Handle null value for optional field
                  disabled={isSubmitting || isUploading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Image Upload Section --- */}
        <div className="space-y-2">
            <Label htmlFor="image-upload-input">Image (Optional)</Label>
            <div className={`relative group w-full p-4 border-2 border-dashed rounded-md min-h-[150px] flex flex-col items-center justify-center 
                ${uploadError ? 'border-destructive' : 'border-border'} 
                ${isUploading ? 'bg-muted/50' : 'bg-muted/30'}`}
            >
                {isUploading ? (
                    <div className="text-center p-4">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2 mx-auto" />
                        <p className="text-sm text-muted-foreground mb-2">Uploading...</p>
                        <Progress value={uploadProgress} className="w-3/4 mx-auto h-2" />
                    </div>
                ) : uploadError ? (
                    <div className="text-center p-4 text-destructive">
                        <XCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Upload Error</p>
                        <p className="text-xs px-2">{uploadError}</p>
                        <p className="text-xs mt-2 underline cursor-pointer" onClick={() => document.getElementById('image-upload-input')?.click()}>Try Again</p>
                    </div>
                ) : uploadCompleteUrl ? (
                    <div className="relative group w-full flex justify-center">
                        <Image 
                            src={uploadCompleteUrl} 
                            alt="Material image" 
                            width={200} 
                            height={150} 
                            className="rounded-md object-contain max-h-[150px]"
                        />
                        <Button 
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            onClick={handleRemoveImage}
                            disabled={isSubmitting}
                            aria-label="Remove image"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground cursor-pointer" onClick={() => document.getElementById('image-upload-input')?.click()}>
                        <UploadCloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        Click or drag to upload image.
                    </div>
                )}
            </div>
            <Input 
                id="image-upload-input"
                type="file"
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileChange}
                className="sr-only" // Hide default input
                disabled={isUploading || isSubmitting}
            />
            {uploadError && !isUploading && <p className="text-sm text-destructive mt-1">{uploadError}</p>}
            <FormDescription>Max file size {MAX_FILE_SIZE_MB}MB. Allowed types: JPG, PNG, WEBP, GIF.</FormDescription>
            {/* Hidden input for react-hook-form to track URL if needed */}
            <input type="hidden" {...form.register('image_url')} />
            {form.formState.errors.image_url && <p className="text-sm text-destructive mt-1">{form.formState.errors.image_url.message}</p>}
        </div>
        {/* --- End Image Upload Section --- */}

        {/* Submit Button */}
        <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting || isUploading} className="mr-2">
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Material')}
            </Button>
        </div>
      </form>
    </Form>
  );
} 