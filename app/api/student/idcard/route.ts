import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession, requireRole } from '@/lib/auth';
import QRCode from 'qrcode';

// Get student ID card details
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student details
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        student: {
          include: {
            studentId: true
          }
        }
      }
    });

    if (!user?.student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    if (!user.student.studentID) {
      return NextResponse.json({ error: 'ID card not generated yet' }, { status: 404 });
    }

    return NextResponse.json({
      student: {
        id: user.student.id,
        name: `${user.student.firstName} ${user.student.lastName}`,
        matricNumber: user.student.matricNumber,
        department: user.student.department,
        faculty: user.student.faculty,
        level: user.student.level
      },
      idCard: {
        cardNumber: user.student.studentID.cardNumber,
        qrCode: user.student.studentID.qrCode,
        imageUrl: user.student.studentID.imageUrl,
        issuedDate: user.student.studentID.issuedDate,
        expiryDate: user.student.studentID.expiryDate,
        isActive: user.student.studentID.isActive
      }
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
    
    // Get student details
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        student: true
      }
    });

    if (!user?.student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Generate QR code data URL
    const cardNumber = `EKSU-${user.student.matricNumber}-${new Date().getFullYear()}`;
    const verificationUrl = `https://eksu-clearance.vercel.app/verify/${cardNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
    
    // Set expiry date (4 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    // Check if ID card already exists
    const existingIdCard = await prisma.studentID.findUnique({
      where: { studentId: user.student.id }
    });

    let idCard;
    if (existingIdCard) {
      // Update existing ID card
      idCard = await prisma.studentID.update({
        where: { id: existingIdCard.id },
        data: {
          qrCode: qrCodeDataUrl,
          expiryDate,
          isActive: true,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new ID card
      idCard = await prisma.studentID.create({
        data: {
          studentId: user.student.id,
          cardNumber,
          qrCode: qrCodeDataUrl,
          imageUrl: `/api/student/idcard/image/${user.student.id}`,
          expiryDate,
          isActive: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: existingIdCard ? 'ID card regenerated successfully' : 'ID card generated successfully',
      idCard: {
        cardNumber: idCard.cardNumber,
        qrCode: idCard.qrCode,
        imageUrl: idCard.imageUrl,
        issuedDate: idCard.issuedDate,
        expiryDate: idCard.expiryDate,
        isActive: idCard.isActive
      }
    });
  } catch (error: any) {
    console.error('Error generating ID card:', error);
    return NextResponse.json(
      { error: 'Failed to generate ID card', message: error.message },
      { status: 500 }
    );
  }
}