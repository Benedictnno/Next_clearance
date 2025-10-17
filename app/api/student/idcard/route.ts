import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireRole } from '@/lib/auth';
import QRCode from 'qrcode';
import { collections } from '@/lib/mongoCollections'

// Get student ID card details
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { students } = await collections()
    const student = await students.findOne({ userId: session.userId })
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }
    // For Mongo sample, return placeholder until generated
    // A separate POST generates and persists the ID card

    return NextResponse.json({
      student: {
        id: String(student._id),
        name: `${student.firstName} ${student.lastName}`,
        matricNumber: student.matricNumber,
        department: student.department,
        faculty: student.faculty,
        level: student.level
      },
      idCard: null
    });
  } catch (error: any) {
    console.error('Error fetching ID card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ID card', message: error.message },
      { status: 500 }
    );
  }
}

// Generate or regenerate student ID card
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('student');
    
    const { students } = await collections()
    const student = await students.findOne({ userId: session.userId })
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Generate QR code data URL
    const cardNumber = `EKSU-${student.matricNumber}-${new Date().getFullYear()}`;
    const verificationUrl = `https://eksu-clearance.vercel.app/verify/${cardNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
    
    // Set expiry date (4 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    // Persist (simplified Mongo version)
    // In a full version we'd use a separate collection; for now return payload
    const idCard = {
      cardNumber,
      qrCode: qrCodeDataUrl,
      imageUrl: `/api/student/idcard/image/${String(student._id)}`,
      issuedDate: new Date(),
      expiryDate,
      isActive: true
    }

    return NextResponse.json({
      success: true,
      message: 'ID card generated successfully',
      idCard
    });
  } catch (error: any) {
    console.error('Error generating ID card:', error);
    return NextResponse.json(
      { error: 'Failed to generate ID card', message: error.message },
      { status: 500 }
    );
  }
}