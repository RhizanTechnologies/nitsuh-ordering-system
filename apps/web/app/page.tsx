'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getDefaultRouteForRole } from '@/lib/route-guard';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { currentUser, login } = useAppStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('cafe_token');
      const storedUser = localStorage.getItem('cafe_user');

      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (!currentUser) {
            login(storedToken, user);
          }
          const target = getDefaultRouteForRole(user.role);
          router.replace(target);
          return;
        } catch (e) {
          localStorage.removeItem('cafe_token');
          localStorage.removeItem('cafe_user');
        }
      }

      if (currentUser) {
        router.replace(getDefaultRouteForRole(currentUser.role));
      } else {
        router.replace('/login');
      }
    }
  }, [currentUser, login, router]);

  return (
    <div className="min-h-screen bg-[#0D0B0A] flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
      <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-heading">
        Loading Nitsuh Station...
      </p>
    </div>
  );
}
