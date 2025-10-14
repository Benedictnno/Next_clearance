import prisma from './db';

export async function notify(userType: 'student' | 'admin' | 'officer', userId: number, message: string) {
  await prisma.notifications.create({
    data: { user_type: userType, user_id: userId, message, created_at: new Date() },
  });
}

export async function getStudentSteps(studentId: number) {
  return prisma.student_clearance_progress.findMany({
    where: { student_id: studentId },
    include: { clearance_steps: true },
    orderBy: { clearance_steps: { step_no: 'asc' } },
  });
}

export async function getUnlockedStepNo(studentId: number): Promise<number | null> {
  const rows = await getStudentSteps(studentId);
  for (const r of rows) {
    if (r.status !== 'approved') return r.clearance_steps.step_no as unknown as number;
  }
  return null;
}

export async function isStepCurrent(studentId: number, stepId: number): Promise<boolean> {
  const rows = await getStudentSteps(studentId);
  for (const r of rows) {
    if (r.status !== 'approved') {
      return r.step_id === stepId;
    }
  }
  return false;
}


