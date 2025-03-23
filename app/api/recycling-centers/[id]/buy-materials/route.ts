import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import RecyclingCenter from '@/lib/models/RecyclingCenter';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/index';

/**
 * Handler for GET request to fetch buying materials for a recycling center
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const center = await RecyclingCenter.findById(params.id);
    
    if (!center) {
      return NextResponse.json({ error: 'Recycling center not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      buyMaterials: center.buyMaterials || [] 
    });
  } catch (error) {
    console.error('Error fetching buying materials:', error);
    return NextResponse.json({ error: 'Failed to fetch buying materials' }, { status: 500 });
  }
}

/**
 * Handler for POST request to update buying materials for a recycling center
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Find center and verify ownership
    const center = await RecyclingCenter.findById(params.id);
    
    if (!center) {
      return NextResponse.json({ error: 'Recycling center not found' }, { status: 404 });
    }
    
    // Check if user is center owner or admin
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const isOwner = center.ownerId && center.ownerId.toString() === user._id?.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Only center owners can update buying materials' }, { status: 403 });
    }
    
    // Get new buy materials from request
    const data = await request.json();
    const { buyMaterials } = data;
    
    if (!Array.isArray(buyMaterials)) {
      return NextResponse.json({ error: 'Invalid input format for buyMaterials' }, { status: 400 });
    }
    
    // Validate buyMaterials format
    for (const material of buyMaterials) {
      if (!material.materialId || typeof material.pricePerKg !== 'number' || material.pricePerKg < 0) {
        return NextResponse.json({ 
          error: 'Invalid material format. Each material must have materialId and valid pricePerKg' 
        }, { status: 400 });
      }
    }
    
    // Update center
    center.buyMaterials = buyMaterials;
    await center.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Buy materials updated successfully',
      buyMaterials: center.buyMaterials 
    });
  } catch (error) {
    console.error('Error updating buying materials:', error);
    return NextResponse.json({ error: 'Failed to update buying materials' }, { status: 500 });
  }
}

/**
 * Handler for DELETE request to remove all buying materials
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Find center and verify ownership
    const center = await RecyclingCenter.findById(params.id);
    
    if (!center) {
      return NextResponse.json({ error: 'Recycling center not found' }, { status: 404 });
    }
    
    // Check if user is center owner or admin
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const isOwner = center.ownerId && center.ownerId.toString() === user._id?.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Only center owners can remove buying materials' }, { status: 403 });
    }
    
    // Clear buy materials
    center.buyMaterials = [];
    await center.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'All buying materials removed'
    });
  } catch (error) {
    console.error('Error removing buying materials:', error);
    return NextResponse.json({ error: 'Failed to remove buying materials' }, { status: 500 });
  }
} 