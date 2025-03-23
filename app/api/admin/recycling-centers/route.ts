import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import RecyclingCenter from '@/lib/models/RecyclingCenter';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/index';

// Get all recycling centers (admin only, with comprehensive details)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }
    
    await dbConnect();
    
    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const city = searchParams.get('city') || '';
    
    // Build filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (city) {
      filter.city = city;
    }
    
    // Count total centers for pagination
    const total = await RecyclingCenter.countDocuments(filter);
    
    // Fetch centers with owner information
    const centers = await RecyclingCenter.find(filter)
      .populate('ownerId', 'username name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({
      centers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recycling centers:', error);
    return NextResponse.json({ error: 'Failed to fetch recycling centers' }, { status: 500 });
  }
}

// Create a new recycling center (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.address || !data.city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await dbConnect();
    
    // Check for owner if ownerId is provided
    if (data.ownerId) {
      const owner = await User.findById(data.ownerId);
      if (!owner) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
      }
    }
    
    // Create the recycling center
    const center = await RecyclingCenter.create({
      ...data,
      slug: data.slug || generateSlug(data.name),
      status: data.status || 'active'
    });
    
    return NextResponse.json({
      success: true,
      center
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recycling center:', error);
    return NextResponse.json({ error: 'Failed to create recycling center' }, { status: 500 });
  }
}

// Helper function to generate a slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
} 