import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma'

// Use environment variables for all secrets
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET;
// Ensure this is the same secret used across the application
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

/**
 * Updated to support new user data structure
 * Includes all fields from the requested payload for both students and officers
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  // Student fields
  matricNumber?: string;
  name?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  department?: string;
  gender?: string;
  admissionYear?: number;
  yearsSinceAdmission?: number;
  // Officer fields
  officeRole?: string; // "HOD", "LIBRARY", "BURSAR", etc.
  assignedOffices?: string[]; // ["hod", "library", etc.]
  assignedDepartmentId?: string;
  assignedDepartmentName?: string;
}

/**
 * Verify JWT token using jose library
 * This is the standardized token verification function used across the application
 */
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);

    // Check for required fields
    const raw = payload as any;
    if (!raw.email || !raw.role || (!raw._id && !raw.userId)) {
      console.error('Token missing required fields:', {
        hasEmail: !!raw.email,
        hasRole: !!raw.role,
        hasId: !!(raw._id || raw.userId)
      });
      return null;
    }

    // Normalize payload to our expected structure
    const normalized: JWTPayload = {
      userId: raw._id || raw.userId,
      email: raw.email,
      role: String(raw.role || '').toUpperCase(),
      // Student fields
      matricNumber: raw.matricNumber,
      name: raw.name,
      phoneNumber: raw.phoneNumber,
      profilePictureUrl: raw.profilePictureUrl,
      department: raw.department,
      gender: raw.gender,
      admissionYear: raw.admissionYear,
      yearsSinceAdmission: raw.yearsSinceAdmission,
      // Officer fields
      officeRole: raw.officeRole,
      assignedOffices: raw.assignedOffices,
      assignedDepartmentId: raw.assignedDepartmentId,
      assignedDepartmentName: raw.assignedDepartmentName,
    };

    return normalized;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  console.log('Token payload:', payload);

  // Try matching either by primary id or externalId since tokens may carry either
  const lookupUserId = String(payload.userId ?? '');
  console.log('Looking up user with ID:', lookupUserId);

  // First try to find existing user by ID or externalId or email
  let user: any = null;
  try {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: lookupUserId },
          { externalId: lookupUserId },
          { email: payload.email }
        ]
      },
      include: {
        student: {
          include: {
            department: {
              include: {
                hodOfficer: true,
              },
            },
            faculty: true,
          },
        },
        officer: {
          include: {
            department: true,
          },
        },
        admin: true,
      },
    });
  } catch (dbError) {
    console.error('Prisma error in getCurrentUser:', dbError);
    user = null;
  }

  // If user doesn't exist, create them in the database
  if (!user && payload.email) {
    console.log('User not found, creating new user from token data...');

    try {
      // Create User record
      user = await prisma.user.create({
        data: {
          externalId: lookupUserId,
          email: payload.email,
          name: payload.name,
          role: payload.role as any || 'STUDENT',
        },
        include: {
          student: true,
          officer: true,
          admin: true,
        },
      });
      console.log('Created new user:', user.id);

      // Now create role-specific record
      if (payload.role === 'STUDENT') {
        // Find or create department
        let department = null;
        if (payload.department) {
          department = await prisma.department.findFirst({
            where: { name: payload.department }
          });

          if (!department) {
            department = await prisma.department.create({
              data: { name: payload.department }
            });
            console.log('Created new department:', department.name);
          }
        }

        // Create Student record
        const student = await prisma.student.create({
          data: {
            userId: user.id,
            firstName: payload.name?.split(' ')[0] || undefined,
            lastName: payload.name?.split(' ').slice(1).join(' ') || undefined,
            matricNumber: payload.matricNumber || `TEMP-${user.id.slice(-8)}`,
            departmentId: department?.id,
            facultyId: department?.facultyId ?? undefined,
            phoneNumber: payload.phoneNumber,
            gender: payload.gender,
            admissionYear: payload.admissionYear,
            yearsSinceAdmission: payload.yearsSinceAdmission,
          },
          include: {
            department: {
              include: {
                hodOfficer: true,
              },
            },
            faculty: true,
          },
        });
        console.log('Created new student record:', student.id);

        // Re-fetch user with all relations
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            student: {
              include: {
                department: {
                  include: {
                    hodOfficer: true,
                  },
                },
                faculty: true,
              },
            },
            officer: {
              include: {
                department: true,
              },
            },
            admin: true,
          },
        });
      } else if (payload.role === 'OFFICER') {
        // Find or create department for officer
        let department = null;
        if (payload.department) {
          department = await prisma.department.findFirst({
            where: { name: payload.department }
          });

          if (!department) {
            department = await prisma.department.create({
              data: { name: payload.department }
            });
            console.log('Created department for officer:', department.name);
          }
        }

        // Determine assigned offices from payload
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
          };
          assignedOffices = roleToOffice[payload.officeRole.toUpperCase()] || [payload.officeRole.toLowerCase()];
        }

        // Create Officer record with full clearance workflow support
        await prisma.officer.create({
          data: {
            userId: user.id,
            name: payload.name,
            departmentId: department?.id,
            role: payload.officeRole,
            assignedOffices: assignedOffices,
            assignedDepartmentId: payload.assignedDepartmentId || (payload.officeRole?.toUpperCase() === 'HOD' ? department?.id : undefined),
            assignedDepartmentName: payload.assignedDepartmentName || (payload.officeRole?.toUpperCase() === 'HOD' ? department?.name : undefined),
            assignedOfficeId: assignedOffices[0] || undefined,
            assignedOfficeName: payload.officeRole,
          },
        });
        console.log('Created new officer record with assignedOffices:', assignedOffices);

        // Re-fetch user with all relations
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            student: true,
            officer: {
              include: {
                department: true,
              },
            },
            admin: true,
          },
        });
      } else if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
        // Create Admin record
        await prisma.admin.create({
          data: {
            userId: user.id,
            name: payload.name,
          },
        });
        console.log('Created new admin record');

        // Re-fetch user with all relations
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            student: true,
            officer: true,
            admin: true,
          },
        });
      }
    } catch (createError) {
      console.error('Error creating user/student:', createError);

      // Fallback to virtual user if creation fails (e.g., duplicate key)
      console.log('Falling back to virtual user data');
      return createVirtualUser(payload);
    }
  }

  // If user exists but is missing role-specific record, create it
  if (user && payload.role === 'STUDENT' && !user.student) {
    console.log('User exists but missing student record, creating...');
    try {
      let department = null;
      if (payload.department) {
        department = await prisma.department.findFirst({
          where: { name: payload.department }
        });
      }

      await prisma.student.create({
        data: {
          userId: user.id,
          firstName: payload.name?.split(' ')[0] || undefined,
          lastName: payload.name?.split(' ').slice(1).join(' ') || undefined,
          matricNumber: payload.matricNumber || `TEMP-${user.id.slice(-8)}`,
          departmentId: department?.id,
          phoneNumber: payload.phoneNumber,
          gender: payload.gender,
          admissionYear: payload.admissionYear,
          yearsSinceAdmission: payload.yearsSinceAdmission,
        },
      });

      // Re-fetch with relations
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          student: {
            include: {
              department: { include: { hodOfficer: true } },
              faculty: true,
            },
          },
          officer: { include: { department: true } },
          admin: true,
        },
      });
    } catch (err) {
      console.error('Error creating missing student record:', err);
    }
  }

  return user;
}

// Helper function to create virtual user as fallback
function createVirtualUser(payload: JWTPayload) {
  if (payload.role === 'STUDENT') {
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: {
        id: payload.userId,
        userId: payload.userId,
        firstName: payload.name?.split(' ')[0] || '',
        lastName: payload.name?.split(' ').slice(1).join(' ') || '',
        matricNumber: payload.matricNumber || '',
        level: 400,
        departmentId: '',
        facultyId: '',
        user: { email: payload.email },
        department: payload.department ? { name: payload.department } : null,
        faculty: null,
      },
      officer: null,
      admin: null,
    } as any;
  }

  if (payload.role === 'OFFICER') {
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role as any,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: null,
      officer: {
        id: payload.userId,
        userId: payload.userId,
        name: payload.name,
        phoneNumber: payload.phoneNumber || '',
        departmentId: '',
        user: { email: payload.email },
        department: payload.department ? { name: payload.department } : null,
        assignedSteps: [],
      },
      admin: null,
    } as any;
  }

  // Admin fallback
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role as any,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: null,
    officer: null,
    admin: {
      id: payload.userId,
      userId: payload.userId,
      name: payload.name,
      user: { email: payload.email },
    },
  } as any;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  const isSecure = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https');

  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Create a new session by generating JWT token and setting auth cookie
 */
export async function createSession(userData: {
  _id: string;
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
}) {
  try {
    const payload: JWTPayload = {
      userId: userData._id,
      email: userData.email,
      role: userData.role.toUpperCase(),
      matricNumber: userData.matricNumber,
      name: userData.name,
      phoneNumber: userData.phoneNumber,
      profilePictureUrl: userData.profilePictureUrl,
      department: userData.department,
      gender: userData.gender,
      admissionYear: userData.admissionYear,
      yearsSinceAdmission: userData.yearsSinceAdmission
    };

    // Create JWT token
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Set the auth cookie
    await setAuthCookie(token);

    return { success: true, token };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: 'Failed to create session' };
  }
}

/**
 * Get current session information
 */
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    // Return all available session data
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      matricNumber: payload.matricNumber,
      name: payload.name,
      phoneNumber: payload.phoneNumber,
      profilePictureUrl: payload.profilePictureUrl,
      department: payload.department,
      gender: payload.gender,
      admissionYear: payload.admissionYear,
      yearsSinceAdmission: payload.yearsSinceAdmission,
      token
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Require specific role for route access
 */
export async function requireRole(requiredRole: string) {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        error: 'Unauthorized - No session found',
        status: 401
      };
    }

    // Check if user has the required role
    if (session.role !== requiredRole) {
      // Allow SUPER_ADMIN to access everything
      if (session.role !== 'SUPER_ADMIN') {
        return {
          success: false,
          error: `Forbidden - Required role: ${requiredRole}, Current role: ${session.role}`,
          status: 403
        };
      }
    }

    // Get full user data
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'User not found in database',
        status: 404
      };
    }

    return {
      success: true,
      user,
      session
    };
  } catch (error) {
    console.error('Error in requireRole:', error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500
    };
  }
}
