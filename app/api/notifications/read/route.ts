import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { notificationId } = body;

  await prisma.notification.update({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}