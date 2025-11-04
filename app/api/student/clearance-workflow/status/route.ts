import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

/**
 * GET /api/student/clearance-workflow/status
 * Get student's clearance status across all offices
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

    // Get clearance status
    const status = await clearanceWorkflow.getStudentStatus(user.student.id);

    const response = NextResponse.json({
      success: true,
      data: status,
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error fetching clearance status:', error);
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch clearance status', 
        message: error.message 
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
