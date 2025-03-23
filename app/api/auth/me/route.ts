import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import dbConnect from '@/lib/db/connection';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated' 
      }, { status: 401 });
    }
    
    await dbConnect();
    
    // Find the user without returning the password
    const user = await User.findOne({ email: session.user.email })
      .select('-password')
      .lean();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }
    
    // Format user data for client
    const userData = {
      id: user._id ? user._id.toString() : '',
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      profileImage: user.profileImage || null,
      bio: user.bio || '',
      recyclingCenterIds: user.recyclingCenterIds || [],
      savedListings: user.savedListings || [],
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
    };
    
    return NextResponse.json({ 
      success: true, 
      user: userData 
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while fetching your profile' 
    }, { status: 500 });
  }
} 