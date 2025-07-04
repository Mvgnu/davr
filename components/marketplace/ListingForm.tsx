'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast"
import { ListingType, Material, ListingStatus } from '@prisma/client';
import { Loader2, Upload, X, UploadCloud, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Progress } from "@/components/ui/progress";

// --- Image Upload Constants ---
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Zod schema now includes optional status for editing
const listingFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.coerce.number().positive().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  material_id: z.string().cuid('Invalid material ID').optional().nullable(),
  type: z.nativeEnum(ListingType),
  status: z.nativeEnum(ListingStatus).optional(), // Allow status update during edit
  // Removed imageFile from schema, handle file via state
  // imageFile: z.instanceof(File).optional().nullable()
  //    .refine(file => !file || file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
  //    .refine(
  //       file => !file || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
  //       ".jpg, .jpeg, .png, .webp and .gif files are accepted."
  //    ),
   // Keep track of the existing image URL for updates
   imageUrl: z.string().url().optional().nullable(),
});

// Infer type, making fields optional for the form data itself initially
type ListingFormData = z.infer<typeof listingFormSchema>;

// Define props for editing
interface ListingFormProps {
  listingId?: string; // Provided when editing
  initialData?: Partial<ListingFormData>; // Use Partial for flexibility
}

export default function ListingForm({ listingId, initialData }: ListingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  // --- Refactored Image State ---
  const [imageFile, setImageFile] = useState<File | null>(null); // Current file selection
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCompleteUrl, setUploadCompleteUrl] = useState<string | null>(initialData?.imageUrl ?? null); // Track the final URL

  const isEditing = !!listingId;

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isDirty } } = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    // Use initialData to set default values when editing
    defaultValues: initialData ? {
        ...initialData,
        quantity: initialData.quantity ?? undefined,
        material_id: initialData.material_id ?? undefined,
        imageUrl: initialData.imageUrl ?? undefined, // Keep existing image URL
    } : {
        type: ListingType.SELL, // Default for new listings
        status: ListingStatus.ACTIVE, // Default status for new
    }
  });

  // Watch relevant form fields
  const existingImageUrl = watch('imageUrl'); // Watch existing URL from form

  // Sync uploadCompleteUrl with form state if it changes externally
  useEffect(() => {
    setUploadCompleteUrl(existingImageUrl ?? null);
  }, [existingImageUrl]);

  useEffect(() => {
    // Reset form with initial data if it changes
    if (initialData) {
        reset({
            ...initialData,
            quantity: initialData.quantity ?? undefined,
            material_id: initialData.material_id ?? undefined,
            imageUrl: initialData.imageUrl ?? undefined,
        });
        // Also reset the image URL state based on initial data
        setUploadCompleteUrl(initialData.imageUrl ?? null);
    }
  }, [initialData, reset]);

  useEffect(() => {
    // Fetch materials
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/materials'); 
        if (!response.ok) throw new Error('Failed to fetch materials');
        const data = await response.json();
        setMaterials(data);
      } catch (error) {
        console.error("Failed to load materials:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load materials for selection." });
      }
    };
    fetchMaterials();
  }, [toast]);

  // --- Image Upload Handlers (Adapted from CreateListingForm/BlogPostForm) ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset previous upload attempt state
    setImageFile(null);
    setUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
        
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError(`Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File too large. Max size: ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setImageFile(file);
    // Automatically start upload when a valid file is selected
    handleImageUpload(file);
  };

  const handleImageUpload = async (fileToUpload: File) => {
    if (!fileToUpload) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
        // 1. Get pre-signed URL from the consolidated API endpoint
        const presignResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                filename: fileToUpload.name, 
                contentType: fileToUpload.type 
            }),
        });

        if (!presignResponse.ok) {
            const errorData = await presignResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to get upload URL');
        }
        const { presignedUrl, imageUrl: finalImageUrl } = await presignResponse.json();

        // 2. Upload file directly to S3 using the pre-signed URL
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
                // Success!
                setUploadCompleteUrl(finalImageUrl); // Update local state for display
                setValue('imageUrl', finalImageUrl, { shouldValidate: true, shouldDirty: true }); // Update form state
                toast({ title: 'Success', description: 'Image uploaded successfully.' });
                setImageFile(null); // Clear selected file
            } else {
                // Upload to S3 failed
                const errorMsg = `Upload failed: ${xhr.statusText || xhr.status}`;
                console.error("Upload error:", xhr);
                setUploadError(errorMsg);
                toast({ title: 'Upload Error', description: errorMsg, variant: 'destructive' });
                setImageFile(null);
            }
            setIsUploading(false);
        };

        xhr.onerror = () => {
            // Network error during S3 upload
            const errorMsg = 'Network error during upload.';
            console.error("Upload error:", xhr);
            setUploadError(errorMsg);
            toast({ title: 'Upload Error', description: errorMsg, variant: 'destructive' });
            setIsUploading(false);
            setImageFile(null);
        };

        xhr.send(fileToUpload);

    } catch (uploadErrorObj) {
        // Error during pre-sign URL fetch or other setup
        const message = uploadErrorObj instanceof Error ? uploadErrorObj.message : 'Image upload failed';
        console.error("Upload preparation/request error:", uploadErrorObj);
        setUploadError(message);
        toast({ title: 'Upload Error', description: message, variant: 'destructive' });
        setIsUploading(false);
        setImageFile(null);
    }
  };

  // Handle removing the currently set image
  const handleRemoveImage = () => {
      setImageFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(null);
      setUploadCompleteUrl(null); // Clear the final URL
      setValue('imageUrl', null, { shouldValidate: true, shouldDirty: true }); // Update form state
      toast({ title: 'Image Removed', description: 'Image will be removed upon saving.'});
  };

  const onSubmit: SubmitHandler<ListingFormData> = async (formData) => {
    setIsLoading(true);
    // Reset upload progress visual just in case
    setUploadProgress(0); 

    try {
        // Use the URL tracked in state (updated by successful upload or removal)
        const finalImageUrl = uploadCompleteUrl;

        // Prepare listing data for the API
        const listingDataPayload = {
            title: formData.title,
            description: formData.description,
            quantity: formData.quantity,
            unit: formData.unit,
            location: formData.location,
            material_id: formData.material_id,
            type: formData.type,
            status: formData.status,
            imageUrl: finalImageUrl, // Send the final URL
        };

        // Determine API endpoint and method
        const apiUrl = isEditing ? `/api/marketplace/listings/${listingId}` : '/api/marketplace/listings';
        const apiMethod = isEditing ? 'PATCH' : 'POST';

        // Send listing data to the API
        const response = await fetch(apiUrl, {
            method: apiMethod,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listingDataPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} listing`);
        }

        toast({ title: "Success", description: `Listing ${isEditing ? 'updated' : 'created'} successfully!` });
        
        // Redirect appropriately
        if (isEditing) {
            router.push(`/marketplace/listings/${listingId}`); // Go to listing detail page after edit
        } else {
             router.push('/marketplace'); // Go to marketplace list after create
        }
        router.refresh();

    } catch (error: any) {
      console.error(`Listing ${isEditing ? 'update' : 'creation'} failed:`, error);
      toast({ variant: "destructive", title: "Error", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Marketplace Listing' : 'Create New Marketplace Listing'}</CardTitle>
        <CardDescription>{isEditing ? 'Update the details for your listing.' : 'Fill in the details for your new listing.'} </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title')} disabled={isLoading || isUploading}/>
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          {/* Type (Buy/Sell) */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isUploading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type (Buy/Sell)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ListingType.SELL}>Sell Material</SelectItem>
                    <SelectItem value={ListingType.BUY}>Buy Material</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Material */}
           <Controller
            name="material_id"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isLoading || isUploading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material if applicable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">* None *</SelectItem>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <FormDescription>Specify the primary material involved.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
             <FormField
              control={control}
              name="quantity"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Quantity (Optional)</FormLabel>
                      <FormControl>
                          <Input type="number" step="any" placeholder="e.g., 100" {...field} value={field.value ?? ''} disabled={isLoading || isUploading}/>
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
            />
             <FormField
              control={control}
              name="unit"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Unit (Optional)</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., kg, tons, items" {...field} value={field.value ?? ''} disabled={isLoading || isUploading}/>
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
            />
          </div>

          {/* Description */}
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea rows={5} placeholder="Provide details about the material, condition, pickup/delivery, etc." {...field} value={field.value ?? ''} disabled={isLoading || isUploading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
           <FormField
              control={control}
              name="location"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., Berlin, Germany" {...field} value={field.value ?? ''} disabled={isLoading || isUploading}/>
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
            />

          {/* Status (Only shown when editing) */}
          {isEditing && (
             <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isUploading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Set listing status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ListingStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={ListingStatus.INACTIVE}>Inactive</SelectItem>
                      <SelectItem value={ListingStatus.PENDING}>Pending</SelectItem>
                      {/* Add other valid statuses from schema if needed, e.g., REJECTED, FLAGGED */}
                      {/* <SelectItem value={ListingStatus.REJECTED}>Rejected</SelectItem> */}
                      {/* <SelectItem value={ListingStatus.FLAGGED}>Flagged</SelectItem> */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                  <Progress value={uploadProgress ?? 0} className="w-3/4 mx-auto h-2" />
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
                    alt="Listing image" 
                    width={300} 
                    height={200} 
                    className="rounded-md object-contain max-h-[200px]"
                  />
                  <Button 
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                    onClick={handleRemoveImage}
                    disabled={isLoading}
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
              disabled={isUploading || isLoading}
            />
            {uploadError && !isUploading && <p className="text-sm text-destructive mt-1">{uploadError}</p>}
            <FormDescription>Max file size {MAX_FILE_SIZE_MB}MB. Allowed types: JPG, PNG, WEBP, GIF.</FormDescription>
            {/* Hidden input for react-hook-form to track URL if needed */}
            <input type="hidden" {...register('imageUrl')} />
             {errors.imageUrl && <p className="text-sm text-destructive mt-1">{errors.imageUrl.message}</p>}
          </div>
          {/* --- End Image Upload Section --- */}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Update Listing' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Helper components from shadcn/ui (already imported but for clarity)
// Need to import FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; 