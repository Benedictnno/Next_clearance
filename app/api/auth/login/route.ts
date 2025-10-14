import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser, createSession } from '@/lib/auth';

// Define validation schema for login
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;
    
    // Authenticate user
    const session = await authenticateUser(email, password);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session
    await createSession(session);
    
    // Return user info (excluding sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        role: session.role,
        name: session.name,
        email: session.email
      }
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed', message: error.message },
      { status: 500 }
    );
  }
}