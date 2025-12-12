'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
    consumeTokenFromUrl,
    consumeUserIdFromUrl,
    getCookie,
    logout as performLogout,
    fetchUserFromCoreEKSU,
    CoreEKSUUser,
    OfficeRole,
    hasRole,
    redirectToLogin,
} from '@/lib/user-storage';

// ============================================
// TYPES
// ============================================

interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role: string;
    matricNumber?: string;
    department?: string;
    faculty?: string;
    phoneNumber?: string;
    gender?: string;
    profilePictureUrl?: string;
    admissionYear?: number;
    yearsSinceAdmission?: number;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasRole: (allowedRoles: OfficeRole[]) => boolean;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// PROVIDER COMPONENT
// ============================================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user data from the server
    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // First, clean any token from URL (middleware handles cookie setting)
            consumeTokenFromUrl();
            consumeUserIdFromUrl();

            // Fetch user from our local API (which reads from cookie)
            const response = await fetch('/api/auth/me', {
                credentials: 'include', // Important: include cookies
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setUser(null);
                    return;
                }
                throw new Error('Failed to fetch user');
            }

            const data = await response.json();

            if (data.success && data.user) {
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role,
                    matricNumber: data.user.matricNumber,
                    department: data.user.department,
                    faculty: data.user.faculty,
                    phoneNumber: data.user.phoneNumber,
                    gender: data.user.gender,
                    profilePictureUrl: data.user.profilePictureUrl,
                    admissionYear: data.user.admissionYear,
                    yearsSinceAdmission: data.user.yearsSinceAdmission,
                });
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch user on mount
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Logout function
    const logout = useCallback(async () => {
        setLoading(true);
        await performLogout();
        setUser(null);
        setLoading(false);
    }, []);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        await fetchUser();
    }, [fetchUser]);

    // Check if user has required role
    const checkRole = useCallback((allowedRoles: OfficeRole[]): boolean => {
        if (!user) return false;
        return hasRole(user.role, allowedRoles);
    }, [user]);

    const value: AuthContextType = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        logout,
        refreshUser,
        hasRole: checkRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

// ============================================
// CONVENIENCE HOOKS
// ============================================

/**
 * Hook that redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo?: string) {
    const { user, loading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            if (redirectTo) {
                window.location.href = redirectTo;
            } else {
                redirectToLogin();
            }
        }
    }, [loading, isAuthenticated, redirectTo]);

    return { user, loading };
}

/**
 * Hook that redirects if user doesn't have required role
 */
export function useRequireRole(
    allowedRoles: OfficeRole[],
    options?: { redirectTo?: string }
) {
    const { user, loading, hasRole: checkRole } = useAuth();

    useEffect(() => {
        if (!loading && user && !checkRole(allowedRoles)) {
            const redirectTo = options?.redirectTo || '/';
            window.location.href = redirectTo;
        }
    }, [loading, user, allowedRoles, checkRole, options?.redirectTo]);

    return { user, loading, hasRole: checkRole(allowedRoles) };
}
