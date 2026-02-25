/**
 * User Storage Utilities for CoreEKSU Integration
 * 
 * This module provides cookie-based token management for the federated
 * authentication flow with CoreEKSU. Unlike localStorage, cookies are
 * accessible on both client and server, enabling secure server-side
 * token validation.
 * 
 * Flow:
 * 1. User authenticates on CoreEKSU
 * 2. CoreEKSU redirects with ?token=xxx in URL
 * 3. Middleware extracts token and sets HttpOnly cookie
 * 4. All subsequent requests include the cookie automatically
 */

// ============================================
// CLIENT-SIDE UTILITIES (Browser Only)
// ============================================

/**
 * Extract token from URL and clean the URL for security.
 * This should be called on the client after redirect from CoreEKSU.
 * The actual cookie setting happens in middleware.
 * 
 * @returns The token from URL, or null if not present
 */
export const consumeTokenFromUrl = (): string | null => {
    if (typeof window === "undefined") return null;

    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (token) {
        // Clean the URL to remove sensitive token
        url.searchParams.delete("token");
        const newUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState({}, "", newUrl);
        return token;
    }

    return null;
};

/**
 * Extract userId from URL, store it, and clean the URL.
 * Used when CoreEKSU passes userId instead of or along with token.
 * 
 * @returns The userId from URL or previously stored value
 */
export const consumeUserIdFromUrl = (): string | null => {
    if (typeof window === "undefined") return null;

    const url = new URL(window.location.href);
    const userId = url.searchParams.get("userId");

    if (userId) {
        // Clean the URL to remove userId
        url.searchParams.delete("userId");
        const newUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState({}, "", newUrl);
    }

    return userId || null;
};

/**
 * Read a cookie value by name (client-side).
 * Note: Cannot read HttpOnly cookies from JavaScript.
 */
export const getCookie = (name: string): string | null => {
    if (typeof window === "undefined") return null;

    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
};

/**
 * Set a cookie value (client-side).
 * For non-sensitive cookies only. Auth tokens should use HttpOnly cookies
 * set by the server.
 */
export const setCookie = (
    name: string,
    value: string,
    options: {
        maxAge?: number;
        path?: string;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
    } = {}
): void => {
    if (typeof window === "undefined") return;

    const {
        maxAge = 60 * 60 * 24 * 7, // 7 days default
        path = '/',
        secure = process.env.NODE_ENV === 'production',
        sameSite = 'lax'
    } = options;

    let cookieString = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}; samesite=${sameSite}`;
    if (secure) cookieString += '; secure';

    document.cookie = cookieString;
};

/**
 * Delete a cookie (client-side).
 */
export const deleteCookie = (name: string): void => {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0`;
};

/**
 * Handle logout - clears all auth-related cookies via API call.
 * This triggers server-side cookie deletion for HttpOnly cookies.
 */
export const logout = async (): Promise<void> => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        // Also clear any client-readable cookies
        deleteCookie('userId');
    } catch (error) {
        console.error('Logout failed:', error);
    }
    // Redirect to CoreEKSU login
    if (typeof window !== "undefined") {
        window.location.href = getCoreEKSULoginUrl();
    }
};

// ============================================
// COREEKSU API UTILITIES
// ============================================

const COREEKSU_BASE_URL = 'https://coreeksu.vercel.app';

/**
 * Fetch user details from CoreEKSU API using a token.
 * 
 * @param token - JWT token from CoreEKSU
 * @returns User data or null if failed
 */
export const fetchUserFromCoreEKSU = async (token: string): Promise<CoreEKSUUser | null> => {
    try {
        const response = await fetch(`${COREEKSU_BASE_URL}/api/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error('CoreEKSU user fetch failed:', response.status);
            return null;
        }

        const data = await response.json();
        return data.user || data;
    } catch (error) {
        console.error('Error fetching from CoreEKSU:', error);
        return null;
    }
};

/**
 * Fetch user by ID from CoreEKSU (public endpoint).
 * 
 * @param userId - User ID
 * @returns User data or null if failed
 */
export const fetchUserByIdFromCoreEKSU = async (userId: string): Promise<CoreEKSUUser | null> => {
    try {
        const response = await fetch(`${COREEKSU_BASE_URL}/api/users/${userId}`);

        if (!response.ok) {
            console.error('CoreEKSU user fetch by ID failed:', response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user by ID from CoreEKSU:', error);
        return null;
    }
};

/**
 * Get the CoreEKSU login URL with a return URL.
 * 
 * @param returnUrl - URL to redirect back to after login
 * @returns Full login URL
 */
export const getCoreEKSULoginUrl = (returnUrl?: string): string => {
    const baseLoginUrl = `${COREEKSU_BASE_URL}/login`;
    if (returnUrl) {
        return `${baseLoginUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
    return baseLoginUrl;
};

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CoreEKSUUser {
    id: string;
    _id?: string;
    email: string;
    name?: string;
    matricNumber?: string;
    department?: string;
    faculty?: string;
    role?: string;
    phoneNumber?: string;
    gender?: string;
    profilePictureUrl?: string;
    admissionYear?: number;
    yearsSinceAdmission?: number;
    [key: string]: unknown;
}

export type OfficeRole =
    | 'admin'
    | 'HOD'
    | 'Peer'
    | 'Faculty'
    | 'External'
    | 'Dept'
    | 'Admin'
    | 'Registrar'
    | 'STUDENT'
    | 'OFFICER';

// ============================================
// ROLE-BASED ACCESS CONTROL
// ============================================

/**
 * Check if a user has one of the allowed roles.
 */
export const hasRole = (userRole: string | undefined, allowedRoles: OfficeRole[]): boolean => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole.toUpperCase() as OfficeRole) ||
        allowedRoles.includes(userRole as OfficeRole);
};

/**
 * Redirect to CoreEKSU login page.
 */
export const redirectToLogin = (): void => {
    if (typeof window === "undefined") return;

    const returnUrl = window.location.href;
    window.location.href = getCoreEKSULoginUrl(returnUrl);
};
