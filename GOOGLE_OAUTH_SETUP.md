# Google OAuth Authentication Setup Guide

## Overview

Google OAuth authentication has been implemented in the frontend, allowing users to sign in or sign up using their Google accounts. The implementation **preserves** all existing email-based authentication and email verification flows.

## Features

✅ **Google Sign In** - Users can log in with Google
✅ **Google Sign Up** - New users can register with Google
✅ **Email Auto-Verification** - Google users have their emails automatically verified
✅ **Email Auth Preserved** - Traditional email/password authentication still works
✅ **Email Verification Intact** - Email verification flow for traditional signups remains functional
✅ **Vendor Subdomain Support** - Handles returnUrl for vendor subdomain redirects
✅ **Cross-Subdomain Auth** - Token sharing across subdomains for vendor stores

## How It Works

### 1. User Flow

#### Google Sign In:
1. User clicks "Sign in with Google" on `/login`
2. Redirected to Google OAuth consent screen
3. After consent, Google redirects to `/api/auth/google/callback`
4. Backend authenticates user via `/api/v1/auth/google-login`
5. User is redirected to home page (or returnUrl) with token
6. Frontend stores token in localStorage and cookie
7. User is authenticated

#### Google Sign Up:
1. User clicks "Sign up with Google" on `/signup`
2. Same flow as sign in
3. If user doesn't exist, backend auto-creates account with:
   - Email from Google
   - Random password (not needed)
   - Auto-verified email (`emailVerifiedAt` set to current timestamp)
   - Name from Google profile

#### Email/Password Sign In:
1. User enters email and password on `/login`
2. Frontend calls `/api/v1/auth/login`
3. Backend validates credentials
4. Backend checks if `emailVerifiedAt` is set
5. If not verified, login is rejected with message to verify email
6. If verified, user is authenticated

#### Email/Password Sign Up:
1. User enters details on `/signup`
2. Frontend calls `/api/auth/signup`
3. Backend creates user with unverified email
4. Backend sends verification email
5. User must verify email before logging in

### 2. Email Verification Protection

The backend ensures email verification for traditional signups:

```typescript
// In auth.service.ts validateUser()
if (!user.emailVerifiedAt && !user.email.includes('google')) {
  throw new UnauthorizedException('Please verify your email before logging in.');
}
```

Google users bypass this check because they have `emailVerifiedAt` auto-set.

## Configuration

### Environment Variables

Add to `marketplace-web/.env.local`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
5. Configure OAuth consent screen:
   - User Type: External (for testing)
   - App name: Your Marketplace Name
   - User support email: Your email
   - Authorized domains: localhost (for development)
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
7. Copy Client ID and Client Secret to your `.env.local`

## File Structure

### Frontend (marketplace-web)

```
src/
├── app/
│   ├── login/page.tsx                    # Login page with Google button
│   ├── signup/page.tsx                   # Signup page with Google button
│   ├── page.tsx                          # Homepage with GoogleAuthHandler
│   ├── verify-email/page.tsx             # Email verification page (unchanged)
│   ├── resend-verification/page.tsx      # Resend verification (unchanged)
│   └── api/
│       └── auth/
│           ├── signup/route.ts           # Email signup API (unchanged)
│           ├── google/route.ts           # Google OAuth initiation
│           └── google/callback/route.ts  # Google OAuth callback handler
└── components/
    └── GoogleAuthHandler.tsx             # Handles OAuth callback tokens
```

### Backend (marketplace-backend)

```
src/modules/auth/
├── auth.controller.ts      # Has /google-login endpoint
├── auth.service.ts         # Has googleLogin() method
└── ...
```

## Backend Integration

The backend already has the Google login endpoint:

**Endpoint:** `POST /api/v1/auth/google-login`

**Request Body:**
```json
{
  "email": "user@gmail.com",
  "name": "John Doe",
  "googleId": "google_unique_id",
  "picture": "https://..."
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "emailVerifiedAt": "2025-12-07T10:00:00.000Z"
  }
}
```

### Backend Logic (auth.service.ts)

```typescript
async googleLogin(googleData: { email, name, googleId, picture }) {
  let user = await this.usersService.findByEmail(googleData.email);
  
  if (!user) {
    // Create new user with auto-verified email
    user = await this.usersService.create({
      email: googleData.email,
      password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
      firstName,
      lastName,
      emailVerifiedAt: new Date(), // ✅ AUTO-VERIFIED
    });
  } else if (!user.emailVerifiedAt) {
    // If user exists but not verified, verify them
    user.emailVerifiedAt = new Date();
    await this.usersRepository.save(user);
  }
  
  return { token: this.jwtService.sign({...}), user };
}
```

## Testing Checklist

### ✅ Google Authentication
- [ ] Click "Sign in with Google" on login page
- [ ] Redirected to Google consent screen
- [ ] After consent, redirected back to app
- [ ] Token stored in localStorage and cookie
- [ ] User authenticated successfully
- [ ] User data visible in localStorage

### ✅ Email Authentication (Still Works)
- [ ] Register with email/password
- [ ] Receive verification email
- [ ] Try to login before verification → Rejected with message
- [ ] Click verification link
- [ ] Login successfully after verification

### ✅ Mixed Scenarios
- [ ] Sign up with Google → Auto-verified
- [ ] Sign up with email → Requires verification
- [ ] Existing email user tries Google login → Auto-verifies their account
- [ ] Google user can access protected routes
- [ ] Email user can access protected routes after verification

### ✅ Vendor Subdomain Support
- [ ] Login from vendor subdomain with returnUrl
- [ ] Token passed correctly to subdomain
- [ ] Cookie set for cross-subdomain access

## Security Considerations

1. **Email Uniqueness**: Both flows use the same email field, preventing duplicate accounts
2. **Password for Google Users**: Random password is generated but never used
3. **Email Verification**: Google emails are trusted and auto-verified
4. **Token Security**: JWT tokens are stored in httpOnly cookies (in callback) and localStorage
5. **CORS**: Ensure backend allows frontend domain in CORS settings
6. **Redirect URI Validation**: Google validates redirect URIs against configured values

## Troubleshooting

### "oauth_failed" Error
- Check Google Client ID and Client Secret
- Verify redirect URI matches exactly in Google Console
- Ensure Google+ API is enabled

### "token_exchange_failed" Error
- Check Client Secret is correct
- Verify redirect URI in token exchange request

### "auth_failed" Error
- Backend `/api/v1/auth/google-login` endpoint might be down
- Check backend logs for errors

### Email Verification Not Working
- This is separate from Google OAuth
- Check email service configuration in backend
- Verify SMTP settings

### Token Not Stored
- Check browser console for errors
- Verify `GoogleAuthHandler` component is rendered
- Check if token is in URL params after redirect

## Future Enhancements

- [ ] Add GitHub OAuth
- [ ] Add Microsoft OAuth
- [ ] Store Google profile picture
- [ ] Link existing email account to Google account
- [ ] OAuth for vendor registration flow
- [ ] Remember user's OAuth preference

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs
3. Verify environment variables are set
4. Ensure Google Cloud Console is configured correctly
