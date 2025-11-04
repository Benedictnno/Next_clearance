import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';
import { z } from 'zod';

/**
 * POST /api/officer/clearance-workflow/approve
 * Approve a clearance submission
 */

const ApproveSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  comment: z.string().optional(),
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
    const validatedData = ApproveSchema.parse(body);

    // Approve the submission
    const result = await clearanceWorkflow.approveSubmission(
      validatedData.submissionId,
      user.officer.id,
      validatedData.comment
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
    console.error('Error approving submission:', error);

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
        error: 'Failed to approve submission', 
        message: error.message 
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
