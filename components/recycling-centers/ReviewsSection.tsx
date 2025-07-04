'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/lib/hooks/useToast';
import { Loader2, Star, MessageSquare, Send, AlertTriangle, ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils/dateUtils'; // Assuming this utility exists
import StarRating from '@/components/ui/StarRating';
import InteractiveStarRating from '@/components/ui/InteractiveStarRating';
import PaginationControls from '@/components/ui/PaginationControls';
import { usePathname } from 'next/navigation';

// Types (align with API responses)
interface ReviewSummary {
    totalReviews: number;
    averageRating: number | null;
}

interface ReviewUser {
    id: string;
    name: string | null;
    image: string | null;
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    user: ReviewUser;
}

interface ReviewsPagination {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    limit: number;
}

interface ReviewsSectionProps {
    centerSlug: string;
    centerName: string; // Pass name for context
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ centerSlug, centerName }) => {
    const { data: session, status: sessionStatus } = useSession();
    const { toast } = useToast();
    const pathname = usePathname();

    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [pagination, setPagination] = useState<ReviewsPagination | null>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // --- State for review submission form ---
    const [userRating, setUserRating] = useState<number>(0);
    const [userComment, setUserComment] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const fetchSummary = useCallback(async () => {
        setIsLoadingSummary(true);
        try {
            const response = await fetch(`/api/recycling-centers/${centerSlug}/reviews/summary`);
            if (!response.ok) throw new Error('Failed to load summary');
            const result = await response.json();
            if (result.success) {
                setSummary(result.data);
            } else {
                throw new Error(result.error || 'Failed to load summary');
            }
        } catch (err: any) {
            console.error("Error fetching review summary:", err);
            setError('Bewertungszusammenfassung konnte nicht geladen werden.'); // Set specific error
        } finally {
            setIsLoadingSummary(false);
        }
    }, [centerSlug]);

    const fetchReviews = useCallback(async (page = 1) => {
        setIsLoadingReviews(true);
        setError(null); // Clear previous errors
        try {
            const response = await fetch(`/api/recycling-centers/${centerSlug}/reviews?page=${page}&limit=5`);
            if (!response.ok) throw new Error('Failed to load reviews');
            const result = await response.json();
            if (result.success) {
                setReviews(result.data);
                setPagination(result.pagination);
            } else {
                throw new Error(result.error || 'Failed to load reviews');
            }
        } catch (err: any) {
            console.error("Error fetching reviews:", err);
            setError('Bewertungen konnten nicht geladen werden.'); // Set specific error
        } finally {
            setIsLoadingReviews(false);
        }
    }, [centerSlug]);

    // Initial data fetch
    useEffect(() => {
        fetchSummary();
        fetchReviews(1);
    }, [fetchSummary, fetchReviews]);

    // --- Handlers for submission form --- 
    const handleRatingChange = (newRating: number) => {
        setUserRating(newRating);
        if (submitError) setSubmitError(null); // Clear error when user interacts
    };

    const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserComment(event.target.value);
        if (submitError) setSubmitError(null); // Clear error when user interacts
    };

    const handleSubmitReview = async (event: React.FormEvent) => {
        event.preventDefault();
        if (userRating === 0) {
            setSubmitError('Bitte wählen Sie eine Sternebewertung (1-5).');
            return;
        }
        setSubmitError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/recycling-centers/${centerSlug}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: userRating, comment: userComment || null }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Bewertung konnte nicht übermittelt werden.');
            }

            toast({ title: 'Danke!', description: 'Ihre Bewertung wurde erfolgreich übermittelt.' });
            // Reset form, update state, refetch reviews/summary
            setUserRating(0);
            setUserComment('');
            setHasSubmitted(true); // Indicate successful submission
            fetchSummary(); // Refresh summary
            fetchReviews(1); // Refresh reviews list (go back to page 1)

        } catch (err: any) {
            console.error("Error submitting review:", err);
            setSubmitError(err.message || 'Ein unerwarteter Fehler ist aufgetreten.');
            toast({ title: 'Fehler', description: err.message || 'Bewertung konnte nicht übermittelt werden.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Handle Pagination --- 
    const handlePageChange = (newPage: number) => {
        fetchReviews(newPage);
    };

    return (
        <div 
            className="mt-10 pt-8 border-t border-border/60 animate-fade-in-up opacity-0 [--animation-delay:400ms]"
            style={{ animationFillMode: 'forwards' }}
            id="reviews" // Add ID for potential deep linking
        >
            <h2 className="text-2xl font-semibold mb-6 flex items-center text-foreground">
                <MessageSquare className="w-6 h-6 mr-2.5 text-accent" /> Bewertungen & Kommentare
            </h2>

            {/* Display Summary */}
            {isLoadingSummary ? (
                <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground"/></div>
            ) : summary ? (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border/80 flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                        <StarRating rating={summary.averageRating} size={20} />
                        {summary.averageRating !== null && (
                            <span className="font-semibold text-lg text-foreground">{summary.averageRating.toFixed(1)}</span>
                        )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                        Basierend auf {summary.totalReviews} Bewertung{summary.totalReviews !== 1 ? 'en' : ''}
                    </span>
                </div>
            ) : null}

            {/* Review Submission Form for logged-in users */}
            {sessionStatus === 'authenticated' && !hasSubmitted && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-5 border rounded-lg bg-card shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Bewertung abgeben für {centerName}</h3>
                    <div className="space-y-4">
                        <div>
                            <Label className="block mb-2 font-medium">Ihre Bewertung (1-5 Sterne)</Label>
                             <InteractiveStarRating 
                                currentRating={userRating} 
                                onRatingChange={handleRatingChange} 
                                size={24} // Make stars larger for input
                             />
                        </div>
                        <div>
                            <Label htmlFor="review-comment" className="font-medium">Ihr Kommentar (Optional)</Label>
                            <Textarea 
                                id="review-comment"
                                value={userComment}
                                onChange={handleCommentChange}
                                placeholder="Teilen Sie Ihre Erfahrungen..."
                                rows={4}
                                className="mt-1.5 transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                                maxLength={1000}
                            />
                            <p className="text-xs text-muted-foreground mt-1">{userComment.length} / 1000 Zeichen</p>
                        </div>
                         {submitError && (
                             <p className="text-sm text-destructive">{submitError}</p>
                         )}
                         <Button type="submit" disabled={isSubmitting || userRating === 0}>
                             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                             {isSubmitting ? 'Wird gesendet...' : 'Bewertung absenden'}
                         </Button>
                    </div>
                </form>
            )}
            {/* Show thank you message after submission */} 
            {sessionStatus === 'authenticated' && hasSubmitted && (
                 <div className="mb-8 p-5 border rounded-lg bg-green-50 border-green-200 text-green-800 flex items-center gap-3">
                     <ThumbsUp className="w-6 h-6 flex-shrink-0" />
                      <div>
                         <h3 className="text-lg font-semibold">Vielen Dank!</h3>
                         <p className="text-sm">Ihre Bewertung wurde erfolgreich übermittelt.</p>
                     </div>
                 </div>
             )}
            {sessionStatus === 'unauthenticated' && (
                <div className="mb-8 p-4 border rounded-md bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">Sie müssen <a href={`/login?callbackUrl=${window.location.pathname}#reviews`} className="text-primary underline">angemeldet</a> sein, um eine Bewertung abzugeben.</p>
                </div>
            )}

            {/* Reviews List & Pagination */} 
            <h3 className="text-xl font-semibold mb-4">Alle Bewertungen ({summary?.totalReviews ?? '?'})</h3>
            
            {error && (
                 <div className="text-center py-10 text-destructive">
                    <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                    <p>{error}</p>
                </div>
            )}

            {isLoadingReviews ? (
                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground"/></div>
            ) : reviews.length > 0 ? (
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review.id} className="flex items-start space-x-4 pb-6 border-b border-border/60 last:border-b-0">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={review.user.image || undefined} alt={review.user.name || 'User'} />
                                <AvatarFallback>{(review.user.name || '?').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-foreground">{review.user.name || 'Anonym'}</span>
                                    <div className="flex items-center gap-3">
                                        <StarRating rating={review.rating} size={14} />
                                        <span className="text-xs text-muted-foreground pt-px">{formatDate(new Date(review.created_at))}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-foreground/90">{review.comment || <span className="italic text-muted-foreground">Kein Kommentar</span>}</p>
                            </div>
                        </div>
                    ))}
                    {/* Add Pagination Controls */} 
                     {pagination && pagination.totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <PaginationControls 
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                baseUrl={pathname} // Use current path as base
                                // Note: PaginationControls handles searchParams internally
                            />
                         </div>
                    )}
                </div>
            ) : (
                !error && <p className="text-center py-10 text-muted-foreground">Noch keine Bewertungen vorhanden.</p>
            )}

        </div>
    );
};

export default ReviewsSection; 