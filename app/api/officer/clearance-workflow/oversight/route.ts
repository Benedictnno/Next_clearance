import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

/**
 * GET /api/officer/clearance-workflow/oversight
 * Get ALL clearance requests (Audit/Oversight view for Student Affairs)
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Check if user is an officer and has OVERSEER/Admin role
        if (!user?.officer || (user.officer.role !== 'OVERSEER' && user.officer.role !== 'ADMIN' && user.officer.role !== 'STUDENT_AFFAIRS')) {
            // Check if they are in Student Affairs office specifically
            const isStudentAffairs = user?.officer?.assignedOffices?.includes('student_affairs');

            if (!isStudentAffairs) {
                return NextResponse.json(
                    { error: 'Unauthorized - Oversight access required' },
                    { status: 403 }
                );
            }
        }

        // Get all requests globally for auditing
        const requests = await clearanceWorkflow.getGlobalRequests();

        const response = NextResponse.json({
            success: true,
            data: requests,
            count: requests.length,
        });

        return applySecurityHeaders(response);
    } catch (error: any) {
        console.error('Error fetching oversight data:', error);
        const response = NextResponse.json(
            {
                error: 'Failed to fetch oversight data',
                message: error.message
            },
            { status: 500 }
        );
        return applySecurityHeaders(response);
    }
}
