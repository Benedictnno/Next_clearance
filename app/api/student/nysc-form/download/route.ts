import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { clearanceWorkflow } from '@/lib/clearanceWorkflow';
import { pdfGenerator } from '@/lib/pdfGenerator';
import { collections } from '@/lib/mongoCollections';
import { prisma } from '@/lib/prisma';

// Generate NYSC mobilization form PDF
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole('STUDENT');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user, session } = auth;
    if (!user?.student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    // Check if clearance is completed
    const isCompleted = await clearanceWorkflow.canAccessFinalForms(user.student.id);
    if (!isCompleted) {
      return NextResponse.json({
        error: 'Clearance not completed. Please complete all clearance steps first.'
      }, { status: 400 });
    }

    // Get student data
    const studentData = await pdfGenerator.getStudentDataForPDF(user.student.id);
    if (!studentData) {
      return NextResponse.json({ error: 'Student data not found' }, { status: 404 });
    }

    // Generate form number
    const formNumber = `EKSU-NYSC-${new Date().getFullYear()}-${user.student.id.slice(-6)}`;

    // Generate QR code data
    const qrData = `https://eksu-clearance.vercel.app/verify/nysc/${formNumber}`;
    const qrCode = await pdfGenerator.generateQRCode(qrData);

    // Get NYSC Info
    if (!prisma) throw new Error("Prisma client not initialized");
    const nyscInfo = await prisma.nYSCInfo.findUnique({
      where: { studentId: user.student.id }
    });

    // Prepare NYSC form data
    const nyscFormData: any = {
      student: studentData,
      nyscInfo,
      formNumber,
      generatedDate: new Date(),
      qrCode,
    };

    // Generate PDF
    const pdfBytes = await pdfGenerator.generateNYSCForm(nyscFormData);

    // Store form metadata in database
    try {
      const { nyscForms } = await collections();
      await nyscForms.insertOne({
        studentId: user.student.id,
        formNumber,
        generatedDate: new Date(),
        qrCode,
        status: 'generated',
      });
    } catch (dbError) {
      console.warn('Failed to store NYSC form metadata:', dbError);
      // Continue even if database storage fails
    }

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="nysc-form-${studentData.matricNumber}.pdf"`,
        'Content-Length': Buffer.byteLength(Buffer.from(pdfBytes)).toString(),
      },
    });

  } catch (error: any) {
    console.error('Error generating NYSC form:', error);
    return NextResponse.json(
      { error: 'Failed to generate NYSC form', message: error.message },
      { status: 500 }
    );
  }
}

// Check if NYSC form is available
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('STUDENT');
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user, session } = auth;
    if (!user?.student) {
      return NextResponse.json({ available: false, error: 'Student record not found' });
    }

    // Check if clearance is completed
    const isCompleted = await clearanceWorkflow.canAccessFinalForms(user.student.id);

    if (!isCompleted) {
      return NextResponse.json({
        available: false,
        message: 'Clearance not completed. Please complete all clearance steps first.'
      });
    }

    // Check if form already exists
    try {
      const { nyscForms } = await collections();
      const existingForm = await nyscForms.findOne({
        studentId: user.student.id
      });

      if (existingForm) {
        return NextResponse.json({
          available: true,
          formNumber: existingForm.formNumber,
          generatedDate: existingForm.generatedDate,
          message: 'NYSC form is ready for download.'
        });
      }
    } catch (dbError) {
      console.warn('Failed to check existing NYSC form:', dbError);
    }

    return NextResponse.json({
      available: true,
      message: 'NYSC form is ready to be generated.'
    });

  } catch (error: any) {
    console.error('Error checking NYSC form:', error);
    return NextResponse.json(
      { error: 'Failed to check NYSC form', message: error.message },
      { status: 500 }
    );
  }
}
