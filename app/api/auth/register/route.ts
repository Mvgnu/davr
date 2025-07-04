import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma'; // Assuming @ alias
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // --- Input Validation --- 
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // --- Check Existing User --- 
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // --- Hash Password --- 
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // --- Create User --- 
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name || null, // Store name or null if not provided
      },
    });

    // --- Return Success Response (excluding password) --- 
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(
      { 
        message: 'User registered successfully', 
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Registration POST Error]', error);
    return NextResponse.json({ error: 'An internal server error occurred during registration.' }, { status: 500 });
  }
} 