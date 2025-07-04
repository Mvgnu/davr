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
import { UploadCloud, XCircle, CheckCircle2, Loader2 } from 'lucide-react'; // Added Loader2
import { Progress } from "@/components/ui/progress"; // Added Progress

// Define the type for Material fetched from API
type Material = {
  id: string;
  name: string;
  slug: string; // Include slug if fetched
};

// Mirror the Zod schema used in the API for validation
// Note: Transform empty strings to null/undefined for optional fields if needed
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  material_id: z.string().cuid("Must be a valid CUID if provided").optional().nullable(), // Add CUID check if non-empty
  quantity: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)), // Convert empty string or number
    z.number().positive('Quantity must be positive').optional().nullable()
  ),
  unit: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

// Allowed file types and max size (should match API)
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const CreateListingForm: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCompleteUrl, setUploadCompleteUrl] = useState<string | null>(null); // Store URL on success

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    control, 
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: '',
        description: '',
        material_id: null,
        quantity: undefined,
        unit: '',
        location: '',
    }
  });

  // Fetch materials from the new API endpoint
  useEffect(() => {
    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      try {
        const response = await fetch('/api/materials'); 
        if (!response.ok) {
          throw new Error('Failed to fetch materials');
        }
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

  // --- Image Handling Functions ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset previous upload state fully
    setImageFile(null);
    setImageUrl(null);
    setUploadError(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadCompleteUrl(null);
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
    // Immediately start upload on file selection
    handleUpload(file);
  };

  const handleUpload = async (fileToUpload: File) => {
    if (!fileToUpload) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUploadCompleteUrl(null);

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
          setImageUrl(finalImageUrl);
          setUploadCompleteUrl(finalImageUrl);
          toast.success('Bild erfolgreich hochgeladen!');
          setImageFile(null);
        } else {
          const errorMsg = `Upload fehlgeschlagen: ${xhr.statusText || xhr.status}`;
          console.error("Upload error:", xhr);
          setUploadError(errorMsg);
          toast.error(errorMsg);
          setImageFile(null);
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        const errorMsg = 'Netzwerkfehler beim Upload.';
        console.error("Upload error:", xhr);
        setUploadError(errorMsg);
        toast.error(errorMsg);
        setIsUploading(false);
        setImageFile(null);
      };

      xhr.send(fileToUpload);

    } catch (uploadErrorObj) {
      const message = uploadErrorObj instanceof Error ? uploadErrorObj.message : 'Bild-Upload fehlgeschlagen';
      console.error("Upload preparation/request error:", uploadErrorObj);
      setUploadError(message);
      toast.error(message);
      setIsUploading(false);
      setImageFile(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    toast.loading('Angebot wird erstellt...');

    // Use the URL obtained during upload
    const finalImageUrl = uploadCompleteUrl; 

    // Prepare payload 
    const payload = { ...data, imageUrl: finalImageUrl };

    try {
       // ... fetch POST /api/marketplace/listings ...
       // ... handle response ...
      toast.dismiss();
      toast.success('Angebot erfolgreich erstellt!');
      reset(); 
      // Reset image state completely
      setImageFile(null);
      setImageUrl(null);
      setUploadError(null);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadCompleteUrl(null);
      // ... router push and refresh ...
    } catch (error) {
      // ... error handling ...
    }
  };

  return (
    // Enhanced Form Container
    <div className="bg-card border border-border/60 rounded-lg shadow-lg p-6 md:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title - Enhanced */}
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

        {/* Description - Enhanced */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">Beschreibung (Optional)</Label>
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

        {/* Material Select - Enhanced */}
        <div className="space-y-2">
            <Label htmlFor="material_id" className="text-foreground">Material (Optional)</Label>
            <Controller
                name="material_id"
                control={control}
                render={({ field }) => (
                    <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""} // Ensure value is controlled
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

        {/* Quantity & Unit - Enhanced Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div className="space-y-2">
                <Label htmlFor="quantity" className="text-foreground">Menge (Optional)</Label>
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
                <Label htmlFor="unit" className="text-foreground">Einheit (Optional)</Label>
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

        {/* Location - Enhanced */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground">Standort (Optional)</Label>
          <Input 
            id="location" 
            {...register('location')} 
            className={`transition-colors duration-200 focus:border-primary focus:ring-primary/20 ${errors.location ? 'border-destructive' : ''}`}
            disabled={isLoading || isUploading}
            placeholder="z.B. Berlin, 10115 oder Lagerhalle West"
          />
          {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
        </div>

        {/* Image Upload - Enhanced UI */}
        <div className="space-y-2">
            <Label htmlFor="imageUpload" className="text-foreground">Bild (Optional)</Label>
            <div className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer 
                ${uploadError ? 'border-destructive' : 'border-border hover:border-primary/50'} 
                ${isUploading ? 'bg-muted/50' : 'bg-background hover:bg-muted/30'} transition-colors`}
            >
                <input 
                    id="imageUpload" 
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(',')} 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    disabled={isUploading || !!uploadCompleteUrl}
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
                         {/* Allow retry by clicking */}
                         <p className="text-xs mt-2 underline cursor-pointer" onClick={() => document.getElementById('imageUpload')?.click()}>Erneut versuchen</p>
                    </div>
                ) : uploadCompleteUrl ? (
                    <div className="text-center p-4 text-accent">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Upload erfolgreich!</p>
                        <p className="text-xs text-muted-foreground">(Bild wird gespeichert)</p>
                         {/* Allow changing image */}
                         <p className="text-xs mt-2 underline cursor-pointer text-muted-foreground hover:text-accent" onClick={() => document.getElementById('imageUpload')?.click()}>Bild ändern</p>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">
                        <UploadCloud className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Klicken zum Hochladen oder Bild hierher ziehen</p>
                        <p className="text-xs">Max. {MAX_FILE_SIZE_MB}MB ({ALLOWED_FILE_TYPES.map(t => t.split('/')[1]).join(', ')})</p>
                    </div>
                )}
            </div>
        </div>

        {/* Submit Button - Enhanced */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading || isUploading}
            size="lg"
            className="transition-all duration-200"
          >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? 'Wird erstellt...' : 'Angebot erstellen'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateListingForm; 