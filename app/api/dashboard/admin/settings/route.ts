import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

// GET handler to fetch platform settings (Admin Only)
export async function GET() {
  try {
    await requireRole('ADMIN');

    // In a real implementation, this would fetch from a settings table
    // For now, we'll return a default settings object
    const settings = {
      siteName: 'DAVR Platform',
      siteDescription: 'Aluminium Recycling Deutschland',
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      contactEmail: 'support@davr.de',
      contactPhone: '+49-30-000000',
      maintenanceMode: false,
      analyticsEnabled: true,
      emailNotifications: true,
      maxUploadSize: 5242880, // 5MB in bytes
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
      socialMedia: {
        facebook: 'https://facebook.com/davr',
        twitter: 'https://twitter.com/davr',
        linkedin: 'https://linkedin.com/company/davr',
        instagram: 'https://instagram.com/davr',
      },
      privacySettings: {
        gdprCompliant: true,
        cookieConsent: true,
        dataRetentionDays: 365,
      },
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error('[GET Dashboard Admin Settings Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST handler to update platform settings (Admin Only)
export async function POST(request: Request) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    
    // In a real implementation, this would update a settings table
    // For now, we'll just validate and return the updated settings
    // In a production environment, you would have a dedicated Settings model in Prisma
    
    // For now, return the provided settings
    return NextResponse.json({ 
      success: true, 
      data: body 
    });
  } catch (error) {
    console.error('[POST Dashboard Admin Settings Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}