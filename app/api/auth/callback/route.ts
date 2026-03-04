import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setAuthCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('ref');

    // 1. Validation
    if (!reference) {
        console.error('[Auth Callback] Missing reference ID');
        return NextResponse.redirect(new URL('/?error=missing_ref', request.url));
    }

    console.log('[Auth Callback] Processing reference:', reference);

    try {
        // 2. Server-to-Server Verification
        const coreApiUrl = process.env.CORE_API_URL || 'https://coreeksu.vercel.app';
        const coreSecret = process.env.CORE_SYSTEM_SECRET;

        if (!coreSecret) {
            console.error('[Auth Callback] Configuration Error: CORE_SYSTEM_SECRET is missing');
            return NextResponse.redirect(new URL('/?error=config_error', request.url));
        }

        const verifyUrl = `${coreApiUrl}/api/verify-session`;
        console.log(`[Auth Callback] Verifying session with Core API: ${verifyUrl}`);

        let response;
        try {
            response = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${coreSecret}`,
                },
                body: JSON.stringify({ reference }),
                cache: 'no-store'
            });
        } catch (fetchError: any) {
            console.error('[Auth Callback] Network Error reaching Core API:', fetchError.message);
            return NextResponse.redirect(new URL(`/?error=network_error&msg=${encodeURIComponent(fetchError.message)}`, request.url));
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No body');
            console.error('[Auth Callback] Session verification failed:', response.status, errorText);

            // Handle specific error cases
            if (response.status === 410) {
                return NextResponse.redirect(new URL('/?error=reference_already_used', request.url));
            }
            if (response.status === 401) {
                return NextResponse.redirect(new URL('/?error=unauthorized_system_secret', request.url));
            }
            if (response.status === 404) {
                return NextResponse.redirect(new URL('/?error=reference_not_found', request.url));
            }

            return NextResponse.redirect(new URL(`/?error=verification_failed&status=${response.status}`, request.url));
        }

        const data = await response.json();
        const { token, user } = data;

        if (!token || !user) {
            console.error('[Auth Callback] Invalid response structure from Core API:', data);
            return NextResponse.redirect(new URL('/?error=invalid_response', request.url));
        }

        console.log('[Auth Callback] Session successfully verified for:', user.email, 'as', user.role);

        // 3. Determine redirect URL based on role
        let redirectUrl = '/';
        const normalizedRole = (user.role || '').toUpperCase();

        if (normalizedRole === 'STUDENT') {
            redirectUrl = '/student/dashboard';
        } else if (normalizedRole === 'OFFICER' || normalizedRole === 'STAFF') {
            redirectUrl = '/officer/dashboard';
        } else if (['ADMIN', 'SUPER_ADMIN'].includes(normalizedRole)) {
            redirectUrl = '/admin/dashboard';
        }

        // Check for custom return URL
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl && returnUrl.startsWith('/')) {
            redirectUrl = returnUrl;
        }

        // 4. Establish Session (Set Cookie)
        const hostname = new URL(request.url).hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const isSecure = process.env.NODE_ENV === 'production' && !isLocalhost;

        console.log(`[Auth Callback] Setting cookies. Host: ${hostname}, isSecure: ${isSecure}, redirecting to: ${redirectUrl}`);

        const responseRedirect = NextResponse.redirect(new URL(redirectUrl, request.url), {
            status: 302
        });

        const cookieOptions = {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        };

        responseRedirect.cookies.set('auth_token', token, cookieOptions);
        responseRedirect.cookies.set('token', token, cookieOptions);

        if (user.id || user._id) {
            const userId = user.id || user._id;
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
        console.error('[Auth Callback] CRITICAL UNEXPECTED ERROR:', error);
        // Ensure we always return a redirect even on error to prevent blank pages or generic 500s
        try {
            return NextResponse.redirect(new URL(`/?error=server_error&msg=${encodeURIComponent(error.message || 'Unknown')}`, request.url));
        } catch (redirectError) {
            return new NextResponse('Internal Server Error during auth callback', { status: 500 });
        }
    }
}

