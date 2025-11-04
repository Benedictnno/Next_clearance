import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireRole } from '@/lib/auth';
import { clearanceEngine } from '@/lib/clearanceEngine';
import { pdfGenerator } from '@/lib/pdfGenerator';
import { collections } from '@/lib/mongoCollections';

// Generate clearance certificate PDF
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('STUDENT');
    
    // Check if clearance is completed
    const isCompleted = await clearanceEngine.isClearanceCompleted(String(session.user?.id));
    if (!isCompleted) {
      return NextResponse.json({ 
        error: 'Clearance not completed. Please complete all clearance steps first.' 
      }, { status: 400 });
    }

    // Get student data
    const studentData = await pdfGenerator.getStudentDataForPDF(String(session.user?.id));
    if (!studentData) {
      return NextResponse.json({ error: 'Student data not found' }, { status: 404 });
    }

    // Get clearance steps data
    const stepsData = await pdfGenerator.getClearanceStepsForPDF(String(session.user?.id));
    
    // Generate certificate number
    const certificateNumber = `EKSU-CC-${new Date().getFullYear()}-${String(session.user?.id).slice(-6)}`;
    
    // Generate QR code data
    const qrData = `https://eksu-clearance.vercel.app/verify/certificate/${certificateNumber}`;
    const qrCode = await pdfGenerator.generateQRCode(qrData);

    // Prepare certificate data
    const certificateData = {
      student: studentData,
      steps: stepsData,
      completionDate: new Date(),
      certificateNumber,
      qrCode,
    };

    // Generate PDF
    const pdfBytes = await pdfGenerator.generateClearanceCertificate(certificateData);

    // Store certificate metadata in database
    try {
      const { certificates } = await collections();
      await certificates.insertOne({
        studentId: String(session.user?.id),
        certificateNumber,
        generatedDate: new Date(),
        qrCode,
        status: 'generated',
      });
    } catch (dbError) {
      console.warn('Failed to store certificate metadata:', dbError);
      // Continue even if database storage fails
    }

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="clearance-certificate-${studentData.matricNumber}.pdf"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error generating clearance certificate:', error);
    return NextResponse.json(
      { error: 'Failed to generate clearance certificate', message: error.message },
      { status: 500 }
    );
  }
}

// Check if clearance certificate is available
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('STUDENT');
    
    // Check if clearance is completed
    const isCompleted = await clearanceEngine.isClearanceCompleted(String(session.user?.id));
    
    if (!isCompleted) {
      return NextResponse.json({ 
        available: false,
        message: 'Clearance not completed. Please complete all clearance steps first.'
      });
    }

    // Check if certificate already exists
    try {
      const { certificates } = await collections();
      const existingCertificate = await certificates.findOne({ 
        studentId: String(session.user?.id) 
      });

      if (existingCertificate) {
        return NextResponse.json({
          available: true,
          certificateNumber: existingCertificate.certificateNumber,
          generatedDate: existingCertificate.generatedDate,
          message: 'Certificate is ready for download.'
        });
      }
    } catch (dbError) {
      console.warn('Failed to check existing certificate:', dbError);
    }

    return NextResponse.json({
      available: true,
      message: 'Certificate is ready to be generated.'
    });

  } catch (error: any) {
    console.error('Error checking clearance certificate:', error);
    return NextResponse.json(
      { error: 'Failed to check clearance certificate', message: error.message },
      { status: 500 }
    );
  }
}
