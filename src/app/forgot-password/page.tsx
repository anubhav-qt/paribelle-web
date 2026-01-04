'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UnifiedHeader from '@/components/UnifiedHeader';
import Footer from '@/components/Footer';
import { useThemeClasses } from '@/hooks/useThemeClasses';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const theme = useThemeClasses();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={theme.combine('min-h-screen flex flex-col', theme.bg)}>
      <UnifiedHeader />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className={theme.combine('max-w-md w-full space-y-8', theme.card, 'p-8 rounded-lg shadow-lg')}>
          <div>
            <h2 className={theme.combine('text-center text-3xl font-extrabold', theme.text)}>
              Reset your password
            </h2>
            <p className={theme.combine('mt-2 text-center text-sm', theme.textMuted)}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {success ? (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Email sent successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>
                      Check your email for a password reset link. If you don't see it, check your spam folder.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-green-800 dark:text-green-200 hover:underline"
                    >
                      Back to login
                    </Link>
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
                <label htmlFor="email" className={theme.combine('block text-sm font-medium', theme.text)}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={theme.combine(
                    'mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md',
                    'placeholder-gray-500 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm',
                    theme.input
                  )}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={theme.combine(
                    'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md',
                    'text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    theme.primaryButton
                  )}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
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

      <Footer categories={[]} marketplaceName="GaliCart" />
    </div>
  );
}
