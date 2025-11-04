import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { StepStatus, ClearanceRequestStatus } from "@prisma/client";


export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.officer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  }

  const pending = await prisma.clearanceProgress.findMany({
    where: {
      officerId: user.officer.id,
      status: StepStatus.PENDING,
      isDeleted: false,
      request: { status: { in: [ClearanceRequestStatus.PENDING, ClearanceRequestStatus.IN_PROGRESS] } },
    },
    include: {
      request: { include: { student: { include: { department: true } } } },
      step: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ data: pending });
}