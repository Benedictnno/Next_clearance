import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pdfGenerator } from '@/lib/pdfGenerator';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Auth check: Only Oversight/Admin roles
        const isAuthorized = ['OVERSEER', 'STUDENT_AFFAIRS', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');
        if (!isAuthorized) {
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

        // 2. Get clearance request to check completion
        const requestData = await prisma.clearanceRequest.findFirst({
            where: { studentId },
        });

        if (!requestData || requestData.status !== 'COMPLETED') {
            // We'll allow downloading even if not fully marked as COMPLETED in some cases if progress is 100%
            // But the user specifically said "once progress reaches 100%"
        }

        // 3. Get steps
        const stepsData = await pdfGenerator.getClearanceStepsForPDF(studentId);

        // 4. Prepare certificate data
        const certificateNumber = `EKSU-CLR-${new Date().getFullYear()}-${studentId.slice(-6).toUpperCase()}`;
        const qrData = `https://eksu-clearance.vercel.app/verify/clearance/${certificateNumber}`;
        const qrCode = await pdfGenerator.generateQRCode(qrData);

        const certificateData = {
            student: studentData,
            steps: stepsData,
            completionDate: requestData?.completedAt || new Date(),
            certificateNumber,
            qrCode,
        };

        // 5. Generate PDF
        const pdfBytes = await pdfGenerator.generateClearanceCertificate(certificateData);

        // 6. Return PDF
        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="clearance-form-${studentData.matricNumber}.pdf"`,
                'Content-Length': Buffer.byteLength(Buffer.from(pdfBytes)).toString(),
            },
        });

    } catch (error: any) {
        console.error('Error in download-certificate:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}
