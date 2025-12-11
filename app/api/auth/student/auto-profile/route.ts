import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { securityHeaders } from "@/lib/security";

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
      matricNumber: string;
      role: string;
      name: string;
      department: string;
      admissionYear: string | number;
      yearsSinceAdmission: string | number;
      phoneNumber?: string;
      gender?: string;
      level?: string;
    } = decoded as any;

    // Validate required fields in JWT payload
    const requiredFields = [
      "_id", "email", "matricNumber", "role", "name",
      "department", "admissionYear", "yearsSinceAdmission"
    ] as const;

    for (const field of requiredFields) {
      if (!payload[field as keyof typeof payload]) {
        return NextResponse.json(
          { success: false, message: `Invalid token data: missing ${field}` },
          { status: 400, headers: securityHeaders }
        );
      }
    }

    // Ensure role is student (case-insensitive)
    if (payload.role?.toUpperCase() !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Invalid role: must be a student" },
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
          role: 'STUDENT',
        }
      });
    }

    // Check if student already exists in database by userId or matricNumber
    let student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { matricNumber: String(payload.matricNumber) }
        ]
      },
      include: { user: true, department: true }
    });

    // If student doesn't exist, create a new profile
    if (!student) {
      // Find or create department
      let department = await prisma.department.findFirst({
        where: { name: String(payload.department) }
      });

      if (!department) {
        // Auto-create department if it doesn't exist
        department = await prisma.department.create({
          data: { name: String(payload.department) }
        });
        console.log(`Auto-created department: ${payload.department}`);
      }

      // Create student profile, then load with relations for response
      const created = await prisma.student.create({
        data: {
          user: { connect: { id: user.id } },
          firstName: String(payload.name).split(" ")[0] ?? null,
          lastName: String(payload.name).split(" ").slice(1).join(" ") ?? null,
          matricNumber: String(payload.matricNumber),
          department: { connect: { id: department.id } },
          admissionYear: Number(payload.admissionYear) || null,
          phoneNumber: payload.phoneNumber ?? null,
          gender: payload.gender ?? null,
          level: payload.level ?? null,
        }
      });

      // Reload student with related user/department for response
      student = await prisma.student.findUnique({
        where: { id: created.id },
        include: { user: true, department: true }
      });
    }

    // Check eligibility based on yearsSinceAdmission
    const eligible = Number(payload.yearsSinceAdmission) >= 4;
    const notification = eligible
      ? null
      : "You are not yet eligible to start clearance.";

    // Ensure student exists before formatting response
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Failed to create or retrieve student profile" },
        { status: 500, headers: securityHeaders }
      );
    }

    // Format response
    return NextResponse.json({
      success: true,
      message: "Student authenticated successfully",
      data: {
        student: {
          id: student.id,
          email: student.user?.email ?? String(payload.email),
          matricNumber: student.matricNumber,
          name: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim(),
          department: student.department?.name ?? String(payload.department),
          admissionYear: Number(payload.admissionYear),
          yearsSinceAdmission: Number(payload.yearsSinceAdmission)
        },
        eligible,
        notification
      }
    }, { headers: securityHeaders });

  } catch (error) {
    console.error("Error in student auto-profile creation:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: securityHeaders }
    );
  }
}