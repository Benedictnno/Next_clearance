import { NextRequest as PendingNextRequest, NextResponse as PendingNextResponse } from 'next/server';
import { getCurrentUser as getUserPending } from '@/lib/auth';
import { prisma as prismaPending } from '@/lib/prisma';
import { StepStatus, ClearanceRequestStatus } from '@prisma/client';

export async function GET(request: PendingNextRequest) {
  const user = await getUserPending();
  
  if (!user?.officer) {
    return PendingNextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pendingSteps = await prismaPending.clearanceProgress.findMany({
    where: {
      officerId: user.officer.id,
      status: StepStatus.PENDING,
      isDeleted: false,
      request: {
        isDeleted: false,
        status: {
          in: [ClearanceRequestStatus.PENDING, ClearanceRequestStatus.IN_PROGRESS],
        },
      },
    },
    include: {
      request: {
        include: {
          student: {
            include: {
              department: true,
            },
          },
        },
      },
      step: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return PendingNextResponse.json({ data: pendingSteps });
}