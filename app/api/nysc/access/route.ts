import { NextRequest as NYSCNextRequest, NextResponse as NYSCNextResponse } from 'next/server';
import { getCurrentUser as getUserNYSC } from '@/lib/auth';
import { prisma as prismaNYSC } from '@/lib/prisma';
import { ClearanceRequestStatus as NStatus } from '@prisma/client';

export async function GET(request: NYSCNextRequest) {
  const user = await getUserNYSC();
  
  if (!user?.student) {
    return NYSCNextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if student has completed clearance
  const completedRequest = await prismaNYSC.clearanceRequest.findFirst({
    where: {
      studentId: user.student.id,
      status: NStatus.COMPLETED,
      isDeleted: false,
    },
    orderBy: { completedAt: 'desc' },
  });

  if (!completedRequest) {
    return NYSCNextResponse.json(
      { error: 'You must complete clearance before accessing NYSC form' },
      { status: 403 }
    );
  }

  // Check if NYSC form already exists
  let nyscForm = await prismaNYSC.nYSCForm.findUnique({
    where: { studentId: user.student.id },
  });

  if (!nyscForm) {
    const student = user.student;
    const formNumber = `NYSC-${Date.now()}-${student.matricNumber}`;
    
    // In production, generate actual PDF here
    const formUrl = `https://clearance.school.com/nysc-forms/${student.id}.pdf`;

    nyscForm = await prismaNYSC.nYSCForm.create({
      data: {
        studentId: user.student.id,
        formNumber,
        formUrl,
        status: 'generated',
      },
    });
  }

  // Mark as accessed
  await prismaNYSC.clearanceRequest.update({
    where: { id: completedRequest.id },
    data: { nyscAccessed: true },
  });

  return NYSCNextResponse.json({ success: true, data: nyscForm });
}
