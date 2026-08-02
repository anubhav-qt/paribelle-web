'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setAuthCookie } from '@/lib/cross-domain-auth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const urlError = searchParams.get('error');
  const urlMessage = searchParams.get('message');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Load saved credentials on mount and handle URL errors
  useEffect(() => {
    // Display error message from URL if present
    if (urlError) {
      const errorMessage = urlMessage ? decodeURIComponent(urlMessage) : 'Authentication failed';

      if (urlError === 'email_not_verified') {
        setError('⚠️ ' + errorMessage);
      } else if (urlError === 'session_expired') {
        setError('🔒 ' + errorMessage);
      } else if (urlError === 'auth_failed') {
        setError('❌ Google Sign-In Failed: ' + errorMessage);
      } else if (urlError === 'no_token') {
        setError('❌ Authentication Error: ' + errorMessage);
      } else if (urlError === 'no_user') {
        setError('❌ Authentication Error: ' + errorMessage);
      } else if (urlError === 'oauth_failed') {
        setError('❌ Google OAuth failed. Please try again or use email/password.');
      } else if (urlError === 'token_exchange_failed') {
        setError('❌ Failed to exchange Google token. Please try again.');
      } else if (urlError === 'user_info_failed') {
        setError('❌ Failed to get user info from Google. Please try again.');
      } else if (urlError === 'callback_failed') {
        setError('❌ Google OAuth callback failed. Please try again.');
      } else {
        setError(errorMessage);
      }
    }

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'super_admin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      return;
    }

    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedEmail && savedPassword) {
      setFormData({ email: savedEmail, password: savedPassword });
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnUrl, router, urlError, urlMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      window.dispatchEvent(new CustomEvent('userChanged'));
      sessionStorage.removeItem('loginRedirect');

      if (rememberMe) {
        localStorage.setItem('savedEmail', formData.email);
        localStorage.setItem('savedPassword', formData.password);
      } else {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('savedPassword');
      }

      setAuthCookie('token', data.access_token);
      const encodedUser = encodeURIComponent(JSON.stringify(data.user));
      setAuthCookie('user', encodedUser, 7 * 24 * 60 * 60);

      if (returnUrl) {
        window.location.href = returnUrl;
      } else if (data.user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (returnUrl) {
        params.set('returnUrl', returnUrl);
      }
      window.location.href = `/api/auth/google${params.toString() ? '?' + params.toString() : ''}`;
    } catch (error) {
      setError('Failed to initiate Google login');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account to continue">
      {error && (
        <div className="mb-4 rounded-sm border border-[hsl(var(--pb-danger)/0.3)] bg-[hsl(var(--pb-danger)/0.08)] p-3">
          <p className="text-center text-sm text-[hsl(var(--pb-danger))]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} method="post" action="#" autoComplete="off" className="space-y-5">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          label="Email Address"
        />
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange}
          label="Password"
        />

        <div className="flex items-center justify-between">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            label="Remember me"
          />
          <Link href="/forgot-password" className="text-sm font-medium text-[hsl(var(--pb-rose-deep))] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <Divider className="flex-1" />
        <span className="text-xs text-[hsl(var(--pb-ink-faint))]">Or continue with</span>
        <Divider className="flex-1" />
      </div>

      <Button type="button" variant="gold-outline" fullWidth onClick={handleGoogleLogin} disabled={isLoading}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign in with Google
      </Button>

      <p className="mt-6 text-center text-sm text-[hsl(var(--pb-ink-muted))]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-[hsl(var(--pb-rose-deep))] hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
