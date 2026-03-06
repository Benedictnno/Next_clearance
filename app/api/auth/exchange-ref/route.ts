import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ref } = body;

        if (!ref) {
            return NextResponse.json({ success: false, error: 'Missing reference ID' }, { status: 400 });
        }

        const coreApiUrl = process.env.CORE_API_URL || 'https://coreeksu.vercel.app';
        const coreSecret = process.env.CORE_SYSTEM_SECRET;

        if (!coreSecret) {
            console.error('[Auth Exchange] Configuration Error: CORE_SYSTEM_SECRET is missing');
            return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
        }

        const verifyUrl = `${coreApiUrl}/api/verify-session`;
        console.log(`[Auth Exchange] Swapping ref with Core API: ${verifyUrl}`);

        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${coreSecret}`,
            },
            body: JSON.stringify({ reference: ref }),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Auth Exchange] Core API rejected ref:', response.status, errorText);
            return NextResponse.json({ success: false, error: 'Invalid or expired reference' }, { status: response.status });
        }

        const data = await response.json();

        if (!data.token) {
            return NextResponse.json({ success: false, error: 'No token received from Core' }, { status: 500 });
        }

        return NextResponse.json({ success: true, token: data.token });

    } catch (error: any) {
        console.error('[Auth Exchange] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
