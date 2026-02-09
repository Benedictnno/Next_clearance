import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge as verifyToken } from './lib/auth-edge';

// CoreEKSU base URL for redirects
const COREEKSU_LOGIN_URL = 'https://coreeksu.vercel.app/login';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/api/auth/verify', '/api/auth/logout'];

// Routes that require authentication
const PROTECTED_ROUTE_PREFIXES = [
  '/student',
  '/officer',
  '/admin',
  '/api/student',
  '/api/officer',
  '/api/admin',
  '/api/clearance',
  '/api/notifications',
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Get token from URL or cookies
  const tokenFromUrl = searchParams.get('token');
  const tokenFromCookie = request.cookies.get('auth_token')?.value;

  // Also check for userId from CoreEKSU
  const userIdFromUrl = searchParams.get('userId');

  // ============================================
  // STEP 1: Handle new reference-based auth flow (from CoreEKSU redirect)
  // ============================================
  const referenceFromUrl = searchParams.get('ref');
  const isAuthCallback = pathname.startsWith('/api/auth/callback');

  if (referenceFromUrl && !isAuthCallback) {
    console.log('[Middleware] Detected reference-based auth, redirecting to callback handler...');

    // Redirect to the auth callback route which will handle verification
    // Preserve any returnUrl parameter
    const callbackUrl = new URL('/api/auth/callback', request.url);
    callbackUrl.searchParams.set('ref', referenceFromUrl);

    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/')) {
      callbackUrl.searchParams.set('returnUrl', returnUrl);
    }

    return NextResponse.redirect(callbackUrl);
  }

  // ============================================
  // STEP 2: Handle legacy token in URL (DEPRECATED - for backward compatibility)
  // ============================================
  if (tokenFromUrl) {
    console.log('[Middleware] Processing legacy token from URL (DEPRECATED)...');

    const payload = await verifyToken(tokenFromUrl);

    if (!payload) {
      console.log('[Middleware] Invalid token, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('[Middleware] Token verified for:', payload.email, 'role:', payload.role);

    // Determine redirect URL based on role
    let redirectUrl = '/';
    if (payload.role === 'STUDENT') {
      redirectUrl = '/student/dashboard';
    } else if (payload.role === 'OFFICER') {
      redirectUrl = '/officer/dashboard';
    } else if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
      redirectUrl = '/admin/dashboard';
    }

    // Check if there's a custom return URL
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/')) {
      redirectUrl = returnUrl;
    }

    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    // Set HttpOnly cookie for future requests
    response.cookies.set('auth_token', tokenFromUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Also store userId in a readable cookie if available from payload
    if (payload.userId) {
      response.cookies.set('userId', payload.userId, {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    console.log('[Middleware] Cookie set, redirecting to:', redirectUrl);
    return response;
  }

  // ============================================
  // STEP 2: Handle userId in URL (alternative CoreEKSU flow)
  // ============================================
  if (userIdFromUrl && !tokenFromCookie) {
    console.log('[Middleware] userId in URL but no token cookie - storing userId');

    // Build a clean URL without the userId
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete('userId');

    const response = NextResponse.redirect(cleanUrl);

    // Store userId in readable cookie
    response.cookies.set('userId', userIdFromUrl, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  }

  // ============================================
  // STEP 3: Check if route is protected and user is authenticated
  // ============================================
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix =>
    pathname.startsWith(prefix)
  );
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isProtectedRoute && !isPublicRoute) {
    // Check for valid auth cookie
    if (!tokenFromCookie) {
      console.log('[Middleware] No auth cookie for protected route:', pathname);

      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized - No authentication token' },
          { status: 401 }
        );
      }

      // For page routes, redirect to home (or CoreEKSU login)
      // You can change this to redirect to COREEKSU_LOGIN_URL if preferred
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Verify the token is still valid
    const payload = await verifyToken(tokenFromCookie);
    if (!payload) {
      console.log('[Middleware] Invalid/expired token for:', pathname);

      // Clear the invalid cookie
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
        : NextResponse.redirect(new URL('/', request.url));

      response.cookies.delete('auth_token');
      return response;
    }

    // Check role-based access
    const roleChecks = {
      '/student': ['STUDENT'],
      '/officer': ['OFFICER'],
      '/admin': ['ADMIN', 'SUPER_ADMIN'],
      '/api/student': ['STUDENT'],
      '/api/officer': ['OFFICER'],
      '/api/admin': ['ADMIN', 'SUPER_ADMIN'],
    };

    for (const [prefix, allowedRoles] of Object.entries(roleChecks)) {
      if (pathname.startsWith(prefix)) {
        // SUPER_ADMIN can access everything
        if (payload.role !== 'SUPER_ADMIN' && !allowedRoles.includes(payload.role)) {
          console.log(`[Middleware] Role mismatch: ${payload.role} tried to access ${pathname}`);

          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: `Forbidden - Requires role: ${allowedRoles.join(' or ')}` },
              { status: 403 }
            );
          }

          // Redirect to their appropriate dashboard
          let correctDashboard = '/';
          if (payload.role === 'STUDENT') correctDashboard = '/student/dashboard';
          else if (payload.role === 'OFFICER') correctDashboard = '/officer/dashboard';
          else if (payload.role === 'ADMIN') correctDashboard = '/admin/dashboard';

          return NextResponse.redirect(new URL(correctDashboard, request.url));
        }
        break;
      }
    }
  }

  // ============================================
  // STEP 4: Allow request to continue
  // ============================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};