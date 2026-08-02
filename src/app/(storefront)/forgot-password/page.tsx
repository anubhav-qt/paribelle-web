'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 || data.message?.includes('not found') || data.message?.includes('does not exist')) {
          throw new Error('No account found with this email address. Please check your email and try again.');
        } else if (data.message?.includes('Failed to send')) {
          throw new Error('Failed to send reset email. Please verify your email address is correct and try again.');
        } else {
          throw new Error(data.message || 'Failed to send reset email. Please check your email address.');
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Email send failed. Please check your email address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email address and we'll send you a link to reset your password.">
      {success ? (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-sm border border-[hsl(var(--pb-success)/0.3)] bg-[hsl(var(--pb-success)/0.08)] p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[hsl(var(--pb-success))]" />
            <div className="text-sm text-[hsl(var(--pb-ink-muted))]">
              <p className="font-medium text-[hsl(var(--pb-ink))]">Request submitted!</p>
              <p className="mt-1">
                If an account exists with this email, you&apos;ll receive a password reset link shortly. Please check your
                email and spam folder.
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button fullWidth>Back to Login</Button>
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-sm border border-[hsl(var(--pb-danger)/0.3)] bg-[hsl(var(--pb-danger)/0.08)] p-3">
              <p className="text-sm text-[hsl(var(--pb-danger))]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} label="Email Address" />
            <Button type="submit" fullWidth loading={loading}>
              Send Reset Link
            </Button>
            <p className="text-center text-sm">
              <Link href="/login" className="font-medium text-[hsl(var(--pb-rose-deep))] hover:underline">
                Back to Login
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
