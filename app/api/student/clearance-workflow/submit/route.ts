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
    const validatedData = SubmitSchema.parse(body);

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
