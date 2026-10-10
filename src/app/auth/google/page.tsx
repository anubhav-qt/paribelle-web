'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { setAuthCookie } from '@/lib/cross-domain-auth';
import { safeReturnPath } from '@/lib/returnUrl';
import { GOOGLE_HANDOFF_PATH } from '@/lib/googleSignIn';
import { Loader } from '@/components/ui/Loader';

/**
 * The last step of signing in with Google. The callback leaves the session in
 * an httpOnly cookie that only `POST /api/auth/google/handoff` can read; this
 * page collects it, stores it the way the email login does, and carries on to
 * where the shopper was going.
 */
function FinishGoogleSignIn() {
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    // Strict mode runs effects twice in development; the handoff works once.
    if (started.current) return;
    started.current = true;

    const next = safeReturnPath(searchParams.get('next')) ?? '/';

    fetch(GOOGLE_HANDOFF_PATH, { method: 'POST', credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) throw new Error('handoff');
        const { token, user } = await res.json();

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.removeItem('loginRedirect');
        setAuthCookie('token', token);
        setAuthCookie('user', encodeURIComponent(JSON.stringify(user)), 7 * 24 * 60 * 60);
        window.dispatchEvent(new CustomEvent('userChanged'));

        window.location.replace(next);
      })
      .catch(() => {
        const params = new URLSearchParams({ error: 'auth_failed' });
        if (next !== '/') params.set('returnUrl', next);
        window.location.replace(`/login?${params}`);
      });
  }, [searchParams]);

  return <SigningIn />;
}

function SigningIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[hsl(var(--pb-ivory))] px-6 text-center">
      <Loader size="md" />
      <p className="text-sm text-[hsl(var(--pb-ink-muted))]">Signing you in…</p>
    </div>
  );
}

export default function GoogleSignInPage() {
  return (
    <Suspense fallback={<SigningIn />}>
      <FinishGoogleSignIn />
    </Suspense>
  );
}
