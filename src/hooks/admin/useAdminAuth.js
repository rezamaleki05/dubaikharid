'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function useAdminAuth() {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/admin');
      router.refresh();
    }
  }, [router]);

  return { handleLogout };
}
