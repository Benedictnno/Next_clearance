// This file is deprecated - import from @/lib/auth instead
// Keeping for backward compatibility but redirecting to the standardized implementation

import { verifyToken as authVerifyToken } from '@/lib/auth';
export type { JWTPayload } from '@/lib/auth';

/**
 * @deprecated Use verifyToken from @/lib/auth instead
 */
export async function verifyToken(token: string) {
  return authVerifyToken(token);
}