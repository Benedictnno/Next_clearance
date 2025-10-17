import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { compare, hash } from 'bcrypt';
import prisma from './db';

export type UserRole = 'student' | 'admin' | 'officer';

export type SessionPayload = {
  userId: number;
  role: UserRole;
  name?: string;
  email?: string;
};

const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SALT_ROUNDS = 10;

function devBypassEnabled(): boolean {
  return process.env.DEV_AUTH_BYPASS === 'true';
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || (devBypassEnabled() ? 'devsecret' : '');
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = jwt.sign(payload, getSecret(), { expiresIn: SESSION_TTL_SECONDS });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  if (devBypassEnabled()) {
    // Default dummy student session; override via DEV_ROLE if needed
    const role = (process.env.DEV_ROLE as UserRole) || 'student';
    return { userId: 1, role, name: 'Dev User', email: 'dev@example.com' };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(role?: UserRole) {
  const session = await getSession();
  if (!session) {
    if (devBypassEnabled()) {
      return { userId: 1, role: (process.env.DEV_ROLE as UserRole) || 'student', name: 'Dev User', email: 'dev@example.com' };
    }
    redirect('/login');
  }
  if (role && session.role !== role) {
    if (devBypassEnabled()) return session;
    if (session.role === 'student') redirect('/student/dashboard');
    if (session.role === 'officer') redirect('/officer/dashboard');
    if (session.role === 'admin') redirect('/admin/dashboard');
    redirect('/login');
  }
  return session;
}

export async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      officer: {
        include: {
          department: true
        }
      },
      admin: true
    }
  });
  
  return user;
}

export async function requireRole(role: UserRole): Promise<SessionPayload> {
  const session = await getSession();
  if (devBypassEnabled()) {
    return session || { userId: 1, role, name: 'Dev User', email: 'dev@example.com' };
  }
  if (!session || session.role !== role) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function authenticateUser(email: string, password: string): Promise<SessionPayload | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      student: true,
      officer: true,
      admin: true
    }
  });

  if (!user) return null;

  const passwordValid = await verifyPassword(password, user.password);
  if (!passwordValid) return null;

  let name = '';
  if (user.role === 'student' && user.student) {
    name = `${user.student.firstName} ${user.student.lastName}`;
  } else if (user.role === 'officer' && user.officer) {
    name = user.officer.name;
  } else if (user.role === 'admin' && user.admin) {
    name = user.admin.name;
  }

  return {
    userId: Number(user.id),
    role: user.role as UserRole,
    name,
    email: user.email
  };

}

export async function registerUser(userData: {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  matricNumber?: string;
  department?: string;
  faculty?: string;
  level?: string;
  name?: string;
  departmentId?: number;
}) {
  const { email, password, role, ...profileData } = userData;
  
  const hashedPassword = await hashPassword(password);
  
  return prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role
      }
    });
    
    if (role === 'student') {
      await tx.student.create({
        data: {
          userId: user.id,
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          matricNumber: profileData.matricNumber || '',
          department: profileData.department || '',
          faculty: profileData.faculty || '',
          level: profileData.level || ''
        }
      });
    } else if (role === 'officer') {
      await tx.officer.create({
        data: {
          userId: user.id,
          name: profileData.name || '',
          departmentId: profileData.departmentId || 1
        }
      });
    } else if (role === 'admin') {
      await tx.admin.create({
        data: {
          userId: user.id,
          name: profileData.name || ''
        }
      });
    }
    
    return user;
  });
}


