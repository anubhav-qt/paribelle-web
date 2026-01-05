'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategoryNav from '@/components/CategoryNav';
import DashboardContent from '@/components/DashboardContent';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={true} />
      <CategoryNav mode="navigation" />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
      
      <DashboardContent />
    </div>
  );
}
