import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

/**
 * GET /api/student/clearance-workflow/can-access-forms
 * Check if student can access final clearance forms (NYSC Form, Final Clearance Certificate)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.student) {
      return NextResponse.json(
        { error: 'Unauthorized - Student access required' },
        { status: 401 }
      );
    }

    const canAccess = await clearanceWorkflow.canAccessFinalForms(user.student.id);

    const response = NextResponse.json({
      success: true,
      canAccessFinalForms: canAccess,
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error checking forms access:', error);
    const response = NextResponse.json(
      { 
        error: 'Failed to check forms access', 
        message: error.message 
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
