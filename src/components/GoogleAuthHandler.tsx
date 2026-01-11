'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthCookie } from '@/lib/cross-domain-auth';

export default function GoogleAuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const googleAuth = searchParams.get('googleAuth');

    if (token && googleAuth === 'success') {
      try {
        // Store token and user info
        localStorage.setItem('token', token);
        
        if (userStr) {
          const user = JSON.parse(decodeURIComponent(userStr));
          localStorage.setItem('user', JSON.stringify(user));
          
          // Set cookies using secure utility
          setAuthCookie('token', token);
          setAuthCookie('user', userStr, 7 * 24 * 60 * 60);
          
          // Dispatch event to notify components
          window.dispatchEvent(new CustomEvent('userChanged'));
          
          console.log('Google OAuth successful, token and user stored in localStorage and cookies');
        }
        
        // Clean up URL by removing query parameters
        const currentPath = window.location.pathname;
        const cleanUrl = currentPath === '/' ? '/' : currentPath;
        
        // Use replace to avoid adding to history
        window.history.replaceState({}, '', cleanUrl);
        
        // Refresh the page to update auth state in components
        if (currentPath === '/') {
          router.refresh();
        }
      } catch (error) {
        console.error('Error processing Google OAuth callback:', error);
      }
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything
}
