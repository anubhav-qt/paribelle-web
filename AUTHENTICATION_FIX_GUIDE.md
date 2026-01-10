# Authentication Email Verification Fix

## Problem
Users could log in with stored tokens even if their email wasn't verified. The JWT strategy wasn't checking email verification status.

## Solution Implemented

### 1. Backend Fix (jwt.strategy.ts)
Added email verification check in JWT token validation:

```typescript
async validate(payload: any) {
  const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
  
  if (!user) {
    throw new UnauthorizedException('User not found');
  }
  
  // NEW: Check if email is verified for non-Google users
  if (!user.emailVerifiedAt && !user.email.includes('google')) {
    throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification link.');
  }
  
  return user;
}
```

### 2. Frontend Utilities (lib/auth.ts)
Added helper functions to handle authentication errors:

**`clearAuth()`** - Clears all auth data from localStorage
**`handleAuthError(error)`** - Handles 401 errors and redirects to login with appropriate message
**`checkAuthResponse(response)`** - Middleware to check API responses for auth errors

### 3. Login Page (app/login/page.tsx)
Updated to display error messages from URL parameters:
- Shows email verification warnings
- Shows session expired messages
- Preserves redirect URL after re-login

## How to Use in Components

### Option 1: Using checkAuthResponse (Recommended)
```typescript
import { checkAuthResponse } from '@/lib/auth';

const token = localStorage.getItem('token');
const response = await fetch(`${API_URL}/api/v1/some-endpoint`, {
  headers: { Authorization: `Bearer ${token}` }
});

// This will automatically handle 401 and redirect to login
await checkAuthResponse(response);

if (response.ok) {
  const data = await response.json();
  // Handle success
}
```

### Option 2: Manual Error Handling
```typescript
import { handleAuthError } from '@/lib/auth';

try {
  const response = await fetch(`${API_URL}/api/v1/some-endpoint`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (response.status === 401) {
    const errorData = await response.json();
    handleAuthError(errorData);
    return;
  }
  
  // Handle success
} catch (error) {
  handleAuthError(error);
}
```

## Behavior

### For Unverified Users:
1. User registers → receives verification email
2. User tries to use app with stored token
3. Any API call returns 401 with "Please verify your email" message
4. Auth is cleared, redirected to `/login?error=email_not_verified&message=...`
5. Login page shows warning message

### For Verified Users:
- Normal authentication flow continues
- Token works for all API calls
- No disruption

## Testing

1. Register a new user (don't verify email)
2. Try to access protected routes
3. Should be redirected to login with verification message
4. Verify email via link
5. Login should now work normally

## Migration Notes

- Existing unverified users will be logged out on their next API call
- They'll need to verify their email to continue
- Google OAuth users bypass email verification (intentional)
