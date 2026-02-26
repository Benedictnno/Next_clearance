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
    faculty?: string;
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
                if (['STAFF', 'OFFICIAL', 'OFFICER', 'OVERSEER', 'STUDENT_AFFAIRS'].includes(r)) return 'OFFICER';
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
                    if (pos.includes('FACULTY OFFICER')) return 'FACULTY_OFFICER';
                    if (pos.includes('ADVANCEMENT') || pos.includes('LINKAGES')) return 'ADVANCEMENT_LINKAGES';
                    if (pos.includes('STUDENT AFFAIRS')) return 'OVERSEER';
                    if (pos.includes('DEAN')) return 'DEAN';
                    if (pos.includes('BURSAR')) return 'BURSAR';
                    if (pos.includes('LIBRARIAN') || pos.includes('LIBRARY')) return 'LIBRARY';
                    if (pos.includes('REGISTRAR') || pos.includes('EXAMS')) return 'EXAMS_TRANSCRIPT';
                    if (pos.includes('SPORTS')) return 'SPORTS';
                    if (pos.includes('CLINIC') || pos.includes('MEDICAL')) return 'CLINIC';
                    if (pos.includes('ALUMNI')) return 'ALUMNI';
                    if (pos.includes('AUDIT')) return 'AUDIT';
                    if (pos.includes('SECURITY')) return 'SECURITY';
                    return pos;
                }
                // Fallback for Student Affairs specifically if identity provider is sparse
                if (String(raw.email).toLowerCase().includes('student_affair')) return 'OVERSEER';
                return undefined;
            })(),
            assignedOffices: Array.isArray(raw.assignedOffices) ? raw.assignedOffices : undefined,
            assignedDepartmentId: raw.assignedDepartmentId ? String(raw.assignedDepartmentId) : undefined,
            assignedDepartmentName: raw.assignedDepartmentName ? String(raw.assignedDepartmentName) : undefined,
            faculty: raw.faculty ? String(raw.faculty) : undefined,
        };

        // AUTHORITATIVE CHECK: Fetch fresh data from Core API if possible
        try {
            const coreResponse = await fetch('https://coreeksu.vercel.app/api/users/me', {
                headers: {
                    'Cookie': `token=${token}`,
                    'Authorization': `Bearer ${token}`
                },
                // Edge runtime compatible options
                cache: 'no-store'
            });

            if (coreResponse.ok) {
                const coreData = await coreResponse.json();
                const coreUser = coreData.user || coreData;

                if (coreUser) {
                    console.log('[verifyTokenEdge] Merging fresh data from Core API for:', coreUser.email);
                    normalized.userId = String(coreUser.id || coreUser._id || normalized.userId);
                    normalized.email = coreUser.email || normalized.email;

                    if (coreUser.role) {
                        normalized.role = (function () {
                            const r = String(coreUser.role).toUpperCase();
                            if (['STAFF', 'OFFICIAL', 'OFFICER', 'OVERSEER', 'STUDENT_AFFAIRS'].includes(r)) return 'OFFICER';
                            if (r === 'GENERAL') return 'STUDENT';
                            return r;
                        })();
                    }

                    // Derive officeRole from position if present in core data
                    if (coreUser.position) {
                        const pos = String(coreUser.position).toUpperCase();
                        if (pos.includes('HOD') || pos.includes('HEAD OF DEPARTMENT')) normalized.officeRole = 'HOD';
                        else if (pos.includes('FACULTY OFFICER')) normalized.officeRole = 'FACULTY_OFFICER';
                        else if (pos.includes('ADVANCEMENT') || pos.includes('LINKAGES')) normalized.officeRole = 'ADVANCEMENT_LINKAGES';
                        else if (pos.includes('DEAN')) normalized.officeRole = 'DEAN';
                        else if (pos.includes('BURSAR')) normalized.officeRole = 'BURSAR';
                        else if (pos.includes('LIBRARIAN') || pos.includes('LIBRARY')) normalized.officeRole = 'LIBRARY';
                        else if (pos.includes('REGISTRAR') || pos.includes('EXAMS')) normalized.officeRole = 'EXAMS_TRANSCRIPT';
                        else if (pos.includes('SPORTS')) normalized.officeRole = 'SPORTS';
                        else if (pos.includes('CLINIC') || pos.includes('MEDICAL')) normalized.officeRole = 'CLINIC';
                        else if (pos.includes('ALUMNI')) normalized.officeRole = 'ALUMNI';
                        else if (pos.includes('AUDIT')) normalized.officeRole = 'AUDIT';
                        else if (pos.includes('SECURITY')) normalized.officeRole = 'SECURITY';
                        else if (pos.includes('STUDENT AFFAIRS')) normalized.officeRole = 'OVERSEER';
                        else normalized.officeRole = pos;
                    }

                    normalized.name = coreUser.name || normalized.name;
                    normalized.matricNumber = coreUser.matricNumber || normalized.matricNumber;
                    normalized.department = coreUser.department || normalized.department;
                    normalized.faculty = coreUser.faculty || normalized.faculty;
                }
            } else {
                const errorText = await coreResponse.text();
                console.error(`[verifyTokenEdge] Core API fetch failed: ${coreResponse.status} - ${errorText}`);
            }
        } catch (fetchError) {
            console.error('[verifyTokenEdge] Failed to fetch fresh user data from Core API (using token payload as fallback):', fetchError);
        }

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
