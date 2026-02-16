import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return NextResponse.json({
            status: 'error',
            message: 'JWT_SECRET is not defined'
        }, { status: 500 });
    }

    // Create a SHA-256 hash of the secret to allow comparison without exposing it
    const hash = crypto.createHash('sha256').update(secret).digest('hex');

    return NextResponse.json({
        app: 'Next_clearance',
        secretMetadata: {
            length: secret.length,
            firstFour: secret.substring(0, 4),
            lastFour: secret.substring(secret.length - 4),
            hash: hash
        },
        message: 'Compare this hash with the one from the student-management-platform diagnostic route.'
    });
}
