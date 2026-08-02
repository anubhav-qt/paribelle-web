import { Suspense } from 'react';
import ProfileContent from '@/components/ProfileContent';
import { AccountShell } from '@/components/account/AccountShell';

export default function ProfilePage() {
  return (
    <AccountShell>
      {/* ProfileContent reads the ?tab= param, so it can't be prerendered. */}
      <Suspense fallback={null}>
        <ProfileContent />
      </Suspense>
    </AccountShell>
  );
}
