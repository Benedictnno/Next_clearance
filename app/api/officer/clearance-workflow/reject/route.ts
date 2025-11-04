import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';
import { z } from 'zod';

/**
 * POST /api/officer/clearance-workflow/reject
 * Reject a clearance submission
 */

const RejectSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  reason: z.string().min(1, 'Reason is required'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.officer) {
      return NextResponse.json(
        { error: 'Unauthorized - Officer access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = RejectSchema.parse(body);

    // Reject the submission
    const result = await clearanceWorkflow.rejectSubmission(
      validatedData.submissionId,
      user.officer.id,
      validatedData.reason
    );

    if (!result.success) {
      const response = NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json({
      success: true,
      message: result.message,
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error rejecting submission:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors 
        },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json(
      { 
        error: 'Failed to reject submission', 
        message: error.message 
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
