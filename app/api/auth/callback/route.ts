import { NextRequest, NextResponse } from 'next/server';
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
        const coreApiUrl = process.env.CORE_API_URL;
        const coreSecret = process.env.CORE_SYSTEM_SECRET;

        if (!coreApiUrl || !coreSecret) {
            console.error('[Auth Callback] Configuration Error: CORE_API_URL or CORE_SYSTEM_SECRET is missing');
            return NextResponse.redirect(new URL('/?error=config_error', request.url));
        }

        console.log(`[Auth Callback] Verifying session with Core API: ${coreApiUrl}/api/verify-session`);

        let response;
        try {
            response = await fetch(`${coreApiUrl}/api/verify-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${coreSecret}`,
                },
                body: JSON.stringify({ reference }),
                // Add a timeout if possible or handle potential network errors
                cache: 'no-store'
            });
        } catch (fetchError: any) {
            console.error('[Auth Callback] Network Error reaching Core API:', fetchError.message);
            return NextResponse.redirect(new URL(`/?error=network_error&msg=${encodeURIComponent(fetchError.message)}`, request.url));
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            const errorMsg = errorData.message || 'Verification failed';
            console.error('[Auth Callback] Session verification failed:', response.status, errorMsg);

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

            return NextResponse.redirect(new URL(`/?error=verification_failed&status=${response.status}&msg=${encodeURIComponent(errorMsg)}`, request.url));
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
        } else if (normalizedRole === 'OFFICER') {
            redirectUrl = '/officer/dashboard';
        } else if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN') {
            redirectUrl = '/admin/dashboard';
        }

        // Check for custom return URL
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl && returnUrl.startsWith('/')) {
            redirectUrl = returnUrl;
        }

        // 4. Establish Session (Set Cookie)
        const res = NextResponse.redirect(new URL(redirectUrl, request.url));

        // Set the token in a secure, HTTP-only cookie
        res.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Also store userId in a readable cookie if available
        if (user.id || user._id) {
            const userId = user.id || user._id;
            res.cookies.set('userId', userId.toString(), {
                httpOnly: false, // Allow client-side access
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });
        }

        console.log('[Auth Callback] Auth cookies established, redirecting to:', redirectUrl);
        return res;

    } catch (error: any) {
        console.error('[Auth Callback] CRITICAL UNEXPECTED ERROR:', error);
        return NextResponse.redirect(new URL(`/?error=server_error&msg=${encodeURIComponent(error.message || 'Unknown')}`, request.url));
    }
}
