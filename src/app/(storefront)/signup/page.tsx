'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setAuthCookie } from '@/lib/cross-domain-auth';
import { api, ApiError, errorMessage } from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { safeReturnPath } from '@/lib/returnUrl';

/** Where to go after signing up: a same-site path from `?returnUrl=`, if any. */
function getReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return safeReturnPath(new URLSearchParams(window.location.search).get('returnUrl'));
}

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }

    try {
      const [firstName, ...rest] = formData.name.trim().split(/\s+/);
      // Straight to the API, not through a route on this site's server: the
      // API rate-limits per visitor, and relayed requests all look like one.
      const data = await api.post<any>(
        '/auth/register',
        {
          firstName,
          lastName: rest.join(' ') || firstName,
          email: formData.email.trim(),
          password: formData.password,
        },
        { auth: false },
      );

      // No email verification: the new account comes back signed in, so
      // store the session the same way the login page does.
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthCookie('token', data.access_token);
      setAuthCookie('user', encodeURIComponent(JSON.stringify(data.user)), 7 * 24 * 60 * 60);
      window.dispatchEvent(new CustomEvent('userChanged'));

      const returnUrl = getReturnUrl();
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : errorMessage(err, 'Sign up failed. Please try again.'),
      );
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const returnUrl = getReturnUrl();
      window.location.href = `/api/auth/google${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
    } catch (error) {
      setError('Failed to initiate Google signup');
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
    <AuthLayout title="Create Account" subtitle="Join PariBelle today">
      {error && (
        <div className="mb-4 rounded-sm border border-[hsl(var(--pb-danger)/0.3)] bg-[hsl(var(--pb-danger)/0.08)] p-3">
          <p className="text-center text-sm text-[hsl(var(--pb-danger))]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input id="name" name="name" type="text" autoComplete="name" required value={formData.name} onChange={handleChange} label="Full Name" />
        <Input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} label="Email Address" />
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} value={formData.password} onChange={handleChange} label="Password" />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          label="Confirm Password"
        />

        <Button type="submit" fullWidth loading={isLoading}>
          Sign Up
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <Divider className="flex-1" />
        <span className="text-xs text-[hsl(var(--pb-ink-faint))]">Or continue with</span>
        <Divider className="flex-1" />
      </div>

      <Button type="button" variant="gold-outline" fullWidth onClick={handleGoogleSignUp} disabled={isLoading}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign up with Google
      </Button>

      <p className="mt-6 text-center text-sm text-[hsl(var(--pb-ink-muted))]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[hsl(var(--pb-rose-deep))] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
