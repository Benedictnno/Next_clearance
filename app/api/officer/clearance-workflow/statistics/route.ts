import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

/**
 * GET /api/officer/clearance-workflow/statistics
 * Get statistics for officer's office
 * 
 * Query params:
 * - officeId: string (required) - The office ID to get statistics for
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

    // Get officeId from query params
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('officeId');

    if (!officeId) {
      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          data: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
          },
        })
      );
    }

    // ENFORCE OFFICER ISOLATION
    // If officer has an assigned office, they can ONLY view that office
    if (user.officer.assignedOfficeId && user.officer.assignedOfficeId !== officeId) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only view submissions for your assigned office' },
        { status: 403 }
      );
    }

    // Get statistics
    // Determine department filter if applicable (for HODs)
    const departmentFilter = user.officer.departmentId || user.officer.assignedDepartmentId;
    const stats = await clearanceWorkflow.getOfficeStatistics(officeId, departmentFilter);

    const response = NextResponse.json({
      success: true,
      data: stats,
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        message: error.message
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
