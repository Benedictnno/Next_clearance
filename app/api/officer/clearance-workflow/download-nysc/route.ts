import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pdfGenerator } from '@/lib/pdfGenerator';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Auth check: Only Oversight/Admin/Student Affairs roles
        // We check both the base user role and the officer-specific role
        const userRole = user?.role || '';
        const officerRole = user?.officer?.role || '';
        const isAuthorized = 
            ['OVERSEER', 'STUDENT_AFFAIRS', 'ADMIN', 'SUPER_ADMIN'].includes(userRole) ||
            ['OVERSEER', 'STUDENT_AFFAIRS', 'ADMIN', 'SUPER_ADMIN'].includes(officerRole);

        if (!isAuthorized) {
            console.warn(`[Download-NYSC] Unauthorized access attempt by user ${user?.email} with role ${userRole}/${officerRole}`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        // 1. Get student data
        const studentData = await pdfGenerator.getStudentDataForPDF(studentId);
        if (!studentData) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // 2. Get NYSC Info
        const nyscInfo = await prisma.nYSCInfo.findUnique({
            where: { studentId },
        });

        if (!nyscInfo) {
            return NextResponse.json({ error: 'NYSC Information not found for this student' }, { status: 404 });
        }

        // 3. Prepare form data
        const formNumber = `EKSU-NYSC-${new Date().getFullYear()}-${studentId.slice(-6).toUpperCase()}`;
        const qrData = `https://eksu-clearance.vercel.app/verify/nysc/${formNumber}`;
        const qrCode = await pdfGenerator.generateQRCode(qrData);

        const formData = {
            student: studentData,
            nyscInfo,
            formNumber,
            generatedDate: new Date(),
            qrCode,
        };

        // 4. Generate PDF
        const pdfBytes = await pdfGenerator.generateNYSCForm(formData);

        // 5. Return PDF
        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="nysc-form-${studentData.matricNumber}.pdf"`,
                'Content-Length': Buffer.byteLength(Buffer.from(pdfBytes)).toString(),
            },
        });

    } catch (error: any) {
        console.error('Error in download-nysc:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}
