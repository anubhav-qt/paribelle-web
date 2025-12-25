import { redirect } from 'next/navigation';

export default function DashboardRedirect() {
  // Redirect to the localized dashboard
  redirect('/en/dashboard');
}
