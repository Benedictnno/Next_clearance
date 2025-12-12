/**
 * Middleware-safe authentication utilities
 * 
 * This module provides JWT verification that works in Edge Runtime (middleware).
 * It does NOT import Prisma, which is not compatible with Edge Runtime.
 * 
 * For full user data with database lookups, use lib/auth.ts instead.
 */

import { jwtVerify } from 'jose';

// Use the same secret as the main auth module
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

/**
 * JWT Payload structure
 */
export interface MiddlewareJWTPayload {
    userId: string;
    email: string;
    role: string;
    matricNumber?: string;
    name?: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
    department?: string;
    gender?: string;
    admissionYear?: number;
    yearsSinceAdmission?: number;
}

/**
 * Verify JWT token in Edge Runtime (middleware-safe)
 * 
 * This function uses the 'jose' library which is Edge-compatible.
 * It does NOT perform any database lookups.
 * 
 * @param token - JWT token string
 * @returns Normalized payload or null if invalid
 */
export async function verifyTokenEdge(token: string): Promise<MiddlewareJWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);

        // Check for required fields
        const raw = payload as Record<string, unknown>;
        if (!raw.email || !raw.role || (!raw._id && !raw.userId)) {
            console.error('[verifyTokenEdge] Token missing required fields:', {
                hasEmail: !!raw.email,
                hasRole: !!raw.role,
                hasId: !!(raw._id || raw.userId)
            });
            return null;
        }

        // Normalize payload to our expected structure
        const normalized: MiddlewareJWTPayload = {
            userId: String(raw._id || raw.userId),
            email: String(raw.email),
            role: String(raw.role || '').toUpperCase(),
            matricNumber: raw.matricNumber ? String(raw.matricNumber) : undefined,
            name: raw.name ? String(raw.name) : undefined,
            phoneNumber: raw.phoneNumber ? String(raw.phoneNumber) : undefined,
            profilePictureUrl: raw.profilePictureUrl ? String(raw.profilePictureUrl) : undefined,
            department: raw.department ? String(raw.department) : undefined,
            gender: raw.gender ? String(raw.gender) : undefined,
            admissionYear: typeof raw.admissionYear === 'number' ? raw.admissionYear : undefined,
            yearsSinceAdmission: typeof raw.yearsSinceAdmission === 'number' ? raw.yearsSinceAdmission : undefined,
        };

        return normalized;
    } catch (error) {
        console.error('[verifyTokenEdge] Token verification failed:', error);
        return null;
    }
}
