'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthBridgeContent() {
    const searchParams = useSearchParams();
    const reference = searchParams.get('ref');
    const returnUrl = searchParams.get('returnUrl') || '';

    const [status, setStatus] = useState('Initializing bridge...');
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (!reference) {
            setError('Missing reference ID. Please try logging in again.');
            return;
        }

        const authenticate = async () => {
            try {
                setStatus('Exchanging reference for token...');

                // 1. Get User Token Using Reference (via our secure proxy)
                const res = await fetch('/api/auth/exchange-ref', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ref: reference })
                });

                if (!res.ok) {
                    throw new Error('Failed to exchange reference. Session may be expired.');
                }

                const data = await res.json();
                const token = data.token;

                if (!token) throw new Error('No token received');

                setStatus('Parsing user data...');

                // 2. Parse JWT Token to JSON Object
                // Split: The JWT string is split by the . character
                // Select: The second part (the payload) is selected
                const payloadStr = token.split('.')[1];

                // Sanitize: URL-safe characters replaced
                const sanitizedBase64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');

                // Decode: atob() function decodes the Base64 string into a JSON string
                // We use decodeURIComponent/escape to handle UTF-8 properly
                const decodedJsonStr = decodeURIComponent(
                    atob(sanitizedBase64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join('')
                );

                // Convert: JSON.parse() converts that string into a functional JSON object
                const userData = JSON.parse(decodedJsonStr);

                // Optimization: Strip large base64 strings from userData before bridging
                // These are often too large for POST payloads and headers (413 Payload Too Large)
                // We will fetch fresh data on the server anyway.
                if (userData.profilePictureUrl && userData.profilePictureUrl.startsWith('data:')) {
                    console.log('[Auth Bridge] Stripping large profilePictureUrl from userData');
                    delete userData.profilePictureUrl;
                }
                if (userData.signatureUrl && userData.signatureUrl.startsWith('data:')) {
                    console.log('[Auth Bridge] Stripping large signatureUrl from userData');
                    delete userData.signatureUrl;
                }

                // Ensure userId is mapped to _id field if it doesn't exist
                if (userData.userId && !userData._id) {
                    userData._id = userData.userId;
                } else if (userData._id && !userData.userId) {
                    userData.userId = userData._id;
                }

                setStatus('Establishing local session...');

                // 3. Final Submission
                // Populate the hidden inputs
                const tokenInput = document.getElementById('tokenInput') as HTMLInputElement;
                const userDataInput = document.getElementById('userDataInput') as HTMLInputElement;
                const returnUrlInput = document.getElementById('returnUrlInput') as HTMLInputElement;

                if (tokenInput && userDataInput && returnUrlInput && formRef.current) {
                    tokenInput.value = token;
                    userDataInput.value = JSON.stringify(userData);
                    returnUrlInput.value = returnUrl;

                    // Automatically submit to our backend
                    formRef.current.submit();
                } else {
                    throw new Error('Form injection failed');
                }

            } catch (err: any) {
                console.error('[Auth Bridge] Error:', err);
                setError(err.message || 'Authentication bridging failed');
            }
        };

        authenticate();
    }, [reference, returnUrl]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 border-t-4 border-emerald-600">
            <div className="p-8 bg-white shadow-xl rounded-xl max-w-md w-full text-center border border-gray-100">
                <div className="mb-6 flex justify-center">
                    <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">Authenticating</h2>

                {error ? (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                        <p className="font-semibold">Authentication Error</p>
                        <p className="mt-1">{error}</p>
                        <a href="/" className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 transition">
                            Return Home
                        </a>
                    </div>
                ) : (
                    <div className="mt-4 flex flex-col items-center">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                            <div className="bg-emerald-600 h-1.5 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" style={{ width: '45%' }}></div>
                        </div>
                        <p className="text-sm text-gray-500 animate-pulse">{status}</p>
                    </div>
                )}
            </div>

            {/* The hidden form for Step 3: Final Submission */}
            <form
                ref={formRef}
                action="/api/auth/bridge-session"
                method="POST"
                className="hidden"
            >
                <input type="hidden" name="token" id="tokenInput" />
                <input type="hidden" name="userData" id="userDataInput" />
                <input type="hidden" name="returnUrl" id="returnUrlInput" />
            </form>

            <style jsx global>{`
                @keyframes progress {
                    0% { width: 0%; transform: translateX(0); }
                    50% { width: 40%; transform: translateX(30%); }
                    100% { width: 100%; transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}

export default function AuthBridgePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        }>
            <AuthBridgeContent />
        </Suspense>
    );
}
