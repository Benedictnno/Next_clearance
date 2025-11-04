import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StepStatus } from '@prisma/client';

/**
 * GET /api/officer/statistics
 * Get general statistics for the officer's clearance processing
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.officer) {
      return NextResponse.json(
        { error: 'Unauthorized - Officer access required' },
        { status: 401 }
      );
    }

    const officerId = user.officer.id;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count pending requests
    const pending = await prisma.clearanceProgress.count({
      where: {
        officerId: officerId,
        status: StepStatus.PENDING,
        isDeleted: false,
        request: {
          isDeleted: false,
        },
      },
    });

    // Count approved today
    const approvedToday = await prisma.clearanceProgress.count({
      where: {
        officerId: officerId,
        status: StepStatus.APPROVED,
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
        isDeleted: false,
      },
    });

    // Count rejected today
    const rejectedToday = await prisma.clearanceProgress.count({
      where: {
        officerId: officerId,
        status: StepStatus.REJECTED,
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
        isDeleted: false,
      },
    });

    // Count total processed (approved + rejected)
    const totalProcessed = await prisma.clearanceProgress.count({
      where: {
        officerId: officerId,
        status: {
          in: [StepStatus.APPROVED, StepStatus.REJECTED],
        },
        isDeleted: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        pending,
        approvedToday,
        rejectedToday,
        totalProcessed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
