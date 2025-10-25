import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import {
  registerUserSchema,
  validateRequest,
  formatValidationErrors,
} from '@/lib/api/validation';
import { authRateLimiter, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { requireCsrfToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrfValidation = await requireCsrfToken(request);

  if (!csrfValidation.success) {
    return NextResponse.json(
      {
        error: 'CSRF_TOKEN_INVALID',
        message: 'CSRF-Token-Validierung fehlgeschlagen. Bitte laden Sie die Seite neu.',
      },
      { status: csrfValidation.status }
    );
  }

  // Apply rate limiting
  const identifier = getClientIdentifier(request);
  const { success, limit, remaining, reset } = await authRateLimiter.limit(identifier);

  // Add rate limit headers to response
  const headers = getRateLimitHeaders({ limit, remaining, reset });

  if (!success) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Zu viele Registrierungsversuche. Bitte versuchen Sie es später erneut.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers,
      }
    );
  }

  try {
    const rawData = await request.json();

    // Validate request data with Zod
    const validation = validateRequest(registerUserSchema, rawData);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Ungültige Eingabedaten',
          details: formatValidationErrors(validation.error),
        },
        {
          status: 400,
          headers,
        }
      );
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'USER_EXISTS',
          message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits',
        },
        {
          status: 409,
          headers,
        }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    // Return success response (excluding password)
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        message: 'Benutzer erfolgreich registriert',
        user: userWithoutPassword,
      },
      {
        status: 201,
        headers,
      }
    );
  } catch (error) {
    console.error('[Registration POST Error]', error);

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            error: 'DUPLICATE_ERROR',
            message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits',
          },
          {
            status: 409,
            headers,
          }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: 'Ein interner Serverfehler ist während der Registrierung aufgetreten',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      {
        status: 500,
        headers,
      }
    );
  }
}
