import prisma from './prisma';
import { notificationService } from './notificationService';

export async function notify(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  // Use the enhanced notification service
  await notificationService.createNotification(userId, title, message, type);

  // Also create in Prisma for backward compatibility
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type.toUpperCase() as any
      },
    });
  } catch (error) {
    console.warn('Failed to create notification in Prisma:', error);
    // Continue with MongoDB notification
  }
}

export async function getStudentSteps(studentId: number) {
  return prisma.clearanceProgress.findMany({
    where: {
      request: {
        studentId: String(studentId)
      }
    },
    include: { step: true },
    orderBy: { step: { stepNumber: 'asc' } },
  });
}

export async function getUnlockedStepNo(studentId: number): Promise<number | null> {
  const rows = await getStudentSteps(studentId);
  for (const r of rows) {
    if (r.status !== 'APPROVED' && r.step) return r.step.stepNumber;
  }
  return null;
}

export async function isStepCurrent(studentId: number, stepId: number): Promise<boolean> {
  const rows = await getStudentSteps(studentId);
  for (const r of rows) {
    if (r.status !== 'APPROVED') {
      return r.stepId === String(stepId);
    }
  }
  return false;
}


