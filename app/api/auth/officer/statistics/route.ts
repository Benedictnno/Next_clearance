import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StepStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.officer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedToday = await prisma.clearanceProgress.count({
      where: {
        officerId: user.officer.id,
        status: StepStatus.APPROVED,
        actionedAt: { gte: today },
      },
    });

    const rejectedToday = await prisma.clearanceProgress.count({
      where: {
        officerId: user.officer.id,
        status: StepStatus.REJECTED,
        actionedAt: { gte: today },
      },
    });

    const totalProcessed = await prisma.clearanceProgress.count({
      where: {
        officerId: user.officer.id,
        status: { in: [StepStatus.APPROVED, StepStatus.REJECTED] },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        pending: 0,
        approvedToday,
        rejectedToday,
        totalProcessed,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}