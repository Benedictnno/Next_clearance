import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getSession } from '@/lib/auth';
import { securityHeaders } from '@/lib/security';

/**
 * GET /api/auth/me
 * 
 * Returns the currently authenticated user's information.
 * This endpoint reads from the auth_token cookie set by the middleware.
 */
export async function GET(request: NextRequest) {
    try {
        // Get session from cookie
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401, headers: securityHeaders }
            );
        }

        // Get full user data from database
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404, headers: securityHeaders }
            );
        }

        // Build response based on user type
        let responseData: any = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name || (user.student ? `${user.student.firstName} ${user.student.lastName}`.trim() : null),
        };

        // Add student-specific data
        if (user.student) {
            responseData = {
                ...responseData,
                matricNumber: user.student.matricNumber,
                department: user.student.department?.name,
                faculty: user.student.faculty?.name,
                phoneNumber: user.student.phoneNumber,
                gender: user.student.gender,
                level: user.student.level,
                admissionYear: session.admissionYear,
                yearsSinceAdmission: session.yearsSinceAdmission,
                studentId: user.student.id,
            };
        }

        // Add officer-specific data
        if (user.officer) {
            responseData = {
                ...responseData,
                officerId: user.officer.id,
                officerRole: user.officer.role,
                department: user.officer.department?.name,
                assignedOffices: user.officer.assignedOffices,
                assignedDepartmentId: user.officer.assignedDepartmentId,
                assignedDepartmentName: user.officer.assignedDepartmentName,
                name: user.officer.name || responseData.name,
            };
        }

        // Add admin-specific data
        if (user.admin) {
            responseData = {
                ...responseData,
                adminId: user.admin.id,
                name: user.admin.name || responseData.name,
            };
        }

        return NextResponse.json(
            { success: true, user: responseData },
            { headers: securityHeaders }
        );

    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500, headers: securityHeaders }
        );
    }
}
