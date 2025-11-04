import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

/**
 * GET /api/officer/clearance-workflow/submission/[submissionId]
 * Get details of a specific clearance submission
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user?.officer) {
      return NextResponse.json(
        { error: 'Unauthorized - Officer access required' },
        { status: 401 }
      );
    }

    const { submissionId } = await params;
    const submission = await clearanceWorkflow.getSubmissionById(submissionId);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Verify officer has access to this submission
    if (submission.officerId && submission.officerId !== user.officer.id) {
      return NextResponse.json(
        { error: 'Access denied - This submission is not assigned to you' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: submission,
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error fetching submission:', error);
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch submission', 
        message: error.message 
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
