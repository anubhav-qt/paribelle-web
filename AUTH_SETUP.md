# Authentication Setup

## Created Files

### Login & Sign Up Pages
- `/login` - Login page with email/password and Google OAuth
- `/signup` - Sign up page with email/password and Google OAuth

### API Routes
- `/api/auth/login` - Login endpoint (proxies to backend)
- `/api/auth/signup` - Sign up endpoint (proxies to backend)
- `/api/auth/google` - Initiates Google OAuth flow
- `/api/auth/google/callback` - Handles Google OAuth callback

## Setup Instructions

### 1. Install Dependencies
```bash
cd apps/web
npm install
```

### 2. Configure Environment Variables
Update `apps/web/.env.local` with your Google OAuth credentials:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### 3. Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - Add production URL when deploying
6. Copy Client ID and Client Secret to `.env.local`

### 4. Backend Requirements
Your NestJS backend needs these endpoints:

```typescript
POST /auth/login
POST /auth/signup
GET  /auth/google
GET  /auth/google/callback
```

## Features

✅ Email/password authentication  
✅ Google OAuth login  
✅ Form validation  
✅ Error handling  
✅ Loading states  
✅ Responsive design  
✅ Dark mode support  
✅ Remember me functionality  
✅ Password confirmation  

## Usage

Navigate to:
- `http://localhost:3000/login` - Login page
- `http://localhost:3000/signup` - Sign up page

## Security Notes

- Tokens are stored in `localStorage` for regular login
- Google OAuth tokens are stored in HTTP-only cookies
- Always use HTTPS in production
- Set secure cookie flags in production environment
