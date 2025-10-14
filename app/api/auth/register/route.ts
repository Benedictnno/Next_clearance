import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { registerUser } from '@/lib/auth';

// Define validation schema for student registration
const StudentRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  matricNumber: z.string().min(3, 'Valid matric number is required'),
  department: z.string().min(2, 'Department is required'),
  faculty: z.string().min(2, 'Faculty is required'),
  level: z.string().min(2, 'Level is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = StudentRegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = result.data;
    
    // Register the user
    const user = await registerUser({
      email: validatedData.email,
      password: validatedData.password,
      role: 'student',
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      matricNumber: validatedData.matricNumber,
      department: validatedData.department,
      faculty: validatedData.faculty,
      level: validatedData.level,
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Registration successful',
      userId: user.id
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Check for duplicate email error
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }
    
    // Check for duplicate matric number error
    if (error.code === 'P2002' && error.meta?.target?.includes('matricNumber')) {
      return NextResponse.json(
        { error: 'Matric number already registered' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Registration failed', message: error.message },
      { status: 500 }
    );
  }
}