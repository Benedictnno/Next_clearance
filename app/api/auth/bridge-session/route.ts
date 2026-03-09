import { NextRequest, NextResponse } from 'next/server';
import { createSession, stripLargeBase64 } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        // token is the original Core EKSU token (potentially very large)
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

        console.log(`[Bridge Session] Establishing session and redirecting to: ${redirectUrl}`);

        // Create a NEW, smaller session token using our local secret
        // instead of using the huge Core EKSU token directly as a cookie.
        // cookies() in createSession only works in Server Actions/Components, 
        // but we can manually set the resulting token on our response object.
        const sessionResult = await createSession(userData);
        const sessionToken = sessionResult.success ? sessionResult.token : token;

        const responseRedirect = NextResponse.redirect(new URL(redirectUrl, request.url), 303);

        // Use the auth cookie helper if possible, or manual cookies here
        const cookieOptions = {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        };

        // Set the session token (which is now stripped of large base64 strings)
        responseRedirect.cookies.set('auth_token', sessionToken as string, cookieOptions);
        // Set legacy fallback token
        responseRedirect.cookies.set('token', sessionToken as string, cookieOptions);

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
