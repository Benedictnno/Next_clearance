import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {prisma}  from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  console.log('User from getCurrentUser:', user);
  
  if (!user?.student) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if this is a virtual user (from external token)
  if (user.student.userId && !user.student.departmentId) {
    console.log('Using virtual user data from token');
    
    // Return profile from virtual user data
    const profile = {
      firstName: user.student.firstName,
      lastName: user.student.lastName,
      matricNumber: user.student.matricNumber,
      email: user.email,
      level: user.student.level,
      department: user.student.department,
      faculty: user.student.faculty,
    };
    
    return NextResponse.json({ success: true, data: profile });
  }

  // Otherwise, fetch from database
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      department: true,
      faculty: true,
      user: true,
    },
  });

  if (!student) {
    // If not found in DB, use virtual user data
    const profile = {
      firstName: user.student.firstName,
      lastName: user.student.lastName,
      matricNumber: user.student.matricNumber,
      email: user.email,
      level: user.student.level,
      department: user.student.department,
      faculty: user.student.faculty,
    };
    
    return NextResponse.json({ success: true, data: profile });
  }

  console.log('Student from database:', student);
  const profile = {
    firstName: student.firstName,
    lastName: student.lastName,
    matricNumber: student.matricNumber,
    email: student.user.email,
    level: student.level,
    department: student.department,
    faculty: student.faculty,
  };

  return NextResponse.json({ success: true, data: profile });
}