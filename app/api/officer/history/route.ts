import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma  from '@/lib/prisma';
import { StepStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user?.officer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const history = await prisma.clearanceProgress.findMany({
    where: {
      officerId: user.officer.id,
      status: { in: [StepStatus.APPROVED, StepStatus.REJECTED] },
      isDeleted: false,
    },
    include: {
      step: true,
      request: {
        include: {
          student: {
            include: {
              department: true,
            },
          },
        },
      },
    },
    orderBy: {
      actionedAt: 'desc',
    },
    take: 100, // Limit to last 100 activities
  });

  const formatted = history.map((item) => ({
    id: item.id,
    stepNumber: item.stepNumber,
    stepName: item.officeName,
    status: item.status,
    comment: item.comment,
    actionedAt: item.actionedAt,
    student: {
      firstName: item.request.student.firstName,
      lastName: item.request.student.lastName,
      matricNumber: item.request.student.matricNumber,
      department: item.request.student.department,
    },
  }));

  return NextResponse.json({ success: true, data: formatted });
}