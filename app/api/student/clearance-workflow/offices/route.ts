import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { CLEARANCE_OFFICES } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

// Ensure Node.js runtime
export const runtime = 'nodejs';

/**
 * GET /api/student/clearance-workflow/offices
 * Get list of all clearance offices
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

    const response = NextResponse.json({
      success: true,
      data: CLEARANCE_OFFICES.map(office => ({
        id: office.id,
        name: office.name,
        step: office.step,
      })),
    });

    return applySecurityHeaders(response);
  } catch (error: any) {
    console.error('Error fetching offices:', error);
    const response = NextResponse.json(
      { 
        error: 'Failed to fetch offices', 
        message: error.message 
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}
