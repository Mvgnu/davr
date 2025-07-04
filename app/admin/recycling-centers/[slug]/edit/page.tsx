'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { useToast } from '@/lib/hooks/useToast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader, Trash2, PlusCircle, Edit2, UploadCloud, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

// Define types for our data
interface Material {
  id: number;
  name: string;
  category: string;
}

interface Owner {
  id: string;
  email: string;
  name: string;
}

interface MaterialOffer {
  material_id: number;
  price: number;
  min_quantity?: number | null;
  max_quantity?: number | null;
  notes?: string | null;
  active?: boolean | null;
  material_name?: string; // Included from API response
  material_category?: string; // Included from API response
}

interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
  website: string;
  description: string;
  hours_of_operation: string;
  verification_status: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  material_offers: MaterialOffer[];
  accepted_material_ids: number[];
}

// Define validation schema
const materialOfferSchema = z.object({
  material_id: z.coerce.number().positive('Material must be selected'),
  price: z.coerce.number().positive('Price must be positive'),
  min_quantity: z.coerce.number().optional().nullable(),
  max_quantity: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  active: z.boolean().optional().nullable(),
  // Temporary fields for display/selection, not sent directly to API in this structure
  material_name: z.string().optional(), 
  material_category: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postal_code: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  description: z.string().optional(),
  hours_of_operation: z.string().optional(),
  verification_status: z.enum(['pending', 'verified', 'rejected']),
  owner_id: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  acceptedMaterialIds: z.array(z.coerce.number()).optional(),
  materialOffers: z.array(materialOfferSchema).optional(),
});

export default function EditRecyclingCenterPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const id = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recyclingCenter, setRecyclingCenter] = useState<RecyclingCenter | null>(null);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [availableOwners, setAvailableOwners] = useState<Owner[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      postal_code: '',
      state: '',
      country: '',
      latitude: null,
      longitude: null,
      phone: '',
      email: '',
      website: '',
      description: '',
      hours_of_operation: '',
      verification_status: 'pending',
      owner_id: null,
      image_url: null,
      acceptedMaterialIds: [],
      materialOffers: [],
    },
  });

  // Hook for managing the materialOffers array
  const { fields: offerFields, append: appendOffer, remove: removeOffer, update: updateOffer } = useFieldArray({
    control: form.control,
    name: "materialOffers"
  });

  // Fetch recycling center data
  useEffect(() => {
    const fetchRecyclingCenter = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/recycling-centers/detail/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recycling center');
        }
        
        const result = await response.json();
        
        if (result.success) {
          setRecyclingCenter(result.data.recyclingCenter);
          setAvailableMaterials(result.data.availableMaterials);
          setAvailableOwners(result.data.availableOwners);
          
          // Set form values
          const rc = result.data.recyclingCenter;
          form.reset({
            name: rc.name,
            address: rc.address,
            city: rc.city,
            postal_code: rc.postal_code || '',
            state: rc.state || '',
            country: rc.country || '',
            latitude: rc.latitude,
            longitude: rc.longitude,
            phone: rc.phone || '',
            email: rc.email || '',
            website: rc.website || '',
            description: rc.description || '',
            hours_of_operation: rc.hours_of_operation || '',
            verification_status: rc.verification_status,
            owner_id: rc.owner_id,
            image_url: rc.image_url,
            acceptedMaterialIds: rc.accepted_material_ids || [],
            materialOffers: (rc.material_offers || []).map((offer: MaterialOffer) => ({
              ...offer,
              material_name: offer.material_name || 'Unknown',
              material_category: offer.material_category || 'Unknown'
            })),
          });
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to fetch recycling center',
            variant: 'destructive',
          });
          router.push('/admin/recycling-centers');
        }
      } catch (error) {
        console.error('Error fetching recycling center:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch recycling center details',
          variant: 'destructive',
        });
        router.push('/admin/recycling-centers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecyclingCenter();
  }, [id, router, toast, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/admin/recycling-centers/detail/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Recycling center updated successfully',
        });
        router.push('/admin/recycling-centers');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update recycling center',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating recycling center:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recyclingCenter) return;
    if (confirm(`Are you sure you want to delete ${recyclingCenter.name}? This cannot be undone.`)) {
        try {
            setIsSaving(true);
            
            const response = await fetch(`/api/admin/recycling-centers/detail/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            
            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Recycling center deleted successfully',
                });
                router.push('/admin/recycling-centers');
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to delete recycling center',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error deleting recycling center:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }
  };

  // Handler for file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic client-side validation (optional, API validates too)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Invalid file type. Please select JPG, PNG, WEBP, or GIF.');
        setSelectedFile(null);
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setUploadError('File is too large. Maximum size is 5MB.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null); // Clear previous error
    } else {
      setSelectedFile(null);
    }
  };

  // Handler for triggering the upload
  const handleImageUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select an image file first.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/recycling-centers/image-upload', {
        method: 'POST',
        body: formData, // Send as FormData
        // No 'Content-Type' header needed, browser sets it for FormData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: 'Success', description: 'Image uploaded successfully.' });
        form.setValue('image_url', result.imageUrl, { shouldValidate: true, shouldDirty: true });
        setSelectedFile(null); // Clear selection after successful upload
        // Optional: Refetch data or update local state if needed immediately
      } else {
        throw new Error(result.error || 'Image upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'An error occurred during upload.');
      toast({ title: 'Upload Error', description: error.message || 'Image upload failed.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading recycling center data...</span>
      </div>
    );
  }

  const materialOptions = availableMaterials.map(m => ({ 
      value: m.id.toString(), 
      label: `${m.name} (${m.category})` 
  }));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Recycling Center</h1>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/recycling-centers')}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isSaving}
          >
            Delete
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* --- Basic Details Card --- */}
          <Card>
            <CardHeader><CardTitle>Recycling Center Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter center name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="verification_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter postal code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter state or province" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="owner_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Owner</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                        defaultValue={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business owner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (Unclaimed)</SelectItem>
                          {availableOwners.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              {owner.email} ({owner.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign this center to a business owner account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter email address" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter website URL" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hours_of_operation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours of Operation</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., Mon-Fri: 9AM-5PM" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter description of the recycling center"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* --- Image Upload Card --- */}
          <Card>
            <CardHeader><CardTitle>Center Image</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Image</FormLabel>
                    <FormControl>
                      <div className="w-full p-4 border border-border rounded-md bg-muted/30 min-h-[150px] flex flex-col items-center justify-center">
                        {field.value ? (
                          <Image 
                            src={field.value} 
                            alt="Current center image" 
                            width={200} 
                            height={120} 
                            className="rounded-md object-contain max-h-[120px] mb-4"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground p-4">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            No image uploaded yet.
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="image-upload">Upload New Image (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    id="image-upload"
                    type="file"
                    accept="image/jpeg, image/png, image/webp, image/gif"
                    onChange={handleFileChange}
                    className="flex-grow"
                    disabled={isUploading}
                  />
                  <Button 
                    type="button" 
                    onClick={handleImageUpload}
                    disabled={!selectedFile || isUploading}
                    size="sm"
                  >
                    {isUploading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                {uploadError && <p className="text-sm text-destructive mt-1">{uploadError}</p>}
                {selectedFile && !isUploading && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
                <FormDescription>Max file size 5MB. Allowed types: JPG, PNG, WEBP, GIF.</FormDescription>
              </div>
            </CardContent>
          </Card>

          {/* --- Materials Management Card --- */}
          <Card>
            <CardHeader><CardTitle>Materials Management</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              
              {/* Accepted Materials Section */}
              <FormField
                control={form.control}
                name="acceptedMaterialIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accepted Materials (No Price)</FormLabel>
                    <FormControl>
                      <MultiSelect 
                        options={materialOptions}
                        selected={(field.value || []).map(String)} // Ensure values are strings and handle undefined
                        onChange={(selectedValues) => field.onChange(selectedValues.map(Number))} // Convert back to numbers
                        placeholder="Select materials..."
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Materials this center accepts but does not pay for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <hr className="my-6" />

              {/* Material Offers Section */}
              <div>
                <FormLabel>Material Buying Offers (With Price)</FormLabel>
                <FormDescription className="mb-4">
                  Materials this center actively buys from users/businesses.
                </FormDescription>
                
                {offerFields.map((field, index) => (
                  <Card key={field.id} className="mb-4 p-4 border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 mb-4">
                       {/* Row 1: Material, Price, Active */}
                       <FormField
                         control={form.control}
                         name={`materialOffers.${index}.material_id`}
                         render={({ field: itemField }) => (
                           <FormItem className="md:col-span-1">
                             <FormLabel>Material *</FormLabel>
                             <Select 
                                onValueChange={(value) => itemField.onChange(parseInt(value))}
                                defaultValue={itemField.value?.toString()}
                             >
                               <FormControl><SelectTrigger><SelectValue placeholder="Select Material..." /></SelectTrigger></FormControl>
                               <SelectContent>
                                 {availableMaterials.map(m => (
                                   <SelectItem key={m.id} value={m.id.toString()}>{m.name} ({m.category})</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <FormField
                         control={form.control}
                         name={`materialOffers.${index}.price`}
                         render={({ field: itemField }) => (
                           <FormItem className="md:col-span-1">
                             <FormLabel>Price (€/kg) *</FormLabel>
                             <FormControl><Input type="number" step="0.01" {...itemField} onChange={e => itemField.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <FormField
                          control={form.control}
                          name={`materialOffers.${index}.active`}
                          render={({ field: itemField }) => (
                            <FormItem className="md:col-span-1 flex flex-row items-center justify-start space-x-2 pt-7">
                               <FormControl>
                                  {/* Use Checkbox or Switch from shadcn/ui */}
                                  {/* Assuming Checkbox here, import it */} 
                                  {/* <Checkbox 
                                     checked={itemField.value ?? true} 
                                     onCheckedChange={itemField.onChange} 
                                     id={`active-${index}`}
                                  /> */}
                                  {/* Placeholder - Replace with actual Checkbox/Switch */}
                                  <input 
                                    type="checkbox" 
                                    checked={itemField.value ?? true} 
                                    onChange={e => itemField.onChange(e.target.checked)}
                                    className="form-checkbox h-5 w-5 text-blue-600" // Basic styling 
                                    id={`active-${index}`}
                                  />
                               </FormControl>
                               <FormLabel htmlFor={`active-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                 Offer Active
                               </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                       {/* Row 2: Min Qty, Max Qty, Notes */}
                       <FormField
                         control={form.control}
                         name={`materialOffers.${index}.min_quantity`}
                         render={({ field: itemField }) => (
                           <FormItem className="md:col-span-1">
                             <FormLabel>Min Quantity (kg)</FormLabel>
                             <FormControl><Input type="number" step="any" {...itemField} value={itemField.value ?? ''} onChange={e => itemField.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="Optional"/></FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <FormField
                         control={form.control}
                         name={`materialOffers.${index}.max_quantity`}
                         render={({ field: itemField }) => (
                           <FormItem className="md:col-span-1">
                             <FormLabel>Max Quantity (kg)</FormLabel>
                             <FormControl><Input type="number" step="any" {...itemField} value={itemField.value ?? ''} onChange={e => itemField.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="Optional"/></FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                        <FormField
                         control={form.control}
                         name={`materialOffers.${index}.notes`}
                         render={({ field: itemField }) => (
                           <FormItem className="md:col-span-3">
                             <FormLabel>Notes</FormLabel>
                             <FormControl><Textarea {...itemField} value={itemField.value ?? ''} placeholder="Optional notes about this offer (e.g., condition requirements)" rows={2}/></FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                    </div>
                    <div className="flex justify-end space-x-2">
                       <Button type="button" size="sm" variant="destructive" onClick={() => removeOffer(index)}><Trash2 className="h-4 w-4 mr-1"/> Remove</Button>
                    </div>
                  </Card>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => appendOffer({ 
                    material_id: 0,
                    price: 0,
                    active: true,
                    min_quantity: null,
                    max_quantity: null,
                    notes: '',
                    material_name: 'Select Material',
                    material_category: ''
                  })} 
                  className="mt-2"
                >
                  <PlusCircle className="h-4 w-4 mr-2"/> Add New Buying Offer
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* --- Save/Cancel Buttons --- */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.push('/admin/recycling-centers')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !form.formState.isValid}>
              {isSaving ? (
                <><Loader className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : ( 'Save Changes' )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
} 