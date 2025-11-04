import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

/**
 * GET /api/officer/clearance-workflow/pending
 * Get pending clearance submissions for officer's office
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
      return NextResponse.json(
        { error: 'Office ID is required' },
        { status: 400 }
      );
    }

    // Get pending submissions for this office
    // Don't filter by officerId - officers should see all submissions for their office
    const submissions = await clearanceWorkflow.getOfficePendingSubmissions(
      officeId
    );

    const response = NextResponse.json({
      success: true,
      data: submissions,
      count: submissions.length,
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error fetching pending submissions:', error);
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch pending submissions', 
        message: error.message 
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
