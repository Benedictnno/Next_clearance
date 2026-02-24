import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { applySecurityHeaders } from '@/lib/security';

/**
 * GET /api/officer/clearance-workflow/global
 * Get all clearance submissions across all offices (tracking only)
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

        // Get all submissions globally
        const submissions = await clearanceWorkflow.getGlobalSubmissions();

        const response = NextResponse.json({
            success: true,
            data: submissions,
            count: submissions.length,
        });

        return applySecurityHeaders(response);
    } catch (error: any) {
        console.error('Error fetching global submissions:', error);
        const response = NextResponse.json(
            {
                error: 'Failed to fetch global submissions',
                message: error.message
            },
            { status: 500 }
        );
        return applySecurityHeaders(response);
    }
}
