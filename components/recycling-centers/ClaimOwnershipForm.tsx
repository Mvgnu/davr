'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as DialogPrimitive from '@radix-ui/react-dialog';

// Zod schema for form validation (matches API schema but without centerId)
const claimFormSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    businessRole: z.string().optional(),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

type ClaimFormInputs = z.infer<typeof claimFormSchema>;

interface ClaimOwnershipFormProps {
    centerId: string;
    centerName: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onClaimSubmitted?: () => void; // Optional callback after successful submission
}

export function ClaimOwnershipForm({
    centerId,
    centerName,
    isOpen,
    onOpenChange,
    onClaimSubmitted,
}: ClaimOwnershipFormProps) {
    const { data: session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { 
        register, 
        handleSubmit, 
        reset, 
        formState: { errors }
    } = useForm<ClaimFormInputs>({
        resolver: zodResolver(claimFormSchema),
        defaultValues: {
            name: session?.user?.name || '',
            email: session?.user?.email || '',
            phone: '',
            companyName: '',
            businessRole: '',
            message: '',
        }
    });

    const onSubmit: SubmitHandler<ClaimFormInputs> = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, recyclingCenterId: centerId }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit claim');
            }

            toast.success('Claim submitted successfully! You will be notified once it is reviewed.');
            reset(); // Clear form
            onOpenChange(false); // Close dialog
            if (onClaimSubmitted) onClaimSubmitted(); // Optional callback

        } catch (err: any) {
            console.error("Claim submission error:", err);
            setSubmitError(err.message || 'An unexpected error occurred.');
            toast.error(err.message || 'Failed to submit claim', { duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset error when dialog closes/opens or form changes
    React.useEffect(() => {
        setSubmitError(null);
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Claim Ownership of "{centerName}"</DialogTitle>
                    <DialogDescription>
                        Fill out this form to request ownership. Your claim will be reviewed by an administrator.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {submitError && (
                        <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-center text-sm">
                             <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                             {submitError}
                         </div>
                     )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="name">Your Name <span className="text-destructive">*</span></Label>
                            <Input id="name" {...register('name')} disabled={isSubmitting} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email">Your Email <span className="text-destructive">*</span></Label>
                            <Input id="email" type="email" {...register('email')} disabled={isSubmitting} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="phone">Phone (Optional)</Label>
                            <Input id="phone" type="tel" {...register('phone')} disabled={isSubmitting} />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="companyName">Company (Optional)</Label>
                            <Input id="companyName" {...register('companyName')} disabled={isSubmitting} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="businessRole">Your Role/Position (Optional)</Label>
                        <Input id="businessRole" {...register('businessRole')} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                        <Textarea 
                            id="message" 
                            {...register('message')} 
                            rows={4} 
                            maxLength={1000}
                            disabled={isSubmitting}
                            placeholder="Briefly explain why you are claiming this listing (e.g., I am the owner/manager)..."
                        />
                        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                    </div>
                    <DialogFooter>
                        <DialogPrimitive.Close asChild>
                            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                        </DialogPrimitive.Close>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Claim
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 