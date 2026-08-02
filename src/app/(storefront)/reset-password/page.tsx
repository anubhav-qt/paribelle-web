'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeClasses } from '@/hooks/useThemeClasses';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useThemeClasses();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid or missing reset token');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className={theme.combine('max-w-md w-full space-y-8', theme.card, 'p-8 rounded-lg shadow-lg')}>
        <div>
          <h2 className={theme.combine('text-center text-3xl font-extrabold', theme.text)}>
            Create new password
          </h2>
          <p className={theme.combine('mt-2 text-center text-sm', theme.textMuted)}>
            Enter your new password below.
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Password reset successful!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>
                    Your password has been reset successfully. Redirecting to login...
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className={theme.combine('block text-sm font-medium', theme.text)}>
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={theme.combine(
                  'mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md',
                  'placeholder-gray-500 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm',
                  theme.input
                )}
                placeholder="Enter new password"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={theme.combine('block text-sm font-medium', theme.text)}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={theme.combine(
                  'mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md',
                  'placeholder-gray-500 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm',
                  theme.input
                )}
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !token}
                className={theme.combine(
                  'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md',
                  'text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  theme.primaryButton
                )}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <Link
                href="/login"
                className={theme.combine('text-sm font-medium hover:underline', theme.link)}
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const theme = useThemeClasses();
  
  return (
    <div className={theme.combine('min-h-screen flex flex-col', theme.bg)}>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
