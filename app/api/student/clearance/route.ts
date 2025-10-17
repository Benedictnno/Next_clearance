import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { collections } from '@/lib/mongoCollections';
import { getSession, requireRole } from '@/lib/auth';

// Get student clearance status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // MongoDB variant for development
    const { students, steps: stepsCol, progress: progressCol } = await collections()
    const student = await students.findOne({ userId: session.userId })
    if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    const steps = await stepsCol.find({}).sort({ stepNumber: 1 }).toArray()
    const progress = await progressCol.find({ studentId: student._id }).toArray()

    // Map steps with progress
    const clearanceStatus = steps.map(step => {
      const stepProgress = progress.find((p: any) => String(p.stepId) === String(step._id));
      return {
        step: {
          id: String(step._id),
          name: step.name,
          stepNumber: step.stepNumber,
          requiresPayment: step.requiresPayment,
          paymentAmount: step.paymentAmount
        },
        status: stepProgress?.status || 'pending',
        updatedAt: stepProgress?.updatedAt || null,
        comment: stepProgress?.comment || null,
        officerName: null
      };
    });

    // Calculate overall progress
    const totalSteps = steps.length;
    const completedSteps = progress.filter((p: any) => p.status === 'approved').length;
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const isCompleted = totalSteps > 0 && completedSteps === totalSteps;

    return NextResponse.json({
      student: {
        id: String(student._id),
        name: `${student.firstName} ${student.lastName}`,
        matricNumber: student.matricNumber,
        department: student.department,
        faculty: student.faculty,
        level: student.level
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
      where: { id: String(session.userId) },
      include: { student: true }
    });

    if (!user || !('student' in user) || !user.student) {
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
      steps.map((step: any) =>
        prisma.clearanceProgress.create({
          data: {
            studentId: user.student?.id as any,
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
      expiryDate.setFullYear(expiryDate.getFullYear() + 4);

      await prisma.studentID.create({
        data: {
          studentId: user.student.id,
          cardNumber,
          qrCode,
          imageUrl: `/api/student/idcard/image/${user.student.id}`,
          expiryDate
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
