import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, setAuthCookie, JWTPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applySecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  // Type-safe payload
  const payload = decoded as any;

  // Find or create user
  let user = await prisma.user.findFirst({
    where: { OR: [{ id: payload.userId }, { email: payload.email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: payload.userId,
        email: payload.email,
        role: payload.role || 'STUDENT',
        externalId: payload.externalId,
      },
    });
  }

  // Set cookie
  await setAuthCookie(token);

  // Redirect based on role
  const redirectUrl =
    user.role === 'STUDENT'
      ? '/student/dashboard'
      : user.role === 'OFFICER'
      ? '/officer/dashboard'
      : '/admin/dashboard';

  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  return applySecurityHeaders(response);
}