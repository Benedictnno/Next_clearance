import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user || user.role !== 'OFFICER' || !user.officer) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        success: true,
        data: {
            id: user.officer.id,
            name: user.officer.name,
            role: user.officer.role,
            assignedOfficeId: user.officer.assignedOfficeId,
            assignedOfficeName: user.officer.assignedOfficeName
        }
    });
}
