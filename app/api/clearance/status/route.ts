import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    console.log(user);
    
    if (!user?.student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clearanceRequest = await prisma.clearanceRequest.findFirst({
      where: {
        studentId: user.student.id,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        steps: {
          where: { isDeleted: false },
          orderBy: { stepNumber: 'asc' },
          include: {
            officer: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: clearanceRequest });
  } catch (error) {
    console.error('Error fetching clearance status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clearance status' },
      { status: 500 }
    );
  }
}