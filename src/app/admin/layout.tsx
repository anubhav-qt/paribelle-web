import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { pomFontVars } from '@/components/admin/pom/fonts';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Manage the PariBelle store',
  robots: { index: false, follow: false },
};

/**
 * `.pom-admin` switches on the POM design layer (see the end of globals.css)
 * for everything under /admin, and nothing outside it.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`pom-admin pom-page ${pomFontVars}`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
