'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import DashboardContent from '@/components/DashboardContent';

export default function VendorDashboard() {
  const params = useParams();
  const vendorSlug = params.slug as string;

  return (
    <div className="min-h-screen bg-background">
      <Header showLocationFilter={false} showBookingsLink={true} />
      <CategoryNav mode="navigation" />
      <DashboardContent vendorSlug={vendorSlug} />
    </div>
  );
}
