import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const token = formData.get('token') as string;
        const userDataStr = formData.get('userData') as string;
        const returnUrl = formData.get('returnUrl') as string;

        if (!token || !userDataStr) {
            console.error('[Bridge Session] Missing token or user data');
            return NextResponse.redirect(new URL('/?error=invalid_bridge_data', request.url), 303);
        }

        // Parse the user data
        let userData;
        try {
            userData = JSON.parse(userDataStr);
        } catch (e) {
            console.error('[Bridge Session] Failed to parse user data:', e);
            return NextResponse.redirect(new URL('/?error=invalid_user_data', request.url), 303);
        }

        // Establish the cookies using lib/auth
        const hostname = new URL(request.url).hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isSecure = process.env.NODE_ENV === 'production' && !isLocalhost;

        // Determine redirect URL based on role
        let redirectUrl = '/';
        const normalizedRole = (userData.role || '').toUpperCase();

        if (normalizedRole === 'STUDENT') {
            redirectUrl = '/student/dashboard';
        } else if (normalizedRole === 'OFFICER' || normalizedRole === 'STAFF') {
            redirectUrl = '/officer/dashboard';
        } else if (['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole)) {
            redirectUrl = '/admin/dashboard';
        }

        if (returnUrl && returnUrl.startsWith('/')) {
            redirectUrl = returnUrl;
        }

        console.log(`[Bridge Session] Setting cookies and redirecting to: ${redirectUrl}`);

        const responseRedirect = NextResponse.redirect(new URL(redirectUrl, request.url), 303);

        // Use the auth cookie helper if possible, or manual cookies here
        const cookieOptions = {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        };

        responseRedirect.cookies.set('auth_token', token, cookieOptions);
        // Set legacy fallback token
        responseRedirect.cookies.set('token', token, cookieOptions);

        if (userData.userId || userData._id) {
            const userId = userData.userId || userData._id;
            responseRedirect.cookies.set('userId', userId.toString(), {
                httpOnly: false,
                secure: isSecure,
                sameSite: 'lax' as const,
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });
        }

        return responseRedirect;

    } catch (error: any) {
        console.error('[Bridge Session] Error establishing session:', error);
        return NextResponse.redirect(new URL('/?error=session_error', request.url), 303);
    }
}
