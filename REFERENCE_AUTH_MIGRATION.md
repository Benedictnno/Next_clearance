# Migration to Reference-Based Authentication

## Overview
This application now supports the new **Reference-Based Authentication Flow** from CoreEKSU while maintaining backward compatibility with the legacy token-based flow.

## What Changed

### 1. New Auth Callback Route
**File**: `app/api/auth/callback/route.ts`

Handles the new reference-based authentication:
- Receives `?ref=UUID` from CoreEKSU redirect
- Makes server-to-server call to verify the reference
- Receives JWT and user profile from CoreEKSU
- Sets secure HTTP-only cookie
- Redirects to role-based dashboard

### 2. Updated Middleware
**File**: `middleware.ts`

Now handles **both** authentication flows:

#### **New Flow (Preferred)**
```
CoreEKSU → ?ref=UUID → Middleware → /api/auth/callback → Verify → Dashboard
```

#### **Legacy Flow (Deprecated, for backward compatibility)**
```
CoreEKSU → ?token=JWT → Middleware → Set Cookie → Dashboard
```

### 3. Environment Variables
**Files**: `.env`, `env.example`

Added two new required variables:
```bash
CORE_API_URL=https://coreeksu.vercel.app
CORE_SYSTEM_SECRET=YOUR_SHARED_SECRET_HERE
```

## How to Use

### For Development
1. Request the `CORE_SYSTEM_SECRET` from the CoreEKSU team
2. Update your `.env` file with the secret
3. Test the flow: 
   - CoreEKSU redirects to: `https://your-app.com/?ref=550e8400-...`
   - Middleware intercepts and redirects to callback
   - Callback verifies and sets cookie
   - User lands on dashboard

### For Production (Vercel)
Add environment variables in Vercel dashboard:
```
CORE_API_URL=https://coreeksu.vercel.app
CORE_SYSTEM_SECRET=<actual-secret-here>
```

## Error Handling

The callback route handles various error scenarios:

| Error | URL Redirect | Cause |
|-------|-------------|-------|
| `missing_ref` | `/?error=missing_ref` | No reference ID in URL |
| `config_error` | `/?error=config_error` | Missing env variables |
| `session_expired` | `/?error=session_expired` | Reference used/expired (410) |
| `invalid_session` | `/?error=invalid_session` | Invalid reference (401/404) |
| `server_error` | `/?error=server_error` | Unexpected error |

## Testing

### Test New Flow (Reference-Based)
```
GET /?ref=550e8400-e29b-41d4-a716-446655440000
```

Expected:
1. Middleware intercepts
2. Redirects to `/api/auth/callback?ref=...`
3. Callback verifies with CoreEKSU
4. Sets cookie and redirects to dashboard

### Test Legacy Flow (Token-Based)
```
GET /?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Expected:
1. Middleware intercepts (logs "DEPRECATED")
2. Verifies token directly
3. Sets cookie and redirects to dashboard

## Migration Timeline

### Phase 1: Both Flows Active (Current)
- Your app accepts both `?ref=` and `?token=`
- CoreEKSU can gradually migrate users

### Phase 2: Deprecation Warning
- Add deprecation notices for `?token=` flow
- Monitor logs for token-based logins

### Phase 3: Remove Legacy Support
- Once CoreEKSU fully migrates, remove token-based handling from middleware
- Update documentation

## Security Benefits

✅ **No JWT in URL** - Tokens never exposed in browser history  
✅ **One-time use** - References expire after verification  
✅ **Server-to-server** - Shared secret never exposed to client  
✅ **Audit trail** - CoreEKSU logs all reference exchanges  
✅ **Time-limited** - References expire in 5 minutes

## Support

If you encounter issues:
1. Check logs for `[Auth Callback]` and `[Middleware]` messages
2. Verify `CORE_SYSTEM_SECRET` matches what CoreEKSU team provided
3. Confirm `CORE_API_URL` points to correct environment
4. Contact CoreEKSU backend team for reference verification issues
