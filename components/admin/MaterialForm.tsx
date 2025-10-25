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
  image_url: z.string().url().optional().nullable(),
  recyclability_percentage: z.number().min(0).max(100).nullable().optional(),
  recycling_difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).nullable().optional(),
  category_icon: z.string().max(50, 'Category icon must be 50 characters or less').optional(),
  environmental_impact: z.record(z.unknown()).nullable().optional(), // { co2_saved_per_kg, energy_saved_percentage, water_saved_liters }
  preparation_tips: z.array(z.record(z.string())).nullable().optional(), // Array of tip objects: [{ title, description, icon }]
  acceptance_rate: z.number().min(0).max(100).nullable().optional(),
  average_price_per_unit: z.number().nullable().optional(),
  price_unit: z.string().max(20, 'Price unit must be 20 characters or less').optional(),
  fun_fact: z.string().max(200, 'Fun fact must be 200 characters or less').optional(),
  annual_recycling_volume: z.number().nullable().optional(),
  parent_id: z.string().cuid().optional().nullable(),
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
      image_url: initialData?.image_url || null,
      recyclability_percentage: initialData?.recyclability_percentage || null,
      recycling_difficulty: initialData?.recycling_difficulty || null,
      category_icon: initialData?.category_icon || '',
      environmental_impact: initialData?.environmental_impact || null,
      preparation_tips: initialData?.preparation_tips || null,
      acceptance_rate: initialData?.acceptance_rate || null,
      average_price_per_unit: initialData?.average_price_per_unit || null,
      price_unit: initialData?.price_unit || '',
      fun_fact: initialData?.fun_fact || '',
      annual_recycling_volume: initialData?.annual_recycling_volume || null,
    },
  });

  // Sync uploadCompleteUrl with form state if it changes externally
  const watchedImageUrl = form.watch('image_url');
  useEffect(() => {
      setUploadCompleteUrl(watchedImageUrl ?? null);
  }, [watchedImageUrl]);

  // Fetch all available materials for parent selection
  const [parentMaterials, setParentMaterials] = React.useState<Array<{id: string, name: string}>>([]);
  const [loadingParents, setLoadingParents] = React.useState(true);
  
  React.useEffect(() => {
    const fetchParentMaterials = async () => {
      try {
        const response = await fetch('/api/materials?limit=100');
        if (response.ok) {
          const materials = await response.json();
          // Filter out the current material if editing to prevent circular references
          const availableParents = materials.filter((mat: any) => mat.id !== initialData?.id);
          setParentMaterials(availableParents);
        } else {
          console.error('Failed to fetch parent materials');
        }
      } catch (error) {
        console.error('Error fetching parent materials:', error);
      } finally {
        setLoadingParents(false);
      }
    };
    
    fetchParentMaterials();
  }, [initialData?.id]);

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

        {/* Recyclability Percentage Field */}
        <FormField
          control={form.control}
          name="recyclability_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recyclability Percentage</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  placeholder="e.g., 95" 
                  {...field} 
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={isSubmitting || isUploading} 
                />
              </FormControl>
              <FormMessage />
              <FormDescription>Percentage of material that can be recycled (0-100)</FormDescription>
            </FormItem>
          )}
        />

        {/* Recycling Difficulty Field */}
        <FormField
          control={form.control}
          name="recycling_difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recycling Difficulty</FormLabel>
              <FormControl>
                <select
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting || isUploading}
                >
                  <option value="">Select difficulty</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Icon Field */}
        <FormField
          control={form.control}
          name="category_icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Icon</FormLabel>
              <FormControl>
                <Input placeholder="e.g., metal, paper, plastic" {...field} disabled={isSubmitting || isUploading} />
              </FormControl>
              <FormMessage />
              <FormDescription>Icon identifier for categorization (e.g., metal, paper, plastic)</FormDescription>
            </FormItem>
          )}
        />

        {/* Fun Fact Field */}
        <FormField
          control={form.control}
          name="fun_fact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fun Fact</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Interesting fact about this material..."
                  className="resize-y"
                  {...field}
                  value={field.value ?? ''}
                  disabled={isSubmitting || isUploading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Acceptance Rate Field */}
        <FormField
          control={form.control}
          name="acceptance_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acceptance Rate</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  placeholder="e.g., 75" 
                  {...field} 
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={isSubmitting || isUploading} 
                />
              </FormControl>
              <FormMessage />
              <FormDescription>Percentage of centers that accept this material</FormDescription>
            </FormItem>
          )}
        />

        {/* Average Price per Unit Field */}
        <FormField
          control={form.control}
          name="average_price_per_unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Average Price per Unit</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g., 0.50" 
                  {...field} 
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={isSubmitting || isUploading} 
                />
              </FormControl>
              <FormMessage />
              <FormDescription>Average price paid per unit (e.g., per kg)</FormDescription>
            </FormItem>
          )}
        />

        {/* Price Unit Field */}
        <FormField
          control={form.control}
          name="price_unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price Unit</FormLabel>
              <FormControl>
                <Input placeholder="e.g., kg, tonne, unit" {...field} disabled={isSubmitting || isUploading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Annual Recycling Volume Field */}
        <FormField
          control={form.control}
          name="annual_recycling_volume"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Annual Recycling Volume</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g., 1000.5" 
                  {...field} 
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={isSubmitting || isUploading} 
                />
              </FormControl>
              <FormMessage />
              <FormDescription>Global or national recycling volume in tonnes per year</FormDescription>
            </FormItem>
          )}
        />

        {/* Parent Material Selection */}
        <FormField
          control={form.control}
          name="parent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Material</FormLabel>
              {loadingParents ? (
                <div className="text-sm text-muted-foreground">Loading parent materials...</div>
              ) : (
                <FormControl>
                  <select
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting || isUploading}
                  >
                    <option value="">No parent (top-level material)</option>
                    {parentMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
              )}
              <FormMessage />
              <FormDescription>Select a parent material to create a hierarchical relationship</FormDescription>
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