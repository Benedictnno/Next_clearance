import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';

async function testCompatibility() {
    const secret = 'uYvHjivsWmgu9_HBaDGXCQNWxQK-2RjmJ4Gu3c8ydMY';
    const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'student'
    };

    console.log('--- JWT Compatibility Test ---');
    console.log('Secret:', secret);

    // 1. Sign with jsonwebtoken (used in student-management-platform)
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    console.log('Generated Token (jsonwebtoken):', token);

    // 2. Verify with jose (used in Next_clearance)
    try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
        console.log('Verification Success (jose)');
        console.log('Verified Payload:', verifiedPayload);

        if (verifiedPayload.userId === payload.userId && verifiedPayload.email === payload.email) {
            console.log('✅ Result: jsonwebtoken and jose are COMPATIBLE with this secret.');
        } else {
            console.log('❌ Result: Payload mismatch!');
        }
    } catch (error) {
        console.error('❌ Verification Failed (jose):', error.message);
        if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
            console.log('This matches the error reported by the user.');
        }
    }
}

testCompatibility();
