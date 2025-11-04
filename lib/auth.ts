import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma'

// Use environment variables for all secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Ensure this is the same secret used across the application
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

/**
 * Updated to support new user data structure
 * Includes all fields from the requested payload
 */
export interface JWTPayload {
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
      matricNumber: raw.matricNumber,
      name: raw.name,
      phoneNumber: raw.phoneNumber,
      profilePictureUrl: raw.profilePictureUrl,
      department: raw.department,
      gender: raw.gender,
      admissionYear: raw.admissionYear,
      yearsSinceAdmission: raw.yearsSinceAdmission
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
  
  // First try to find existing user, but handle DB errors gracefully
  let user: any = null;
  try {
    user = await prisma.user.findFirst({
      where: { id: lookupUserId },
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
    console.error('Prisma error in getCurrentUser, falling back to token payload:', dbError);
    user = null;
  }

  // If user doesn't exist and we have enough info from token, create a virtual user object
  if (!user && payload.role === 'STUDENT') {
    console.log('Creating virtual student from token data');
    
    // Return a virtual user object that matches the expected structure
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
        level: 400, // Default level
        departmentId: '',
        facultyId: '',
        user: {
          email: payload.email,
        },
        department: payload.department ? { name: payload.department } : null,
        faculty: null,
      },
      officer: null,
      admin: null,
    } as any;
  }

  // Create virtual officer for OFFICER role
  if (!user && payload.role === 'OFFICER') {
    console.log('Creating virtual officer from token data');

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
        firstName: payload.name?.split(' ')[0] || '',
        lastName: payload.name?.split(' ').slice(1).join(' ') || '',
        phoneNumber: payload.phoneNumber || '',
        departmentId: '',
        user: {
          email: payload.email,
        },
        department: payload.department ? { name: payload.department } : null,
        assignedSteps: [],
      },
      admin: null,
    } as any;
  }

  // Create virtual admin for ADMIN/SUPER_ADMIN roles
  if (!user && (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN')) {
    console.log('Creating virtual admin from token data');

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
        firstName: payload.name?.split(' ')[0] || '',
        lastName: payload.name?.split(' ').slice(1).join(' ') || '',
        phoneNumber: payload.phoneNumber || '',
        user: {
          email: payload.email,
        },
        role: payload.role as any,
      },
    } as any;
  }

  return user;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
