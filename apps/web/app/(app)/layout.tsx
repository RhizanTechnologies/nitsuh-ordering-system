'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { isRouteAllowed, getDefaultRouteForRole } from '@/lib/route-guard';
import { Navbar } from '@/components/Navbar';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, login } = useAppStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 1. Session Restoration Check
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('cafe_token');
      const storedUser = localStorage.getItem('cafe_user');

      if (!currentUser && storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          login(storedToken, parsed);
        } catch (e) {
          router.replace('/login');
          return;
        }
      } else if (!currentUser && (!storedToken || !storedUser)) {
        router.replace('/login');
        return;
      }
    }
    setHydrated(true);
  }, [currentUser, router]);

  // 2. Role-based Station Guard: check if current URL is permitted for staff role
  const isAllowed = currentUser ? isRouteAllowed(pathname, currentUser.role) : false;
  const fallbackRoute = currentUser ? getDefaultRouteForRole(currentUser.role) : '/login';

  useEffect(() => {
    if (hydrated && currentUser && !isAllowed) {
      const timer = setTimeout(() => {
        router.replace(fallbackRoute);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hydrated, currentUser, isAllowed, fallbackRoute, router]);

  if (!hydrated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0D0B0A] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-zinc-400 tracking-wider font-heading">
          Verifying station credentials...
        </p>
      </div>
    );
  }

  // 3. Render Access Denied Guard if user tries to manually browse to unauthorized page
  if (!isAllowed) {
    return (
      <main className="min-h-screen flex flex-col bg-[#0D0B0A] text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/40">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-extrabold text-white mb-2 font-heading">Station Access Restricted</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Your assigned role <span className="font-bold text-amber-400">({currentUser.role})</span> does not have authorization to view <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white">{pathname}</span>.
          </p>
          <div className="text-[11px] text-zinc-500 mb-6 italic">
            Redirecting to your assigned terminal station in a moment...
          </div>
          <button
            onClick={() => router.replace(fallbackRoute)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-zinc-950 font-extrabold rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <span>Return to Your Station ({fallbackRoute})</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </button>
        </div>
      </main>
    );
  }

  // 4. Authorized View
  return (
    <main className="h-screen max-h-screen flex flex-col bg-[#0D0B0A] text-white overflow-hidden transition-colors duration-200">
      <Navbar />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </main>
  );
}
