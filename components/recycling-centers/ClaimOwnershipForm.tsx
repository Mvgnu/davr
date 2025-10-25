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
import { Loader2, AlertTriangle, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
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

interface UploadedDocument {
    url: string;
    filename: string;
    size: number;
    type: string;
}

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
    const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);

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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/claims/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Upload failed');
                }

                const result = await response.json();
                setUploadedDocuments(prev => [...prev, {
                    url: result.url,
                    filename: result.filename,
                    size: result.size,
                    type: result.type,
                }]);
            }
            toast.success('Document(s) uploaded successfully');
        } catch (err: any) {
            console.error('Upload error:', err);
            toast.error(err.message || 'Failed to upload document');
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const removeDocument = (index: number) => {
        setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const onSubmit: SubmitHandler<ClaimFormInputs> = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    recyclingCenterId: centerId,
                    documents: uploadedDocuments.length > 0 ? uploadedDocuments : null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit claim');
            }

            toast.success('Claim submitted successfully! You will be notified once it is reviewed.');
            reset();
            setUploadedDocuments([]);
            onOpenChange(false);
            if (onClaimSubmitted) onClaimSubmitted();

        } catch (err: any) {
            console.error("Claim submission error:", err);
            setSubmitError(err.message || 'An unexpected error occurred.');
            toast.error(err.message || 'Failed to submit claim', { duration: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset error and documents when dialog closes/opens
    React.useEffect(() => {
        setSubmitError(null);
        if (!isOpen) {
            setUploadedDocuments([]);
        }
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

                    <div className="space-y-2">
                        <Label htmlFor="documents">Supporting Documents (Optional)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Upload business license, ID, or other proof of ownership (max 5MB per file, PDF/Images allowed)
                        </p>

                        <div className="flex items-center gap-2">
                            <Input
                                id="documents"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                multiple
                                onChange={handleFileUpload}
                                disabled={isSubmitting || isUploading}
                                className="hidden"
                            />
                            <Label
                                htmlFor="documents"
                                className={`flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
                                    isUploading || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Upload Documents
                                    </>
                                )}
                            </Label>
                        </div>

                        {uploadedDocuments.length > 0 && (
                            <div className="space-y-2 mt-3">
                                {uploadedDocuments.map((doc, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {doc.type.startsWith('image/') ? (
                                                <ImageIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                            ) : (
                                                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                            )}
                                            <span className="truncate">{doc.filename}</span>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                                ({formatFileSize(doc.size)})
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeDocument(index)}
                                            disabled={isSubmitting}
                                            className="h-6 w-6 p-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
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