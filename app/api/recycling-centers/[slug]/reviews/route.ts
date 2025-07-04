import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/index';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

// Zod schema for validating the review input
const reviewSchema = z.object({
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional().nullable(),
});

// --- Recalculate Average Rating --- 
/**
 * Recalculates the average rating for a recycling center based on all reviews
 * @param centerId The ID of the recycling center
 */
async function recalculateAverageRating(centerId: string): Promise<void> {
  try {
    // Get all ratings for the center
    const reviews = await prisma.review.findMany({
      where: { 
        centerId: centerId 
      },
      select: { 
        rating: true 
      }
    });

    if (reviews.length === 0) {
      // If no reviews, just log this information - we don't have average_rating field
      console.log(`No reviews for recycling center ${centerId}`);
      return;
    }

    // Calculate the average rating
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = parseFloat((sum / reviews.length).toFixed(1)); // Round to 1 decimal place

    // Log the average rating instead of updating (since we don't have this field)
    console.log(`Average rating for recycling center ${centerId}: ${average} (from ${reviews.length} reviews)`);
    
    // Note: We're not updating the database since the schema doesn't have these fields
    // Consider adding these fields to the schema if this data is needed
  } catch (error) {
    console.error('Error calculating average rating:', error);
    // Don't throw - allow the review creation to complete even if this fails
  }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    // 1. Check Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const slug = params.slug;

    if (!slug) {
        return NextResponse.json({ error: 'Recycling Center slug is required' }, { status: 400 });
    }

    try {
        // +++ Find Center by Slug +++
        const center = await prisma.recyclingCenter.findUnique({
            where: { slug: slug },
            select: { id: true } // Select only the ID
        });

        if (!center) {
            return NextResponse.json({ error: 'Recycling Center not found' }, { status: 404 });
        }
        const centerId = center.id; // Use the fetched ID

        // 2. Validate Request Body
        const body = await request.json();
        const validation = reviewSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input data', details: validation.error.errors },
                { status: 400 }
            );
        }
        const { rating, comment } = validation.data;

        // Check if the user has already reviewed this center using the named unique constraint
        const existingReview = await prisma.review.findUnique({
            where: {
                UserCenterReview: {
                    userId: userId,
                    centerId: centerId
                }
            },
        });

        if (existingReview) {
            return NextResponse.json(
                { error: "You have already reviewed this recycling center." },
                { status: 409 } // Conflict
            );
        }

        // Create the new review using camelCase fields for relations
        const newReview = await prisma.review.create({
            data: {
                rating: rating,
                comment: comment,
                userId: userId,   // Pass the ID directly
                centerId: centerId, // Pass the ID directly
            },
            include: { // Include user data in the response (use camelCase relation name)
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                }
            }
        });

        // --- Recalculate average rating (simplified example) ---
        // TODO: Implement recalculateAverageRating function later
        // await recalculateAverageRating(centerId);
        // ---

        return NextResponse.json(newReview, { status: 201 });

    } catch (error: any) {
        console.error(`[POST Review Error - Center Slug: ${slug}]`, error);
        // Handle potential unique constraint errors if upsert wasn't used or failed
        if (error.code === 'P2002') { 
             return NextResponse.json({ error: 'You have already reviewed this center.' }, { status: 409 }); // Conflict
        }
        return NextResponse.json(
            { success: false, error: 'Failed to submit review', details: error.message },
            { status: 500 }
        );
    }
}

// GET handler to retrieve reviews for a specific center
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    if (!slug) {
        return NextResponse.json({ error: 'Recycling Center slug is required' }, { status: 400 });
    }

    try {
        // +++ Find Center by Slug +++
        const center = await prisma.recyclingCenter.findUnique({
            where: { slug: slug },
            select: { id: true } // Select only the ID
        });

        if (!center) {
            return NextResponse.json({ error: 'Recycling Center not found' }, { status: 404 });
        }
        const centerId = center.id; // Use the fetched ID

        // Fetch reviews with pagination and include user data
        const [reviews, totalReviews] = await Promise.all([
            prisma.review.findMany({
                where: { 
                    centerId: centerId // Use camelCase field name for filtering
                },
                include: { 
                    user: true // Use camelCase relation name
                },
                orderBy: { created_at: "desc" }, // Keep DB column name for sorting
                skip: skip,
                take: limit,
            }),
            prisma.review.count({
                where: { 
                    centerId: centerId // Use camelCase field name for filtering
                },
            })
        ]);

        const totalPages = Math.ceil(totalReviews / limit);

        return NextResponse.json({
            success: true,
            data: reviews,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalReviews: totalReviews,
                limit: limit
            }
        });

    } catch (error: any) {
        console.error(`[GET Reviews Error - Center Slug: ${slug}]`, error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reviews', details: error.message },
            { status: 500 }
        );
    }
} 