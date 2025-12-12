import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { securityHeaders } from "@/lib/security";

/**
 * POST /api/auth/officer/auto-profile
 * 
 * Creates or updates an officer profile from CoreEKSU JWT token data.
 * This ensures officers exist in the database with proper office assignments.
 * 
 * Expected JWT payload fields:
 * - _id: External user ID
 * - email: Officer email
 * - name: Full name
 * - role: "OFFICER"
 * - department: Department name (optional)
 * - officeRole: "HOD" | "LIBRARY" | "BURSAR" | etc.
 * - assignedOffices: ["hod", "library", etc.] (optional)
 * - assignedDepartmentId: Department ID for HODs (optional)
 */
export async function POST(req: NextRequest) {
    try {
        // Get the JWT token from the Authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { success: false, message: "Unauthorized access" },
                { status: 401, headers: securityHeaders }
            );
        }

        const token = authHeader.split(" ")[1];

        // Decode and validate JWT
        const decoded = await verifyToken(token as string);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: "Unauthorized access" },
                { status: 401, headers: securityHeaders }
            );
        }

        // Normalize decoded payload for type-safe access
        const payload: {
            _id: string;
            email: string;
            role: string;
            name: string;
            department?: string;
            officeRole?: string;
            assignedOffices?: string[];
            assignedDepartmentId?: string;
            assignedDepartmentName?: string;
            phoneNumber?: string;
        } = decoded as any;

        // Validate required fields in JWT payload
        const requiredFields = ["_id", "email", "role", "name"] as const;

        for (const field of requiredFields) {
            if (!payload[field as keyof typeof payload]) {
                return NextResponse.json(
                    { success: false, message: `Invalid token data: missing ${field}` },
                    { status: 400, headers: securityHeaders }
                );
            }
        }

        // Ensure role is officer (case-insensitive)
        if (payload.role?.toUpperCase() !== "OFFICER") {
            return NextResponse.json(
                { success: false, message: "Invalid role: must be an officer" },
                { status: 400, headers: securityHeaders }
            );
        }

        // Find or create user by externalId or email
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { externalId: String(payload._id) },
                    { email: String(payload.email) }
                ]
            }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: String(payload.email),
                    externalId: String(payload._id),
                    name: payload.name,
                    role: 'OFFICER',
                }
            });
            console.log(`Created new user for officer: ${user.id}`);
        }

        // Check if officer already exists in database
        let officer = await prisma.officer.findFirst({
            where: {
                OR: [
                    { userId: user.id },
                ]
            },
            include: { user: true, department: true }
        });

        // Find or create department if specified
        let department = null;
        if (payload.department) {
            department = await prisma.department.findFirst({
                where: { name: String(payload.department) }
            });

            if (!department) {
                department = await prisma.department.create({
                    data: { name: String(payload.department) }
                });
                console.log(`Auto-created department: ${payload.department}`);
            }
        }

        // Determine assigned offices from payload or defaults
        let assignedOffices: string[] = [];
        if (payload.assignedOffices && Array.isArray(payload.assignedOffices)) {
            assignedOffices = payload.assignedOffices;
        } else if (payload.officeRole) {
            // Infer from officeRole if assignedOffices not provided
            const roleToOffice: Record<string, string[]> = {
                'HOD': ['hod'],
                'LIBRARY': ['library'],
                'BURSAR': ['bursar'],
                'SPORTS': ['sports'],
                'CLINIC': ['clinic'],
                'DEAN': ['dean'],
                'REGISTRAR': ['registrar'],
                'ADMIN': ['admin'],
            };
            assignedOffices = roleToOffice[payload.officeRole.toUpperCase()] || [payload.officeRole.toLowerCase()];
        }

        // If officer doesn't exist, create a new profile
        if (!officer) {
            const created = await prisma.officer.create({
                data: {
                    userId: user.id,
                    name: payload.name,
                    departmentId: department?.id,
                    role: payload.officeRole || undefined,
                    assignedOffices: assignedOffices,
                    assignedDepartmentId: payload.assignedDepartmentId || (payload.officeRole?.toUpperCase() === 'HOD' ? department?.id : undefined),
                    assignedDepartmentName: payload.assignedDepartmentName || (payload.officeRole?.toUpperCase() === 'HOD' ? department?.name : undefined),
                    assignedOfficeId: assignedOffices[0] || undefined,
                    assignedOfficeName: payload.officeRole || undefined,
                }
            });
            console.log(`Created new officer record: ${created.id}`);

            // Reload officer with related user/department for response
            officer = await prisma.officer.findUnique({
                where: { id: created.id },
                include: { user: true, department: true }
            });
        } else {
            // Update officer if needed (e.g., new office assignments)
            const needsUpdate =
                (assignedOffices.length > 0 && officer.assignedOffices.length === 0) ||
                (payload.officeRole && !officer.role);

            if (needsUpdate) {
                officer = await prisma.officer.update({
                    where: { id: officer.id },
                    data: {
                        role: payload.officeRole || officer.role,
                        assignedOffices: assignedOffices.length > 0 ? assignedOffices : officer.assignedOffices,
                        assignedDepartmentId: payload.assignedDepartmentId || officer.assignedDepartmentId,
                        assignedDepartmentName: payload.assignedDepartmentName || officer.assignedDepartmentName,
                        name: payload.name || officer.name,
                    },
                    include: { user: true, department: true }
                });
                console.log(`Updated officer record: ${officer.id}`);
            }
        }

        // Ensure officer exists before formatting response
        if (!officer) {
            return NextResponse.json(
                { success: false, message: "Failed to create or retrieve officer profile" },
                { status: 500, headers: securityHeaders }
            );
        }

        // Format response
        return NextResponse.json({
            success: true,
            message: "Officer authenticated successfully",
            data: {
                officer: {
                    id: officer.id,
                    email: officer.user?.email ?? String(payload.email),
                    name: officer.name ?? payload.name,
                    role: officer.role ?? payload.officeRole,
                    department: officer.department?.name ?? String(payload.department ?? ''),
                    assignedOffices: officer.assignedOffices,
                    assignedDepartmentId: officer.assignedDepartmentId,
                    assignedDepartmentName: officer.assignedDepartmentName,
                },
            }
        }, { headers: securityHeaders });

    } catch (error) {
        console.error("Error in officer auto-profile creation:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500, headers: securityHeaders }
        );
    }
}

/**
 * GET /api/auth/officer/auto-profile
 * 
 * Gets the current officer's profile.
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { success: false, message: "Unauthorized access" },
                { status: 401, headers: securityHeaders }
            );
        }

        const token = authHeader.split(" ")[1];
        const decoded = await verifyToken(token as string);

        if (!decoded) {
            return NextResponse.json(
                { success: false, message: "Unauthorized access" },
                { status: 401, headers: securityHeaders }
            );
        }

        // Find the officer
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { externalId: decoded.userId },
                    { email: decoded.email }
                ]
            },
            include: {
                officer: {
                    include: {
                        department: true,
                        hodDepartment: true,
                    }
                }
            }
        });

        if (!user?.officer) {
            return NextResponse.json(
                { success: false, message: "Officer not found" },
                { status: 404, headers: securityHeaders }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                officer: {
                    id: user.officer.id,
                    email: user.email,
                    name: user.officer.name,
                    role: user.officer.role,
                    department: user.officer.department?.name,
                    assignedOffices: user.officer.assignedOffices,
                    assignedDepartmentId: user.officer.assignedDepartmentId,
                    assignedDepartmentName: user.officer.assignedDepartmentName,
                    isHOD: user.officer.hodDepartment !== null,
                }
            }
        }, { headers: securityHeaders });

    } catch (error) {
        console.error("Error getting officer profile:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500, headers: securityHeaders }
        );
    }
}
