import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { notificationService } from '@/lib/notificationService';
import { z } from 'zod';

const MarkReadSchema = z.object({
  notificationId: z.string().optional(),
  markAll: z.boolean().optional().default(false),
});

// Mark notification(s) as read
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = MarkReadSchema.parse(body);

    if (markAll) {
      const count = await notificationService.markAllAsRead(String(session.userId));
      return NextResponse.json({
        success: true,
        message: `Marked ${count} notifications as read`,
        count
      });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const success = await notificationService.markAsRead(notificationId, String(session.userId));
    
    if (!success) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read', message: error.message },
      { status: 500 }
    );
  }
}
