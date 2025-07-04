'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Define the structure of the listing data we expect
type ListingData = {
    id: string;
    title: string;
    description?: string | null;
    materialId: string;
    quantity: number;
    unit: string;
    location: string;
    is_active: boolean;
    seller?: { name: string | null; email: string | null }; // Optional seller info
    material?: { name: string }; // Optional material info
};

// Type for fetched materials list
type Material = {
    id: string;
    name: string;
};

// Zod-like validation structure from the API route for reference (frontend doesn't strictly need zod here)
type UpdatePayload = {
    title?: string;
    description?: string | null;
    materialId?: string;
    quantity?: number;
    unit?: string;
    location?: string;
    is_active?: boolean;
};

export default function AdminEditListingPage() {
    const params = useParams();
    const router = useRouter();
    const listingId = params.listingId as string;

    const [listing, setListing] = useState<ListingData | null>(null);
    const [formData, setFormData] = useState<UpdatePayload>({});
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null); // Separate error for initial fetch
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);


    // Fetch listing details and materials on mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                // Fetch Listing Data
                const listingRes = await fetch(`/api/admin/listings/${listingId}`);
                if (!listingRes.ok) {
                    const errorData = await listingRes.json();
                    throw new Error(errorData.error || `Failed to fetch listing (Status: ${listingRes.status})`);
                }
                const listingResult = await listingRes.json();
                 if (!listingResult.success || !listingResult.data) {
                    throw new Error(listingResult.error || 'Listing data not found in API response.');
                }
                const fetchedListing: ListingData = listingResult.data;
                setListing(fetchedListing);
                // Initialize form data with fetched values
                setFormData({
                    title: fetchedListing.title,
                    description: fetchedListing.description,
                    materialId: fetchedListing.materialId,
                    quantity: fetchedListing.quantity,
                    unit: fetchedListing.unit,
                    location: fetchedListing.location,
                    is_active: fetchedListing.is_active,
                });

                // Fetch Materials
                const materialsRes = await fetch('/api/materials');
                if (!materialsRes.ok) {
                   throw new Error('Failed to fetch materials');
                }
                const materialsData: Material[] = await materialsRes.json();
                setMaterials(materialsData);

            } catch (err: any) {
                console.error("Fetch error:", err);
                setFetchError(err.message || "An unexpected error occurred while fetching data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (listingId) {
            fetchData();
        } else {
            setFetchError("Listing ID is missing.");
            setIsLoading(false);
        }
    }, [listingId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

     const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (value === '') {
            // If input is empty, explicitly set the state value to undefined
            setFormData(prev => ({ ...prev, [name]: undefined }));
        } else {
            // Otherwise, try converting to a number
            const numValue = Number(value);
            // Only update state if the conversion resulted in a valid number (not NaN)
            if (!isNaN(numValue)) {
                setFormData(prev => ({ ...prev, [name]: numValue }));
            }
             // If input is not a valid number (e.g., 'abc'), do nothing, keeping the previous state or letting validation catch it later.
        }
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, materialId: value }));
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
         if (typeof checked === 'boolean') {
             setFormData(prev => ({ ...prev, is_active: checked }));
         }
    };


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSubmitSuccess(null);

        // Basic Frontend Validation (optional but good practice)
        if (!formData.title || formData.title.trim() === '') {
            setError("Title cannot be empty.");
            setIsSubmitting(false);
            return;
        }
         if (formData.quantity !== undefined && formData.quantity <= 0) {
             setError("Quantity must be a positive number.");
             setIsSubmitting(false);
             return;
         }
        // Add more validation as needed...


        try {
            const response = await fetch(`/api/admin/listings/${listingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Failed to update listing (Status: ${response.status})`);
            }

            setSubmitSuccess('Listing updated successfully!');
            // Optionally update local state if needed, or rely on redirection/refresh
            setListing(prev => prev ? { ...prev, ...formData, material: materials.find(m => m.id === formData.materialId) } : null); // Update local state slightly

             // Optional: Redirect after a short delay
             // setTimeout(() => router.push('/admin/listings'), 1500); // Example redirect

        } catch (err: any) {
            console.error("Submit error:", err);
            setError(err.message || "An unexpected error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-600">Loading listing data...</span>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Fetching Data</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
                 <Button variant="outline" onClick={() => router.back()} className="mt-4">
                     <ArrowLeft className="mr-2 h-4 w-4" /> Back
                 </Button>
            </div>
        );
    }

     if (!listing) {
        // Should ideally be caught by fetchError, but as a fallback
        return <div className="container mx-auto p-4 md:p-8 text-center text-gray-600">Listing not found.</div>;
    }


    return (
        <div className="container mx-auto p-4 md:p-8">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/listings')} className="mb-4">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
             </Button>
            <h1 className="text-2xl font-bold mb-6">Edit Marketplace Listing</h1>
            <p className="text-sm text-gray-500 mb-2">Listing ID: {listing.id}</p>
            {listing.seller && <p className="text-sm text-gray-500 mb-4">Seller: {listing.seller.name || 'N/A'} ({listing.seller.email || 'No Email'})</p>}


            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {/* Form Fields */}
                 <div>
                     <Label htmlFor="title">Title</Label>
                     <Input
                         id="title"
                         name="title"
                         value={formData.title || ''}
                         onChange={handleInputChange}
                         required
                         maxLength={100}
                         className="mt-1"
                     />
                 </div>

                 <div>
                     <Label htmlFor="description">Description</Label>
                     <Textarea
                         id="description"
                         name="description"
                         value={formData.description || ''}
                         onChange={handleInputChange}
                         rows={4}
                         className="mt-1"
                         placeholder="Optional: Provide more details about the material, quality, etc."
                     />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                         <Label htmlFor="materialId">Material</Label>
                         <Select
                             name="materialId"
                             value={formData.materialId || ''}
                             onValueChange={handleSelectChange}
                             required
                         >
                             <SelectTrigger id="materialId" className="mt-1 w-full">
                                 <SelectValue placeholder="Select Material" />
                             </SelectTrigger>
                             <SelectContent>
                                 {materials.length === 0 ? (
                                     <SelectItem value="loading" disabled>Loading materials...</SelectItem>
                                 ) : (
                                     materials.map(material => (
                                         <SelectItem key={material.id} value={material.id}>
                                             {material.name}
                                         </SelectItem>
                                     ))
                                 )}
                             </SelectContent>
                         </Select>
                     </div>
                    <div>
                         <Label htmlFor="quantity">Quantity</Label>
                         <Input
                             id="quantity"
                             name="quantity"
                             type="number"
                             value={formData.quantity === undefined ? '' : formData.quantity} // Handle undefined for empty input
                             onChange={handleNumberInputChange}
                             required
                             min="0.01" // Or adjust as needed
                             step="any" // Allow decimals
                             className="mt-1"
                         />
                     </div>
                     <div>
                         <Label htmlFor="unit">Unit</Label>
                         <Input
                             id="unit"
                             name="unit"
                             value={formData.unit || ''}
                             onChange={handleInputChange}
                             required
                             maxLength={20}
                             placeholder="e.g., kg, tonnes, items"
                             className="mt-1"
                         />
                     </div>
                 </div>

                  <div>
                     <Label htmlFor="location">Location</Label>
                     <Input
                         id="location"
                         name="location"
                         value={formData.location || ''}
                         onChange={handleInputChange}
                         required
                         maxLength={100}
                         placeholder="City, Region, or Postal Code"
                         className="mt-1"
                     />
                 </div>

                 <div className="flex items-center space-x-2">
                     <Checkbox
                         id="is_active"
                         name="is_active"
                         checked={formData.is_active}
                         onCheckedChange={handleCheckboxChange}
                     />
                     <Label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                         Listing Active? (Visible in marketplace)
                     </Label>
                 </div>

                {/* Submission Feedback */}
                {error && (
                    <Alert variant="destructive">
                         <AlertCircle className="h-4 w-4" />
                         <AlertTitle>Update Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                 {submitSuccess && (
                    <Alert variant="default" className="bg-green-50 border-green-300 text-green-800">
                         <AlertCircle className="h-4 w-4" /> {/* Use a success icon ideally */}
                         <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{submitSuccess}</AlertDescription>
                    </Alert>
                )}


                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting || isLoading}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
} 