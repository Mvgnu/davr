import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import User from '@/lib/models/User';
import { hash } from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, password, terms } = body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name, email and password are required' 
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email format' 
      }, { status: 400 });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }
    
    // Validate terms acceptance
    if (!terms) {
      return NextResponse.json({ 
        success: false, 
        message: 'You must accept the terms and conditions' 
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Ein Benutzer mit dieser E-Mail existiert bereits' 
      }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Return success without sensitive data
    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error during registration. Please try again.' 
    }, { status: 500 });
  }
} 