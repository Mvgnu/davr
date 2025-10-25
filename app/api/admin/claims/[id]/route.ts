import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/permissions';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_more_info']),
  adminResponse: z.string().min(1, 'Admin response is required'),
  rejectionReason: z.string().optional(),
});

async function generatePassword(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole('ADMIN');
    const claimId = params.id;

    const body = await request.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { action, adminResponse, rejectionReason } = validation.data;

    // Fetch the claim
    const claim = await prisma.recyclingCenterClaim.findUnique({
      where: { id: claimId },
      include: {
        recyclingCenter: true,
        user: true,
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: 'Claim has already been reviewed' },
        { status: 400 }
      );
    }

    let updatedClaim;
    let accountDetails = null;

    if (action === 'approve') {
      // Check if center is still unmanaged
      if (claim.recyclingCenter.managedById) {
        return NextResponse.json(
          { error: 'This center is already managed' },
          { status: 400 }
        );
      }

      // Handle user account creation if no user exists
      let userId = claim.user_id;

      if (!userId) {
        // Check if user with this email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: claim.email },
        });

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create new user account
          const tempPassword = await generatePassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          const newUser = await prisma.user.create({
            data: {
              email: claim.email,
              name: claim.name,
              password: hashedPassword,
              role: 'CENTER_OWNER',
              emailVerified: new Date(),
            },
          });

          userId = newUser.id;
          accountDetails = {
            email: claim.email,
            temporaryPassword: tempPassword,
            accountCreated: true,
          };
        }
      } else {
        // Update existing user role to CENTER_OWNER if not already
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'CENTER_OWNER' },
        });
      }

      // Update claim and assign center to user
      updatedClaim = await prisma.recyclingCenterClaim.update({
        where: { id: claimId },
        data: {
          status: 'approved',
          admin_response: adminResponse,
          reviewed_by_id: user.id,
          reviewed_at: new Date(),
          user_id: userId,
          account_created: accountDetails !== null,
        },
      });

      // Assign center to user
      await prisma.recyclingCenter.update({
        where: { id: claim.recycling_center_id },
        data: {
          managedById: userId,
          verification_status: 'VERIFIED',
        },
      });

      // TODO: Send approval email with account details if created
    } else if (action === 'reject') {
      updatedClaim = await prisma.recyclingCenterClaim.update({
        where: { id: claimId },
        data: {
          status: 'rejected',
          rejection_reason: rejectionReason,
          admin_response: adminResponse,
          reviewed_by_id: user.id,
          reviewed_at: new Date(),
        },
      });

      // TODO: Send rejection email
    } else {
      // request_more_info
      updatedClaim = await prisma.recyclingCenterClaim.update({
        where: { id: claimId },
        data: {
          status: 'more_info_requested',
          admin_response: adminResponse,
          reviewed_by_id: user.id,
          reviewed_at: new Date(),
        },
      });

      // TODO: Send email requesting more information
    }

    return NextResponse.json({
      success: true,
      data: updatedClaim,
      accountDetails,
    });
  } catch (error) {
    console.error('[Admin Claim Review Error]', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(
      {
        error: 'Failed to review claim',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
