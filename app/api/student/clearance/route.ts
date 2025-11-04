// app/api/student/clearance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { clearanceEngine } from '@/lib/clearanceEngine';
import { collections } from '@/lib/mongoCollections';
import { applySecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole('STUDENT');
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }
    
    const { session } = auth;
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 401 });
    }
    
    // Get student data from MongoDB
    const { students } = await collections();
    const student = await students.findOne({ userId: session.userId });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get clearance progress using the clearance engine
    const progress = await clearanceEngine.getStudentProgress(String(student._id));

    // Format response to match expected structure
    const response = {
      student: {
        id: student._id,
        userId: student.userId,
        matricNumber: student.matricNumber,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        lastName: student.lastName,
        department: student.department,
        faculty: student.faculty,
        level: student.level,
      },
      clearance: {
        steps: progress.steps.map(step => ({
          step: {
            id: step.step.id,
            stepNumber: step.step.stepNumber,
            name: step.step.name,
            requiresPayment: step.step.requiresPayment || false,
            paymentAmount: step.step.paymentAmount || null,
          },
          progress: {
            status: step.progress.status,
            comment: step.progress.comment,
            updatedAt: step.progress.updatedAt,
          }
        })),
        progressPercentage: progress.progressPercentage,
        isCompleted: progress.isCompleted,
        // Removed 'currentStepNumber' as it does not exist on the returned progress type
      }
    };

    return applySecurityHeaders(NextResponse.json(response));

  } catch (error: any) {
    console.error('Error fetching student clearance:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch clearance data', message: error.message },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}