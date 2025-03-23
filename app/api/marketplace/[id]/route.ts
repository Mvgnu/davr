import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import MarketplaceListing from '@/lib/models/MarketplaceListing';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/index';

// Get a specific marketplace listing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const listing = await MarketplaceListing.findById(params.id)
      .populate('userId', 'username name email');
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Error fetching marketplace listing:', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

// Update a marketplace listing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Find the listing
    const listing = await MarketplaceListing.findById(params.id);
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    // Check if user is owner or admin
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Safely convert IDs to strings for comparison
    const userId = user._id ? user._id.toString() : '';
    const listingUserId = listing.userId ? listing.userId.toString() : '';
    
    const isOwner = listingUserId === userId;
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'You are not authorized to update this listing' }, { status: 403 });
    }
    
    // Get update data
    const updateData = await request.json();
    
    // Update listing
    const updatedListing = await MarketplaceListing.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Error updating marketplace listing:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

// Delete a marketplace listing
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
    
    // Find the listing
    const listing = await MarketplaceListing.findById(params.id);
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    // Check if user is owner or admin
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Safely convert IDs to strings for comparison
    const userId = user._id ? user._id.toString() : '';
    const listingUserId = listing.userId ? listing.userId.toString() : '';
    
    const isOwner = listingUserId === userId;
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'You are not authorized to delete this listing' }, { status: 403 });
    }
    
    // Delete the listing
    await MarketplaceListing.findByIdAndDelete(params.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Listing deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting marketplace listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
} 