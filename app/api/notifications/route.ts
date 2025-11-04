import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import  prisma  from '@/lib/prisma';

// Ensure Node.js runtime (Prisma requires Node)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('Error fetching notifications via Prisma:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', message: error?.message },
      { status: 500 }
    );
  }
}