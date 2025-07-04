'use client';

import React from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Material } from '@prisma/client'; // Import Material type

// Zod schema matching the PATCH API validation for admin edits
const listingFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().optional().nullable(),
    materialId: z.string().min(1, 'Material selection is required'), // Required for the form
    quantity: z.coerce.number().positive('Quantity must be a positive number'), // Coerce input to number
    unit: z.string().min(1, 'Unit is required').max(20),
    location: z.string().min(1, 'Location is required').max(100),
    is_active: z.boolean(),
    // image_url is not directly editable here
});

type ListingFormValues = z.infer<typeof listingFormSchema>;

// Type for the initial listing data passed to the form
interface ListingData {
    id: string;
    title: string;
    description: string | null;
    materialId: string;
    quantity: number;
    unit: string;
    location: string;
    is_active: boolean;
    image_url: string | null;
    // Add other fields if needed, but the form only uses these
}

interface AdminListingFormProps {
    initialData: ListingData;
    materials: Pick<Material, 'id' | 'name'>[]; // Only need id and name for the dropdown
}

export default function AdminListingForm({ initialData, materials }: AdminListingFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<ListingFormValues>({
        resolver: zodResolver(listingFormSchema),
        defaultValues: {
            title: initialData.title ?? '',
            description: initialData.description ?? '',
            materialId: initialData.materialId ?? '',
            quantity: initialData.quantity ?? 0,
            unit: initialData.unit ?? '',
            location: initialData.location ?? '',
            is_active: initialData.is_active ?? true, // Default to true if not set?
        },
    });

    const onSubmit = async (values: ListingFormValues) => {
        setIsSubmitting(true);
        const apiUrl = `/api/admin/listings/${initialData.id}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update listing');
            }

            toast.success(`Listing updated successfully!`);
            // Redirect back to the admin listings page (or maybe the detail page?)
            router.push('/admin/listings'); 
            router.refresh(); // Refresh server components

        } catch (error) {
            console.error("Error submitting admin listing form:", error);
            toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
                
                {/* Title Field */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Listing Title</FormLabel>
                            <FormControl>
                                <Input {...field} disabled={isSubmitting} />
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Detailed description of the item..." className="resize-y" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                 {/* Material Field */}    
                <FormField
                    control={form.control}
                    name="materialId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Material</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || materials.length === 0}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={materials.length > 0 ? "Select the material" : "Loading materials..."} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {materials.map((material) => (
                                        <SelectItem key={material.id} value={material.id}>
                                            {material.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Quantity & Unit Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., kg, tonnes, items" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Location Field */}
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Berlin, Germany" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {/* Is Active Field */}
                <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Listing Active?
                                </FormLabel>
                                <FormDescription>
                                    Inactive listings will not be visible in the public marketplace.
                                </FormDescription>
                            </div>
                             <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Submit Button */}
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 