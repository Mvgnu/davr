'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Shadcn Select
import { Loader2, AlertTriangle, PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Type for material fetched for the dropdown
type MaterialOption = {
    id: string;
    name: string;
};

// Zod schema for form validation
const addOfferSchema = z.object({
    materialId: z.string().cuid('Please select a material'),
    pricePerUnit: z.preprocess(
        (val) => (val === "" ? null : Number(val)), // Convert empty string to null, otherwise to number
        z.number().positive('Price must be positive').optional().nullable()
    ),
    unit: z.string().max(20).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
});

type AddOfferFormInputs = z.infer<typeof addOfferSchema>;

interface AddOfferFormProps {
    centerSlug: string; // Slug of the center to add the offer to
    currentOfferMaterialIds: string[]; // IDs of materials already offered, to disable them
    onOfferAdded: (newOffer: any) => void; // Callback with the newly added offer data
}

export function AddOfferForm({ centerSlug, currentOfferMaterialIds, onOfferAdded }: AddOfferFormProps) {
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<AddOfferFormInputs>({
        resolver: zodResolver(addOfferSchema),
        defaultValues: {
            materialId: '',
            pricePerUnit: null,
            unit: '',
            notes: '',
        }
    });

    // Fetch materials for dropdown
    useEffect(() => {
        async function fetchMaterials() {
            setIsLoadingMaterials(true);
            try {
                const response = await fetch('/api/materials'); // Assuming this endpoint exists
                if (!response.ok) throw new Error('Failed to load materials');
                const data = await response.json();
                // Assuming API returns { success: true, data: Material[] }
                if (data.success) {
                    setMaterials(data.data.map((m: any) => ({ id: m.id, name: m.name }))); // Adapt based on actual API response
                } else {
                    throw new Error(data.error || 'Failed to load materials');
                }
            } catch (error) {
                console.error("Failed to fetch materials:", error);
                toast.error("Materialliste konnte nicht geladen werden.");
            } finally {
                setIsLoadingMaterials(false);
            }
        }
        fetchMaterials();
    }, []);

    const onSubmit = async (data: AddOfferFormInputs) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const apiUrl = `/api/centers/${centerSlug}/offers`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add offer');
            }

            toast.success(`Angebot für "${result.data?.material?.name ?? 'Material'}" hinzugefügt.`);
            form.reset(); // Clear form
            onOfferAdded(result.data); // Pass new offer back to parent

        } catch (err: any) {
            console.error("Add offer error:", err);
            setSubmitError(err.message || 'An unexpected error occurred.');
            toast.error(err.message || 'Failed to add offer', { duration: 4000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 border rounded bg-background shadow-sm space-y-4">
                 {submitError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-center text-sm">
                         <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                         {submitError}
                     </div>
                 )}
                 
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {/* Material Select */}
                    <FormField
                        control={form.control}
                        name="materialId"
                        render={({ field }) => (
                            <FormItem className="space-y-1 md:col-span-2 lg:col-span-1">
                                <FormLabel>Material <span className="text-destructive">*</span></FormLabel>
                                <Select 
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isLoadingMaterials || isSubmitting}
                                >
                                    <FormControl>
                                        <SelectTrigger id="materialId">
                                            <SelectValue placeholder={isLoadingMaterials ? "Lade Materialien..." : "Material auswählen"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {materials.map((mat) => (
                                            <SelectItem 
                                                key={mat.id} 
                                                value={mat.id}
                                                disabled={currentOfferMaterialIds.includes(mat.id)} // Disable if already offered
                                            >
                                                {mat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Price Input */}
                    <FormField
                        control={form.control}
                        name="pricePerUnit"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>Preis pro Einheit (Optional)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="z.B. 0.50" 
                                        disabled={isSubmitting}
                                        {...field}
                                        value={field.value === null ? '' : field.value}
                                        onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Unit Input */}
                    <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>Einheit (Optional)</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="z.B. kg, Stück" 
                                        disabled={isSubmitting}
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                     {/* Add Button (aligned with inputs) */}
                     <div className="space-y-1 pt-[25px]"> {/* Adjust top padding for alignment */}
                         <Button type="submit" disabled={isSubmitting || isLoadingMaterials} className="w-full md:w-auto">
                             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4"/>}
                             Hinzufügen
                         </Button>
                     </div>
                </div>
                
                 {/* Notes Textarea (spans full width below) */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem className="space-y-1 pt-2">
                            <FormLabel>Hinweise (Optional)</FormLabel>
                            <FormControl>
                                <Textarea 
                                    rows={2} 
                                    maxLength={500}
                                    disabled={isSubmitting}
                                    placeholder="Zusätzliche Informationen zum Angebot..."
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
} 