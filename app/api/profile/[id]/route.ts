import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Remove Mongoose/MongoDB imports
// import dbConnect from '@/lib/db/connection';
// import User from '@/lib/models/User'; 
import { prisma } from '@/lib/db/prisma'; // Import Prisma client
import { z } from 'zod';

// For updating user profile
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    const userId = params.id;
    
    // Check authorization (using NextAuth session data)
    if (session.user.id !== userId && !session.user.isAdmin) { // Use isAdmin from session
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten dieses Profils' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate update data (Only fields present in Prisma User model)
    const updateSchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      image: z.string().url().optional().nullable(), // Added image based on Prisma schema
      // Add other fields from Prisma User model if needed
    });
    
    const validatedData = updateSchema.parse(body);
    
    // Remove dbConnect call
    // await dbConnect();
    
    // Update user profile using Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      // Prisma returns the updated user by default
      // Exclude password hash (Prisma usually does this unless selected)
    });
    
    if (!updatedUser) {
      // This case is less likely with Prisma update unless ID is wrong
      // and findUnique before update might be better if needed.
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Return updated user data (excluding sensitive fields like password)
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      isAdmin: updatedUser.isAdmin,
      emailVerified: updatedUser.emailVerified,
      // Add other relevant fields from updatedUser
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      );
    }
    // Handle Prisma errors specifically if needed
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// For deleting user account
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    const userId = params.id;
    
    // Check authorization (using NextAuth session data)
    if (session.user.id !== userId && !session.user.isAdmin) { // Use isAdmin from session
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen dieses Kontos' },
        { status: 403 }
      );
    }
    
    // Remove dbConnect call
    // await dbConnect();
    
    // Optional: Check if user exists before deleting (Prisma delete throws if not found)
    // const user = await prisma.user.findUnique({ where: { id: userId } });
    // if (!user) {
    //   return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    // }
    
    // Delete user account using Prisma
    // Note: Related data (listings, centers, sessions, accounts) 
    // should be handled by cascade deletes defined in prisma.schema
    await prisma.user.delete({ 
        where: { id: userId } 
    });
      
    // The Mongoose-based cascading delete logic below is removed 
    // as Prisma cascade deletes should handle it.
    // Verify cascade delete rules in prisma.schema if issues arise.

    return NextResponse.json(
      { message: 'Konto erfolgreich gelöscht' },
      { status: 200 }
    );

  } catch (error) {
    // Handle Prisma errors specifically (e.g., P2025 for record not found if not checked)
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist beim Löschen des Kontos aufgetreten' },
      { status: 500 }
    );
  }
} 