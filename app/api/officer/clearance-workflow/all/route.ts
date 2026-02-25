import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

/**
 * GET /api/officer/clearance-workflow/all
 * Get all clearance submissions for officer's office (including reviewed ones)
 * 
 * Query params:
 * - officeId: string (required) - The office ID to filter by
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
          data: [],
          count: 0,
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

    // Get all submissions for this office
    // Pass officer's assigned department ID OR faculty ID if they are restricted
    const departmentFilter = user.officer.assignedDepartmentId || user.officer.facultyId || undefined;

    const submissions = await clearanceWorkflow.getOfficeAllSubmissions(
      officeId,
      departmentFilter
    );

    const response = NextResponse.json({
      success: true,
      data: submissions,
      count: submissions.length,
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to fetch submissions',
        message: error.message
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
