import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'super_admin') {
        router.push('/admin/login');
        return;
      }
      setIsAuthenticated(true);
    } catch (error) {
      router.push('/admin/login');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { isAuthenticated, loading };
}
