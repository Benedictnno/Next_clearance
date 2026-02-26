import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find NYSC info for this student
    const nyscInfo: any = await prisma.nYSCInfo.findUnique({
      where: { studentId: user.student.id }
    });

    if (!nyscInfo) {
      return NextResponse.json({ success: false, data: null });
    }

    return NextResponse.json({
      success: true,
      data: nyscInfo
    });
  } catch (error: any) {
    console.error('Error fetching NYSC info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NYSC info', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      faculty,
      department,
      courseOfStudy,
      matricNumber,
      jambRegNo,
      sex,
      dateOfBirth,
      maritalStatus,
      stateOfOrigin,
      lgaOfOrigin,
      dateOfGraduation,
      phoneNumber,
      email
    } = body;

    // Upsert NYSC info
    const nyscInfo = await prisma.nYSCInfo.upsert({
      where: { studentId: user.student.id },
      create: {
        studentId: user.student.id,
        name,
        faculty,
        department,
        courseOfStudy,
        matricNumber,
        jambRegNo,
        sex,
        dateOfBirthDay: String(dateOfBirth.day),
        dateOfBirthMonth: String(dateOfBirth.month),
        dateOfBirthYear: String(dateOfBirth.year),
        maritalStatus,
        stateOfOrigin,
        lgaOfOrigin,
        dateOfGraduation,
        phoneNumber,
        email
      },
      update: {
        name,
        faculty,
        department,
        courseOfStudy,
        matricNumber,
        jambRegNo,
        sex,
        dateOfBirthDay: String(dateOfBirth.day),
        dateOfBirthMonth: String(dateOfBirth.month),
        dateOfBirthYear: String(dateOfBirth.year),
        maritalStatus,
        stateOfOrigin,
        lgaOfOrigin,
        dateOfGraduation,
        phoneNumber,
        email
      }
    });

    return NextResponse.json({
      success: true,
      data: nyscInfo
    });
  } catch (error: any) {
    console.error('Error saving NYSC info:', error);
    return NextResponse.json(
      { error: 'Failed to save NYSC info', message: error.message },
      { status: 500 }
    );
  }
}
