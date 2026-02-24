/**
 * Middleware-safe authentication utilities
 * 
 * This module provides JWT verification that works in Edge Runtime (middleware).
 * It does NOT import Prisma, which is not compatible with Edge Runtime.
 * 
 * For full user data with database lookups, use lib/auth.ts instead.
 */

import { jwtVerify } from 'jose';

// Enforce secret presence
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET;
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
    // Officer fields
    officeRole?: string;
    assignedOffices?: string[];
    assignedDepartmentId?: string;
    assignedDepartmentName?: string;
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
            role: (function () {
                const r = String(raw.role || '').toUpperCase();
                if (r === 'STAFF' || r === 'OFFICIAL') return 'OFFICER';
                if (r === 'GENERAL') return 'STUDENT';
                return r;
            })(),
            matricNumber: raw.matricNumber ? String(raw.matricNumber) : undefined,
            name: raw.name ? String(raw.name) : undefined,
            phoneNumber: raw.phoneNumber ? String(raw.phoneNumber) : undefined,
            profilePictureUrl: raw.profilePictureUrl ? String(raw.profilePictureUrl) : undefined,
            department: raw.department ? String(raw.department) : undefined,
            gender: raw.gender ? String(raw.gender) : undefined,
            admissionYear: typeof raw.admissionYear === 'number' ? raw.admissionYear : undefined,
            yearsSinceAdmission: typeof raw.yearsSinceAdmission === 'number' ? raw.yearsSinceAdmission : undefined,
            // Officer fields - handle 'position' fallback from Core platform
            officeRole: (function () {
                if (raw.officeRole) return String(raw.officeRole);
                if (raw.position) {
                    const pos = String(raw.position).toUpperCase();
                    if (pos.includes('HOD') || pos.includes('HEAD OF DEPARTMENT')) return 'HOD';
                    if (pos.includes('DEAN')) return 'DEAN';
                    if (pos.includes('BURSAR')) return 'BURSAR';
                    if (pos.includes('LIBRARIAN') || pos.includes('LIBRARY')) return 'LIBRARY';
                    if (pos.includes('REGISTRAR')) return 'REGISTRAR';
                    if (pos.includes('SPORTS')) return 'SPORTS';
                    if (pos.includes('CLINIC') || pos.includes('MEDICAL')) return 'CLINIC';
                    return pos;
                }
                return undefined;
            })(),
            assignedOffices: Array.isArray(raw.assignedOffices) ? raw.assignedOffices : undefined,
            assignedDepartmentId: raw.assignedDepartmentId ? String(raw.assignedDepartmentId) : undefined,
            assignedDepartmentName: raw.assignedDepartmentName ? String(raw.assignedDepartmentName) : undefined,
        };

        return normalized;
    } catch (error) {
        const secretPreview = JWT_SECRET ? `${JWT_SECRET.substring(0, 4)}... (len: ${JWT_SECRET.length})` : 'MISSING';
        console.error('[verifyTokenEdge] Token verification failed:', {
            error: error instanceof Error ? error.message : error,
            code: (error as any).code,
            secretPreview: secretPreview
        });
        return null;
    }
}
