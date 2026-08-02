'use client';

import DashboardContent from '@/components/DashboardContent';
import { AccountShell } from '@/components/account/AccountShell';

export default function CustomerDashboard() {
  return (
    <AccountShell>
      <DashboardContent />
    </AccountShell>
  );
}
