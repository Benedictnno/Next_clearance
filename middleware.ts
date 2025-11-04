import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Get token from URL or cookies
  const tokenFromUrl = searchParams.get('token');
  const tokenFromCookie = request.cookies.get('auth_token')?.value;
  
  if (tokenFromUrl) {
    console.log('Processing token from URL...');
    
    const payload = await verifyToken(tokenFromUrl);
    
    if (!payload) {
      console.log('Invalid token, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('Token verified, payload:', payload);

    // Create response with redirect
    let redirectUrl = '/';
    if (payload.role === 'STUDENT') {
      redirectUrl = '/student/dashboard';
    } else if (payload.role === 'OFFICER') {
      redirectUrl = '/officer/dashboard';
    } else if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
      redirectUrl = '/admin/dashboard';
    }

    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    // Set the cookie for future requests
    response.cookies.set('auth_token', tokenFromUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('Cookie set, redirecting to:', redirectUrl);
    return response;
  }


  // Default: allow request to continue
  console.log('Allowing request to continue');
  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes that need token verification
  matcher: [
    '/',
    '/student/:path*',
    '/officer/:path*',
    '/admin/:path*',
    // API routes that need authentication
    '/api/student/:path*',
    '/api/officer/:path*',
    '/api/admin/:path*',
    '/api/clearance/:path*',
    '/api/notifications/:path*',
  ],
  runtime: 'nodejs',
};