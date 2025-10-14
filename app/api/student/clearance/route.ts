import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSession, requireRole } from '@/lib/auth';

// Get student clearance status
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
        student: true
      }
    });

    if (!user?.student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get all clearance steps
    const steps = await prisma.clearanceStep.findMany({
      orderBy: { stepNumber: 'asc' }
    });

    // Get student's clearance progress
    const progress = await prisma.clearanceProgress.findMany({
      where: { studentId: user.student.id },
      include: {
        step: true,
        officer: true
      }
    });

    // Map steps with progress
    const clearanceStatus = steps.map(step => {
      const stepProgress = progress.find(p => p.stepId === step.id);
      return {
        step: {
          id: step.id,
          name: step.name,
          stepNumber: step.stepNumber,
          requiresPayment: step.requiresPayment,
          paymentAmount: step.paymentAmount
        },
        status: stepProgress?.status || 'pending',
        updatedAt: stepProgress?.updatedAt || null,
        comment: stepProgress?.comment || null,
        officerName: stepProgress?.officer?.name || null
      };
    });

    // Calculate overall progress
    const totalSteps = steps.length;
    const completedSteps = progress.filter(p => p.status === 'approved').length;
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const isCompleted = totalSteps > 0 && completedSteps === totalSteps;

    return NextResponse.json({
      student: {
        id: user.student.id,
        name: `${user.student.firstName} ${user.student.lastName}`,
        matricNumber: user.student.matricNumber,
        department: user.student.department,
        faculty: user.student.faculty,
        level: user.student.level
      },
      clearance: {
        steps: clearanceStatus,
        progress: progressPercentage,
        isCompleted,
        totalSteps,
        completedSteps
      }
    });
  } catch (error: any) {
    console.error('Error fetching clearance status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clearance status', message: error.message },
      { status: 500 }
    );
  }
}

// Initialize clearance process for a student
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

    // Get all clearance steps
    const steps = await prisma.clearanceStep.findMany({
      orderBy: { stepNumber: 'asc' }
    });

    // Check if clearance already initialized
    const existingProgress = await prisma.clearanceProgress.findFirst({
      where: { studentId: user.student.id }
    });

    if (existingProgress) {
      return NextResponse.json({ 
        error: 'Clearance process already initialized',
        message: 'Your clearance process has already been started'
      }, { status: 400 });
    }

    // Initialize clearance progress for all steps
    await prisma.$transaction(
      steps.map(step => 
        prisma.clearanceProgress.create({
          data: {
            studentId: user.student.id,
            stepId: step.id,
            status: 'pending'
          }
        })
      )
    );

    // Generate student ID card if it doesn't exist
    const existingId = await prisma.studentID.findUnique({
      where: { studentId: user.student.id }
    });

    if (!existingId) {
      const cardNumber = `EKSU-${user.student.matricNumber}-${new Date().getFullYear()}`;
      const qrCode = `https://eksu-clearance.vercel.app/verify/${cardNumber}`;
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 4); // Valid for 4 years
      
      await prisma.student_id_cards.create({
        data: {
          student_id: user.student.id,
          card_number: cardNumber,
          qr_code: qrCode,
          image_url: `/api/student/idcard/image/${user.student.id}`,
          expiry_date: expiryDate
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Clearance process initialized successfully',
      steps: steps.length
    });
  } catch (error: any) {
    console.error('Error initializing clearance:', error);
    return NextResponse.json(
      { error: 'Failed to initialize clearance', message: error.message },
      { status: 500 }
    );
  }
}