'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, UploadCloud, XCircle, CheckCircle2, Trash2 } from 'lucide-react';
import slugify from 'slugify';
import dynamic from 'next/dynamic';
import "easymde/dist/easymde.min.css";
import Image from 'next/image';
import { Progress } from "@/components/ui/progress";
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage, 
    FormDescription
} from "@/components/ui/form";

// Dynamically import the Markdown editor to avoid SSR issues
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

// --- Image Upload Constants ---
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Zod schema for form validation 
const blogPostFormSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    // Use simplified slug validation that passed linter before
    slug: z.string()
        .max(220, 'Slug cannot exceed 220 characters')
        .optional()
        .nullable(), 
    content: z.string().min(10, 'Content is too short'),
    excerpt: z.string().max(500).optional().nullable(),
    category: z.string().max(50).optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']),
    featured: z.boolean().optional().default(false),
    image_url: z.string().url({ message: "Please enter a valid URL" }).optional().nullable(),
});

type BlogPostFormData = z.infer<typeof blogPostFormSchema>;

// Define props including optional ones for editing
interface BlogPostFormProps {
  initialData?: Partial<BlogPostFormData> & { id?: string }; // Include optional id from initial data 
  postId?: string; // Explicit postId passed from edit page
}

export default function BlogPostForm({ initialData, postId }: BlogPostFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!postId;

    // --- Image Upload State ---
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadCompleteUrl, setUploadCompleteUrl] = useState<string | null>(initialData?.image_url ?? null); // Initialize with existing image URL

    // Define editor options if needed (optional)
    const editorOptions = useMemo(() => {
        return {
            spellChecker: false,
            // Add other SimpleMDE options here
            // See https://github.com/Ionaru/easy-markdown-editor#configuration
            status: false, // Hide status bar for cleaner look
            autosave: {
                 enabled: false, // Disable autosave for controlled component
                 uniqueId: `blogpost_${postId || 'new'}`,
                 delay: 1000,
             },
        };
    }, [postId]);

    // Prepare default values, merging initialData if editing
    const defaultFormValues = useMemo(() => {
        const baseDefaults = {
            title: '',
            slug: '',
            content: '',
            excerpt: '',
            category: '',
            status: 'draft' as 'draft' | 'published' | 'archived',
            featured: false,
            image_url: '',
        };
        if (isEditing && initialData) {
            // Override base defaults with initialData for editing
            const data = {
                ...baseDefaults,
                ...initialData,
                // Ensure nullable fields are handled correctly if needed
                excerpt: initialData.excerpt ?? '',
                category: initialData.category ?? '',
                image_url: initialData.image_url ?? '',
                // Status should already be correct type from getBlogPostData
            };
            // Set the initial upload complete URL as well
            setUploadCompleteUrl(data.image_url);
            return data;
        }
        return baseDefaults;
    }, [isEditing, initialData]);

    const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isDirty } } = useForm<BlogPostFormData>({
        resolver: zodResolver(blogPostFormSchema),
        defaultValues: defaultFormValues
    });

    // Reset form if initialData changes (useful if component is reused without full remount)
    useEffect(() => {
        if (initialData) {
            reset(defaultFormValues);
            // Also reset the image URL state based on initial data
            setUploadCompleteUrl(initialData.image_url ?? null);
        }
    }, [initialData, reset, defaultFormValues]);


    const watchedTitle = watch('title');
    const watchedSlug = watch('slug');
    const watchedImageUrl = watch('image_url'); // Watch the image_url field from react-hook-form

    // Sync uploadCompleteUrl with form state if it changes externally (e.g., remove image)
    useEffect(() => {
        setUploadCompleteUrl(watchedImageUrl ?? null);
    }, [watchedImageUrl]);

    // Auto-generate slug logic (remains the same)
    useEffect(() => {
        // Only generate if creating or if slug is explicitly cleared during edit
        if (watchedTitle && (!isEditing || !watchedSlug)) {
            const generatedSlug = slugify(watchedTitle, { lower: true, strict: true });
            // Avoid overwriting if user is typing in the slug field during edit unless title changes significantly
             if (!isDirty || (isDirty && watchedSlug === '')) { // Added isDirty check for better UX
                 setValue('slug', generatedSlug.substring(0, 220));
             }
        }
    }, [watchedTitle, watchedSlug, setValue, isEditing, isDirty]);

    // --- Image Upload Handlers (Adapted from CreateListingForm) ---
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
          // 1. Get pre-signed URL from our API
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
              setUploadCompleteUrl(finalImageUrl); // Update local state for immediate display
              setValue('image_url', finalImageUrl, { shouldValidate: true, shouldDirty: true }); // Update form state
              toast({ title: 'Success', description: 'Image uploaded successfully.' });
              setImageFile(null); // Clear the selected file state
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
        setValue('image_url', null, { shouldValidate: true, shouldDirty: true }); // Update form state
        toast({ title: 'Image Removed', description: 'Image will be removed upon saving.'});
    };

    const onSubmit: SubmitHandler<BlogPostFormData> = async (data) => {
        setIsLoading(true);
        try {
            // Determine API endpoint and method based on edit mode
            const apiUrl = isEditing ? `/api/admin/blog/${postId}` : '/api/blog';
            const apiMethod = isEditing ? 'PATCH' : 'POST';

            // Ensure the image_url from the upload state is included
            const payload = { ...data, image_url: uploadCompleteUrl }; 
            
            // If slug is empty string, send null so API generates it (for POST)
            if (apiMethod === 'POST' && payload.slug === '') {
                payload.slug = null;
            }

            const response = await fetch(apiUrl, {
                method: apiMethod,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} blog post`);
            }

            toast({ title: "Success", description: `Blog post ${isEditing ? 'updated' : 'saved'} successfully!` });
            
            // Redirect to the admin blog list page
            router.push('/admin/blog'); 
            router.refresh();

        } catch (error: any) {
            console.error("Blog post submission failed:", error);
            toast({ variant: "destructive", title: "Error", description: error.message || "An unexpected error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
             <CardHeader>
                 <CardTitle>{isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}</CardTitle>
                 <CardDescription>
                     {isEditing ? 'Update the details of the existing blog post.' : 'Fill in the details for the new blog post.'}
                 </CardDescription>
             </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Title */}
                    <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input id="title" {...register('title')} disabled={isLoading || isUploading} />
                        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                    </div>

                    {/* Slug */}
                    <div>
                        <Label htmlFor="slug">Slug (URL Path)</Label>
                        <Input id="slug" {...register('slug')} placeholder="Will be generated from title if left empty" disabled={isLoading || isUploading} />
                        <p className="text-xs text-muted-foreground mt-1">Optional. Use lowercase letters, numbers, and hyphens.</p>
                        {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                    </div>

                    {/* Content (Markdown) */}
                    <div>
                        <Label htmlFor="content">Content (Markdown) *</Label>
                        <Controller
                            name="content"
                            control={control}
                            rules={{ required: 'Content is required' }} // Add basic required rule
                            render={({ field }) => (
                                <SimpleMDE 
                                    id="content" 
                                    value={field.value ?? ''} // Handle potential undefined
                                    onChange={field.onChange} 
                                    options={editorOptions} 
                                    className="mt-1" // Add some margin
                                />
                            )}
                        />
                        {/* Display error message below the editor */}
                        {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
                    </div>

                    {/* Excerpt */}
                    <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea id="excerpt" {...register('excerpt')} rows={3} placeholder="A short summary for previews (optional)" disabled={isLoading || isUploading} />
                        {errors.excerpt && <p className="text-sm text-destructive mt-1">{errors.excerpt.message}</p>}
                    </div>
                    
                    {/* Category */} 
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" {...register('category')} placeholder="e.g., News, Guides, Updates (optional)" disabled={isLoading || isUploading} />
                        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                    </div>

                    {/* --- Image Upload Section --- */}
                    <div className="space-y-2">
                        <Label htmlFor="image-upload-input">Featured Image</Label>
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
                                        alt="Featured image" 
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
                            className="sr-only" // Hide default input, use the area above
                            disabled={isUploading || isLoading}
                        />
                        {uploadError && !isUploading && <p className="text-sm text-destructive mt-1">{uploadError}</p>}
                         <FormDescription>Max file size {MAX_FILE_SIZE_MB}MB. Allowed types: JPG, PNG, WEBP, GIF.</FormDescription>
                         {/* Hidden input to technically hold the URL for react-hook-form if needed, though we manage via uploadCompleteUrl state primarily */}
                         <input type="hidden" {...register('image_url')} />
                         {errors.image_url && <p className="text-sm text-destructive mt-1">{errors.image_url.message}</p>}
                    </div>
                    {/* --- End Image Upload Section --- */}

                    {/* Old Image URL Input - REMOVED */}
                    {/* 
                    <div>
                       <Label htmlFor="image_url">Featured Image URL</Label>
                       <Input id="image_url" type="url" {...register('image_url')} placeholder="https://... (optional)" disabled={isLoading} />
                       {errors.image_url && <p className="text-sm text-destructive mt-1">{errors.image_url.message}</p>}
                   </div>
                    */}

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Status */}
                        <div>
                            <Label htmlFor="status">Status *</Label>
                             <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        onValueChange={field.onChange} 
                                        // Ensure value is one of the allowed enum values
                                        value={field.value}
                                        disabled={isLoading || isUploading}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
                        </div>

                        {/* Featured */}
                         <div className="flex items-center pt-7">
                            <Controller
                                name="featured"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="featured"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isLoading || isUploading}
                                        className="mr-2"
                                    />
                                )}
                            />
                             <Label htmlFor="featured">Featured Post</Label>
                             {errors.featured && <p className="text-sm text-destructive mt-1">{errors.featured.message}</p>}
                         </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading || isUploading}>
                            {isLoading || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isEditing ? 'Update Post' : 'Create Post'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
} 