import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { collections } from '@/lib/mongoCollections';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Student Clearance Endpoint ===');
    
    // Check current user
    const user = await getCurrentUser();
    console.log('Current user:', JSON.stringify(user, null, 2));
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }
    
    if (user.role !== 'STUDENT') {
      console.log('User is not a student:', user.role);
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 });
    }
    
    // Check MongoDB connection
    const { students } = await collections();
    console.log('MongoDB connected');
    
    // Find student data
    const student = await students.findOne({ userId: user.id });
    console.log('Student found:', JSON.stringify(student, null, 2));
    
    if (!student) {
      console.log('Student not found for userId:', user.id);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Debug successful',
      user: user,
      student: student
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}