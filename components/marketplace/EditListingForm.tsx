'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, XCircle, CheckCircle2, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { ListingStatus } from '@prisma/client';
import NextImage from 'next/image';

// Define the type for Material fetched from API
type Material = {
  id: string;
  name: string;
  slug: string;
};

// Type for the listing data passed as props
// Matches the select in getListingForEdit
type ListingData = {
    id: string;
    title: string;
    description: string | null;
    material_id: string | null;
    quantity: number | null;
    unit: string | null;
    location: string | null;
    status: ListingStatus;
    seller_id: string;
    image_url: string | null;
};

// Zod schema for validation - same as PATCH API route
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional().nullable(),
  material_id: z.string().cuid("Must be a valid CUID if provided").optional().nullable(),
  quantity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().positive('Quantity must be positive').optional().nullable()
  ),
  unit: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.nativeEnum(ListingStatus).optional(),
}).partial().refine( // Ensure at least one field is provided (though API handles this, good UX)
    (data) => Object.keys(data).length > 0,
    { message: "No changes detected." }
);

type FormData = z.infer<typeof formSchema>;

// Allowed file types and max size (should match API and CreateForm)
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface EditListingFormProps {
    listing: ListingData;
}

const EditListingForm: React.FC<EditListingFormProps> = ({ listing }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  // --- Image Upload State --- 
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(listing.image_url);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCompleteUrl, setUploadCompleteUrl] = useState<string | null>(listing.image_url);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty: isFormDirty },
    control, 
    reset,
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: listing.title ?? '',
        description: listing.description ?? '',
        material_id: listing.material_id ?? null,
        quantity: listing.quantity ?? undefined,
        unit: listing.unit ?? '',
        location: listing.location ?? '',
        status: listing.status ?? ListingStatus.PENDING,
    }
  });

  // Determine overall dirty state
  const isImageChanged = uploadCompleteUrl !== listing.image_url;
  const isDirty = isFormDirty || isImageChanged; 

  // Fetch materials logic (same as Create form)
  useEffect(() => {
    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      try {
        const response = await fetch('/api/materials'); 
        if (!response.ok) throw new Error('Failed to fetch materials');
        const data: Material[] = await response.json();
        setMaterials(data);
      } catch (error) {
        console.error("Failed to fetch materials:", error);
        toast.error("Could not load materials for selection.");
        setMaterials([]);
      } finally {
        setMaterialsLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // --- Image Handling Functions (Adapted from Create Form with progress) ---
   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageFile(null);
    setImageUrl(null);
    setUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadCompleteUrl(listing.image_url);
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
    handleUpload(file);
  };

  const handleUpload = async (fileToUpload: File) => {
    if (!fileToUpload) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUploadCompleteUrl(listing.image_url); 

    try {
       const presignResponse = await fetch('/api/upload', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
             filename: fileToUpload.name, 
             contentType: fileToUpload.type 
         }),
       });
 
       if (!presignResponse.ok) {
         const errorData = await presignResponse.json();
         throw new Error(errorData.error || 'Failed to get upload URL');
       }
 
       const { presignedUrl, imageUrl: finalImageUrl } = await presignResponse.json();

       const xhr = new XMLHttpRequest();
       xhr.open('PUT', presignedUrl, true);
       xhr.setRequestHeader('Content-Type', fileToUpload.type);
       xhr.upload.addEventListener('progress', (event) => {
         if (event.lengthComputable) {
           const percentComplete = (event.loaded / event.total) * 100;
           setUploadProgress(percentComplete);
         }
       });
       xhr.onload = () => {
         if (xhr.status >= 200 && xhr.status < 300) {
           setUploadCompleteUrl(finalImageUrl);
           toast.success('Bild erfolgreich hochgeladen!');
           setImageFile(null); 
         } else {
           const errorMessage = `Upload failed: ${xhr.statusText}`;
           console.error("Upload error:", errorMessage);
           setUploadError(errorMessage);
           toast.error(errorMessage);
           setImageFile(null);
         }
         setIsUploading(false);
       };
       xhr.onerror = () => {
         const errorMessage = 'Upload failed due to network error';
         console.error("Upload error:", errorMessage);
         setUploadError(errorMessage);
         toast.error(errorMessage);
         setImageFile(null);
         setIsUploading(false);
       };
       xhr.send(fileToUpload);

    } catch (uploadErrorObj) {
       const message = uploadErrorObj instanceof Error ? uploadErrorObj.message : 'Image upload failed';
       console.error("Upload error:", uploadErrorObj);
       setUploadError(message);
       toast.error(message);
       setImageFile(null);
       setIsUploading(false);
    } 
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUrl(null);
    setUploadCompleteUrl(null);
    setUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setValue('title', listing.title, { shouldDirty: true });
  };

  // --- Form Submission ---
  const onSubmit = async (data: FormData) => {
    if (!isDirty) {
         toast.error("No changes detected to save.");
         return;
     }
    setIsLoading(true);
    toast.loading('Angebot wird aktualisiert...');
    
    const finalImageUrl = uploadCompleteUrl;

    const payload = { ...data, imageUrl: finalImageUrl };

    try {
      const response = await fetch(`/api/marketplace/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || `API Error: ${response.status}`;
        const errorDetails = result.details ? ` Details: ${JSON.stringify(result.details)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast.dismiss();
      toast.success('Angebot erfolgreich aktualisiert!');
      reset(payload);
      setImageFile(null);
      setIsUploading(false);
      setUploadError(null);
      setUploadProgress(0);
      setUploadCompleteUrl(finalImageUrl);
      router.push(`/marketplace/listings/${listing.id}`); 
      router.refresh(); 
    } catch (error) {
      toast.dismiss();
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error(`Failed to update listing: ${message}`);
      console.error("Listing update failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-lg shadow-lg p-6 md:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground">Titel</Label>
          <Input 
            id="title" 
            {...register('title')} 
            className={`transition-colors duration-200 focus:border-primary focus:ring-primary/20 ${errors.title ? 'border-destructive' : ''}`}
            disabled={isLoading || isUploading}
            placeholder="z.B. Aluminiumschrott gemischt, sauber"
          />
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">Beschreibung</Label>
          <Textarea
            id="description"
            {...register('description')}
            rows={4}
            className={`transition-colors duration-200 focus:border-primary focus:ring-primary/20 ${errors.description ? 'border-destructive' : ''}`}
            disabled={isLoading || isUploading}
            placeholder="Details zum Material, Zustand, Mindestabnahme etc."
          />
          {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
        </div>

         <div className="space-y-2">
            <Label htmlFor="status" className="text-foreground">Status</Label>
            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                        disabled={isLoading || isUploading}
                    > 
                        <SelectTrigger 
                            id="status"
                            className={`transition-colors duration-200 focus:border-primary focus:ring-primary/20 ${errors.status ? 'border-destructive' : ''}`}
                        >
                            <SelectValue placeholder="Status auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(ListingStatus).map(statusVal => (
                                <SelectItem key={statusVal} value={statusVal}>
                                    {statusVal} 
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="material_id" className="text-foreground">Material</Label>
            <Controller
                name="material_id"
                control={control}
                render={({ field }) => (
                    <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                        disabled={materialsLoading || isLoading || isUploading}
                    > 
                        <SelectTrigger 
                            id="material_id"
                            className={`transition-colors duration-200 focus:border-primary focus:ring-primary/20 ${errors.material_id ? 'border-destructive' : ''}`}
                        >
                            <SelectValue placeholder={materialsLoading ? "Lade..." : "Material auswählen"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">-- Kein Material --</SelectItem>
                            {materials.map(material => (
                                <SelectItem key={material.id} value={material.id}>
                                    {material.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.material_id && <p className="text-sm text-destructive mt-1">{errors.material_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div className="space-y-2">
                <Label htmlFor="quantity" className="text-foreground">Menge</Label>
                <Input 
                    id="quantity" 
                    type="number" 
                    step="any" 
                    {...register('quantity')} 
                    className={`transition-colors duration-200 focus:border-primary focus:ring-primary/20 ${errors.quantity ? 'border-destructive' : ''}`}
                    disabled={isLoading || isUploading}
                    placeholder="z.B. 100"
                />
                {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="unit" className="text-foreground">Einheit</Label>
                <Input 
                    id="unit" 
                    {...register('unit')} 
                    className={`transition-colors duration-200 focus:border-primary focus:ring-primary/20 ${errors.unit ? 'border-destructive' : ''}`}
                    disabled={isLoading || isUploading}
                    placeholder="z.B. kg, Tonne, Stück"
                />
                {errors.unit && <p className="text-sm text-destructive mt-1">{errors.unit.message}</p>}
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground">Standort</Label>
          <Input 
            id="location" 
            {...register('location')} 
            className={`transition-colors duration-200 focus:border-primary focus:ring-primary/20 ${errors.location ? 'border-destructive' : ''}`}
            disabled={isLoading || isUploading}
            placeholder="z.B. Berlin, 10115 oder Lagerhalle West"
          />
          {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="imageUpload" className="text-foreground">Bild</Label>
            {uploadCompleteUrl && !isUploading && !uploadError && (
                <div className="relative group w-48 h-32 mb-2 border border-border rounded-md overflow-hidden">
                    <NextImage 
                        src={uploadCompleteUrl} 
                        alt="Aktuelles Angebotsbild" 
                        fill 
                        style={{ objectFit: 'cover' }} 
                        sizes="192px"
                    />
                    <Button 
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={handleRemoveImage}
                        disabled={isLoading}
                        aria-label="Bild entfernen"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
            )}

            <div 
                className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer 
                ${uploadError ? 'border-destructive' : 'border-border hover:border-primary/50'} 
                ${isUploading ? 'bg-muted/50' : 'bg-background hover:bg-muted/30'} 
                ${uploadCompleteUrl ? 'h-auto py-6' : 'h-40'} transition-all`}
            >
                 <input 
                    id="imageUpload" 
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(',')} 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    disabled={isUploading}
                />
                
                {isUploading ? (
                     <div className="text-center p-4">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2 mx-auto" />
                        <p className="text-sm text-muted-foreground mb-2">Wird hochgeladen...</p>
                        <Progress value={uploadProgress} className="w-3/4 mx-auto h-2" />
                    </div>
                ) : uploadError ? (
                    <div className="text-center p-4 text-destructive">
                        <XCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Fehler beim Upload</p>
                        <p className="text-xs px-2">{uploadError}</p>
                         <p className="text-xs mt-2 underline cursor-pointer" onClick={() => document.getElementById('imageUpload')?.click()}>Erneut versuchen</p>
                    </div>
                 ) : uploadCompleteUrl ? (
                     <div className="text-center text-accent">
                         <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                         <p className="text-sm font-semibold">Bild erfolgreich hochgeladen/gespeichert!</p>
                         <p className="text-xs mt-2 underline cursor-pointer text-muted-foreground hover:text-accent" onClick={() => document.getElementById('imageUpload')?.click()}>Anderes Bild hochladen</p>
                     </div>
                 ) : (
                    <div className="text-center text-muted-foreground">
                        <UploadCloud className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Klicken oder Bild hierher ziehen zum Hochladen</p>
                        <p className="text-xs">Neues Bild ersetzt das alte. Max. {MAX_FILE_SIZE_MB}MB.</p>
                    </div>
                 )}
            </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/60">
          <Button 
            type="submit" 
            disabled={isLoading || isUploading || !isDirty}
            size="lg"
            className="transition-all duration-200"
          >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? 'Wird gespeichert...' : 'Änderungen speichern'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditListingForm;