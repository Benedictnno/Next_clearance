import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { StepStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stepId } = await params;

    // Get step details and requirements
    const step = await prisma.clearanceStep.findUnique({
      where: { id: stepId },
      include: {
        department: true,
        assignedOfficer: {
          include: {
            user: true,
            department: true
          }
        }
      }
    });

    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    // Get student's progress for this step
    const progress = await prisma.clearanceProgress.findFirst({
      where: {
        stepId: stepId,
        request: {
          studentId: user.student.id
        }
      },
      include: {
        documents: true,
        officer: {
          include: {
            user: true,
            department: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        step: {
          id: step.id,
          stepNumber: step.stepNumber,
          name: step.name,
          description: step.description,
          requiresPayment: step.requiresPayment,
          paymentAmount: step.paymentAmount,
          requiredDocuments: step.requiredDocuments,
          requiresReceipt: step.requiresReceipt,
          receiptDescription: step.receiptDescription,
          supportingDocsDescription: step.supportingDocsDescription,
          department: step.department,
          assignedOfficer: step.assignedOfficer
        },
        progress: progress ? {
          id: progress.id,
          status: progress.status,
          comment: progress.comment,
          actionedAt: progress.actionedAt,
          documents: progress.documents,
          officer: progress.officer
        } : null
      }
    });

  } catch (error: any) {
    console.error('Error fetching step details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch step details', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stepId } = await params;

    const body = await request.json();
    const { documents, comment } = body;

    // Find or create progress entry for this step
    let progress = await prisma.clearanceProgress.findFirst({
      where: {
        stepId: stepId,
        request: {
          studentId: user.student.id
        }
      }
    });

    if (!progress) {
      // Create new progress entry
      const clearanceRequest = await prisma.clearanceRequest.findFirst({
        where: { studentId: user.student.id }
      });

      if (!clearanceRequest) {
        return NextResponse.json(
          { error: 'No active clearance request found' },
          { status: 404 }
        );
      }

      const step = await prisma.clearanceStep.findUnique({
        where: { id: stepId }
      });

      if (!step) {
        return NextResponse.json({ error: 'Step not found' }, { status: 404 });
      }

      progress = await prisma.clearanceProgress.create({
        data: {
          requestId: clearanceRequest.id,
          stepId: stepId,
          stepNumber: step.stepNumber,
          officeName: step.name,
          status: StepStatus.PENDING,
          officerId: step.assignedOfficerId
        }
      });
    }

    // Add documents to this step
    if (documents && documents.length > 0) {
      await prisma.document.createMany({
        data: documents.map((doc: any) => ({
          name: doc.name,
          type: doc.type || 'OTHER',
          url: doc.url,
          clearanceProgressId: progress.id
        }))
      });
    }

    // Update progress with comment if provided
    if (comment) {
      await prisma.clearanceProgress.update({
        where: { id: progress.id },
        data: {
          comment: comment,
          updatedAt: new Date()
        }
      });
    }

    // Get updated progress with documents
    const updatedProgress = await prisma.clearanceProgress.findUnique({
      where: { id: progress.id },
      include: {
        documents: true,
        officer: {
          include: {
            user: true,
            department: true
          }
        },
        step: true
      }
    });

    // Notify the assigned officer
    if (progress.officerId) {
      await prisma.notification.create({
        data: {
          userId: progress.officerId,
          title: 'New Document Submission',
          message: `${user.student.firstName || user.name} has submitted documents for ${progress.officeName}`,
          type: 'ACTION_REQUIRED'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Documents submitted successfully',
      data: updatedProgress
    });

  } catch (error: any) {
    console.error('Error submitting documents:', error);
    return NextResponse.json(
      { error: 'Failed to submit documents', details: error.message },
      { status: 500 }
    );
  }
}
