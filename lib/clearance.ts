import { ClearanceRequestStatus, StepStatus } from '@prisma/client';
import prisma from './prisma';

export async function initiateClearanceRequest(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      department: {
        include: {
          hodOfficer: true,
        },
      },
    },
  });

  // For virtual users or users without department, create a simplified clearance request
  const isVirtualUser = !student || !student.departmentId;

  if (isVirtualUser) {
    console.log('Creating simplified clearance for virtual user');

    // Check for existing active request using studentId directly
    const existingRequest = await prisma.clearanceRequest.findFirst({
      where: {
        studentId,
        status: {
          in: [ClearanceRequestStatus.PENDING, ClearanceRequestStatus.IN_PROGRESS],
        },
        isDeleted: false,
      },
    });

    if (existingRequest) {
      throw new Error('You already have an active clearance request');
    }

    // Get only university-wide steps (not department-specific)
    const clearanceSteps = await prisma.clearanceStep.findMany({
      where: {
        isDeleted: false,
        isDepartmentSpecific: false
      },
      orderBy: { stepNumber: 'asc' },
    });

    // If no steps exist, return a mock clearance request
    if (clearanceSteps.length === 0) {
      console.log('No clearance steps found, returning mock clearance request');
      return {
        id: `mock-${studentId}-${Date.now()}`,
        studentId,
        status: ClearanceRequestStatus.PENDING,
        currentStep: 1,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [],
        message: 'Demo clearance request - No steps configured in system'
      };
    }

    // Create clearance request without department-specific steps
    const clearanceRequest = await prisma.clearanceRequest.create({
      data: {
        studentId,
        status: ClearanceRequestStatus.PENDING,
        currentStep: 1,
        steps: {
          create: clearanceSteps.map((step) => ({
            stepId: step.id,
            stepNumber: step.stepNumber,
            officeName: step.name,
            status: StepStatus.PENDING,
            officerId: step.assignedOfficerId,
            // Required fields for ClearanceProgress model
            submissionKey: step.isDepartmentSpecific ? `hod-${step.id}` : step.id,
            officeId: step.id,
            isDepartmentSpecific: step.isDepartmentSpecific,
          })),
        },
      },
      include: { steps: true },
    });

    return clearanceRequest;
  }

  // Original logic for users with departments
  if (!student.department) {
    throw new Error('Student is not assigned to any department');
  }

  if (!student.department.hodOfficer) {
    console.error(`Department ${student.department.name} (ID: ${student.department.id}) has no HOD assigned.`);
    throw new Error('Your department does not have an HOD assigned. Please contact support.');
  }

  // Check for existing active request
  const existingRequest = await prisma.clearanceRequest.findFirst({
    where: {
      studentId,
      status: {
        in: [ClearanceRequestStatus.PENDING, ClearanceRequestStatus.IN_PROGRESS],
      },
      isDeleted: false,
    },
  });

  if (existingRequest) {
    throw new Error('You already have an active clearance request');
  }

  const clearanceSteps = await prisma.clearanceStep.findMany({
    where: { isDeleted: false },
    orderBy: { stepNumber: 'asc' },
  });

  const clearanceRequest = await prisma.clearanceRequest.create({
    data: {
      studentId,
      status: ClearanceRequestStatus.PENDING,
      currentStep: 1,
      steps: {
        create: clearanceSteps.map((step) => ({
          stepId: step.id,
          stepNumber: step.stepNumber,
          officeName: step.name,
          status: StepStatus.PENDING,
          officerId: step.isDepartmentSpecific
            ? student.department!.hodOfficer!.id
            : step.assignedOfficerId,
          // Required fields for ClearanceProgress model
          submissionKey: step.isDepartmentSpecific
            ? `hod-${student.department!.id}`
            : step.id,
          officeId: step.isDepartmentSpecific ? 'hod' : step.id,
          isDepartmentSpecific: step.isDepartmentSpecific,
          studentDepartment: student.department?.id,
        })),
      },
    },
    include: { steps: true },
  });

  // Notify HOD
  const hodOfficer = student.department.hodOfficer;
  await prisma.notification.create({
    data: {
      userId: hodOfficer.userId,
      requestId: clearanceRequest.id,
      title: 'New Clearance Request',
      message: `${student.firstName} ${student.lastName} (${student.matricNumber}) submitted a clearance request`,
      type: 'ACTION_REQUIRED',
    },
  });

  return clearanceRequest;
}

export async function approveStep(
  requestId: string,
  stepId: string,
  officerId: string,
  comment?: string
) {
  const step = await prisma.clearanceProgress.findFirst({
    where: { requestId, stepId, officerId, isDeleted: false },
    include: {
      request: {
        include: {
          student: { include: { user: true } },
          steps: { orderBy: { stepNumber: 'asc' } },
        },
      },
    },
  });

  if (!step) throw new Error('Step not found');
  if (step.status !== StepStatus.PENDING) throw new Error('Step already processed');
  if (step.stepNumber !== step.request.currentStep) {
    throw new Error('Cannot approve - previous steps not completed');
  }

  await prisma.clearanceProgress.update({
    where: { id: step.id },
    data: { status: StepStatus.APPROVED, comment, actionedAt: new Date() },
  });

  const totalSteps = step.request.steps.length;
  const isLastStep = step.stepNumber === totalSteps;

  if (isLastStep) {
    await prisma.clearanceRequest.update({
      where: { id: requestId },
      data: {
        status: ClearanceRequestStatus.COMPLETED,
        completedAt: new Date(),
        finalPdfUrl: `https://clearance.school.com/pdf/${requestId}`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: step.request.student.userId,
        requestId,
        title: 'Clearance Completed!',
        message: 'All steps approved. Download your certificate and access NYSC form.',
        type: 'SUCCESS',
      },
    });
  } else {
    const nextStep = step.request.steps[step.stepNumber];
    await prisma.clearanceRequest.update({
      where: { id: requestId },
      data: {
        currentStep: step.stepNumber + 1,
        status: ClearanceRequestStatus.IN_PROGRESS,
      },
    });

    await prisma.notification.create({
      data: {
        userId: step.request.student.userId,
        requestId,
        title: `Step ${step.stepNumber} Approved`,
        message: `Moving to step ${step.stepNumber + 1}: ${nextStep.officeName}`,
        type: 'SUCCESS',
      },
    });

    if (nextStep?.officerId) {
      const nextOfficer = await prisma.officer.findUnique({
        where: { id: nextStep.officerId },
      });
      if (nextOfficer) {
        await prisma.notification.create({
          data: {
            userId: nextOfficer.userId,
            requestId,
            title: 'Clearance Pending',
            message: `${step.request.student.firstName} ${step.request.student.lastName}'s clearance needs your approval`,
            type: 'ACTION_REQUIRED',
          },
        });
      }
    }
  }

  return { success: true };
}

export async function rejectStep(
  requestId: string,
  stepId: string,
  officerId: string,
  reason: string
) {
  const step = await prisma.clearanceProgress.findFirst({
    where: { requestId, stepId, officerId },
    include: { request: { include: { student: { include: { user: true } } } } },
  });

  if (!step) throw new Error('Step not found');
  if (step.status !== StepStatus.PENDING) throw new Error('Step already processed');

  await prisma.clearanceProgress.update({
    where: { id: step.id },
    data: { status: StepStatus.REJECTED, comment: reason, actionedAt: new Date() },
  });

  await prisma.clearanceRequest.update({
    where: { id: requestId },
    data: { status: ClearanceRequestStatus.REJECTED },
  });

  await prisma.notification.create({
    data: {
      userId: step.request.student.userId,
      requestId,
      title: 'Clearance Rejected',
      message: `Step ${step.stepNumber} rejected. Reason: ${reason}`,
      type: 'WARNING',
    },
  });

  return { success: true };
}
