import prisma from './db';

export async function notify(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  await prisma.notification.create({
    data: { userId, title, message, type },
  });
}

export async function getStudentSteps(studentId: number) {
  return prisma.clearanceProgress.findMany({
    where: { studentId: String(studentId) },
    include: { step: true },
    orderBy: { step: { stepNumber: 'asc' } },
  });
}

export async function getUnlockedStepNo(studentId: number): Promise<number | null> {
  const rows = await getStudentSteps(studentId);
  for (const r of rows) {
    if (r.status !== 'approved') return r.step.stepNumber;
  }
  return null;
}

export async function isStepCurrent(studentId: number, stepId: number): Promise<boolean> {
  const rows = await getStudentSteps(studentId);
  for (const r of rows) {
    if (r.status !== 'approved') {
      return r.stepId === String(stepId);
    }
  }
  return false;
}


