'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_NAV } from '@/components/admin/adminNav';
import { Loader } from '@/components/ui/Loader';

export default function AdminDashboard() {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  return <AdminDashboardContent />;
}

interface Stats {
  products: number | null;
  categories: number | null;
  orders: number | null;
}

function AdminDashboardContent() {
  const [stats, setStats] = useState<Stats>({ products: null, categories: null, orders: null });

  useEffect(() => {
    const fetchStats = async () => {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem('token');
      const auth = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [products, categories, orders] = await Promise.all([
          fetch(`${api}/api/v1/products?page=1&limit=1`, auth).then((r) => (r.ok ? r.json() : null)),
          fetch(`${api}/api/v1/categories`, auth).then((r) => (r.ok ? r.json() : null)),
          fetch(`${api}/api/v1/orders`, auth).then((r) => (r.ok ? r.json() : null)),
        ]);

        const today = new Date().toISOString().split('T')[0];
        setStats({
          products: products?.total ?? 0,
          categories: Array.isArray(categories) ? categories.length : 0,
          orders: Array.isArray(orders)
            ? orders.filter((o: any) => o.createdAt?.startsWith(today)).length
            : 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-gray-600">Manage the PariBelle store</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatTile label="Total Products" value={stats.products} />
        <StatTile label="Categories" value={stats.categories} />
        <StatTile label="Orders Today" value={stats.orders} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {ADMIN_NAV.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">{card.title}</h3>
              <p className="line-clamp-2 text-xs text-gray-600">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
      <div className="text-3xl font-bold text-gray-900">{value ?? '…'}</div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}
