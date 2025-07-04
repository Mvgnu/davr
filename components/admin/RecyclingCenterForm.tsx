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
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Zod schema matching the PATCH API validation (subset of fields)
// Ensure this matches the fields you want admins to edit
const centerFormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    address: z.string().min(1, 'Address is required').max(255),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    phone_number: z.string().max(50).optional(),
    website: z.string().url({ message: "Must be a valid URL (e.g., https://example.com)" }).max(255).optional().or(z.literal('')).nullable(), // Allow URL, empty string, or null
    // Coordinates might be complex to edit via simple form, consider a map picker if needed
    // latitude: z.number().min(-90).max(90).optional().nullable(),
    // longitude: z.number().min(-180).max(180).optional().nullable(),
    opening_hours: z.string().optional(), 
    description: z.string().optional(),
    verification_status: z.enum(['pending', 'verified', 'rejected']),
});

type CenterFormValues = z.infer<typeof centerFormSchema>;

// Type for the initial data, should match the structure fetched from GET /api/admin/recycling-centers/[centerId]
// Adjust this based on the actual API response or Prisma model if necessary
interface RecyclingCenterData {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    phone_number: string | null;
    website: string | null;
    opening_hours: string | null;
    description: string | null;
    verification_status: 'pending' | 'verified' | 'rejected';
    // Add other fields like lat/lng if needed
}

interface RecyclingCenterFormProps {
  initialData: RecyclingCenterData;
}

export default function RecyclingCenterForm({ initialData }: RecyclingCenterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: {
        name: initialData.name ?? '',
        address: initialData.address ?? '',
        city: initialData.city ?? '',
        state: initialData.state ?? '',
        postal_code: initialData.postal_code ?? '',
        phone_number: initialData.phone_number ?? '',
        website: initialData.website ?? '', // Keep empty string as empty string
        opening_hours: initialData.opening_hours ?? '',
        description: initialData.description ?? '',
        verification_status: initialData.verification_status ?? 'pending',
    },
  });

  const onSubmit = async (values: CenterFormValues) => {
    setIsSubmitting(true);
    const apiUrl = `/api/admin/recycling-centers/${initialData.id}`;

    // Prepare payload, converting empty string website to null if necessary
    const payload = {
        ...values,
        website: values.website === '' ? null : values.website,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update recycling center');
      }

      toast.success(`Recycling Center updated successfully!`);
      router.push('/admin/recycling-centers'); // Redirect back to the list
      router.refresh(); // Refresh server components

    } catch (error) {
      console.error("Error submitting recycling center form:", error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Center Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Address Fields - consider grouping */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
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
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
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
                  <FormLabel>State / Province</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
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
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        {/* Contact Fields */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} disabled={isSubmitting} />
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
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        {/* Opening Hours */}
        <FormField
          control={form.control}
          name="opening_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Hours</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm" className="resize-y" {...field} value={field.value ?? ''} disabled={isSubmitting} />
              </FormControl>
               <FormDescription>
                    Plain text format. Consider a more structured approach if needed later.
                </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional details about the center..." className="resize-y" {...field} value={field.value ?? ''} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Verification Status */} 
        <FormField
          control={form.control}
          name="verification_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Status</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification status" />
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

        {/* Submit Button */}
        <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="mr-2">
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