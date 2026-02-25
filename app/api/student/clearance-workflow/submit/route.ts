import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';
import { z } from 'zod';

// Ensure Node.js runtime
export const runtime = 'nodejs';

/**
 * POST /api/student/clearance-workflow/submit
 * Submit clearance documents to a specific office
 */

const SubmitSchema = z.object({
  officeId: z.string().min(1, 'Office ID is required'),
  documents: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().min(1, 'File URL is required'),
    fileType: z.string(),
  })).min(1, 'At least one document is required'),
  officerId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.student) {
      return NextResponse.json(
        { error: 'Unauthorized - Student access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[ClearanceSubmit] Incoming request body:', JSON.stringify(body, null, 2));

    let validatedData;
    try {
      validatedData = SubmitSchema.parse(body);
    } catch (zodError) {
      console.error('[ClearanceSubmit] Zod validation failed:', zodError);
      throw zodError; // Re-throw to be caught by catch block
    }

    // Check 4-year eligibility requirement
    if (user.student.admissionYear) {
      const currentYear = new Date().getFullYear();
      const yearsSpent = currentYear - user.student.admissionYear;
      console.log(`[ClearanceSubmit] Eligibility check: admissionYear=${user.student.admissionYear}, currentYear=${currentYear}, yearsSpent=${yearsSpent}`);

      if (yearsSpent < 4) {
        return NextResponse.json(
          {
            error: 'Eligibility Required',
            message: `You must have spent at least 4 years to start clearance. You have spent ${yearsSpent} year(s).`,
            yearsSpent,
            yearsRequired: 4,
            admissionYear: user.student.admissionYear
          },
          { status: 403 }
        );
      }
    }

    // Get student info
    const studentName = user.student.firstName && user.student.lastName
      ? `${user.student.firstName} ${user.student.lastName}`
      : user.name || 'Student';
    const studentMatricNumber = user.student.matricNumber || 'N/A';

    // Submit to office
    const result = await clearanceWorkflow.submitToOffice(
      user.student.id,
      studentName,
      studentMatricNumber,
      validatedData.officeId,
      validatedData.documents,
      validatedData.officerId
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
      submissionId: result.submissionId,
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error submitting clearance:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues
        },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json(
      {
        error: 'Failed to submit clearance',
        message: error.message
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
