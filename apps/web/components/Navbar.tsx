'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getDefaultRouteForRole, isRouteAllowed } from '@/lib/route-guard';
import { NitsuhLogo } from '@/components/NitsuhLogo';
import {
  Coffee,
  Bell,
  LogOut,
  Smartphone,
  ChefHat,
  Boxes,
  BarChart3,
  MonitorCheck,
  LayoutGrid,
  ChevronDown,
  Sun,
  Moon,
  Volume2,
  Users,
} from 'lucide-react';
import { fetchApi, getSocket } from '@/lib/api';
import { TablePlanModal } from '@/components/TablePlanModal';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentUser,
    logout,
    login,
    waiterSlipsCount,
    setWaiterSlipsCount,
    tableManagerOpen,
    setTableManagerOpen,
    theme,
    toggleTheme,
  } = useAppStore();

  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [tables, setTables] = useState<any[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);

  const loadTables = () => {
    fetchApi('/menu/tables')
      .then(setTables)
      .catch(() => {});
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeTheme = (document.documentElement.getAttribute('data-theme') || localStorage.getItem('cafe_theme') || 'dark') as 'dark' | 'light';
      if (activeTheme && activeTheme !== theme) {
        useAppStore.getState().setTheme(activeTheme);
      }
    }
    loadTables();

    const socket = getSocket();
    socket.on('tables:updated', (updated: any[]) => {
      setTables(updated);
    });

    if (currentUser?.role === 'CASHIER' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER') {
      fetchApi('/orders/waiter-slips')
        .then((slips) => setWaiterSlipsCount(slips.length))
        .catch(() => {});

      socket.on('waiter:new_order_note', () => {
        setWaiterSlipsCount(waiterSlipsCount + 1);
        setUnreadAlerts((prev) => prev + 1);
      });
    }

    return () => {
      socket.off('tables:updated');
      socket.off('waiter:new_order_note');
    };
  }, [currentUser]);

  if (!currentUser) return null;

  const role = currentUser.role;
  const isOwnerOrManager = role === 'OWNER' || role === 'MANAGER';

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    router.push('/login');
  };


  return (
    <>
      <header className="bg-[#FAF7F2]/95 dark:bg-[#12100E]/95 backdrop-blur-xl border-b border-stone-200/80 dark:border-white/10 px-3.5 sm:px-6 py-2.5 sticky top-0 z-40 text-stone-900 dark:text-white shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <NitsuhLogo variant="navbar" />
          </div>

          {/* Center: ROLE STATION OR OWNER/MANAGER TABS */}
          <div className="hidden md:flex items-center">
            {/* HEAD CHEF & KITCHEN KEEPER DUAL ACCESS (KDS Live + Kitchen Stock) */}
            {(role === 'HEAD_CHEF' || role === 'KITCHEN_STOREKEEPER') && (
              <nav className="flex items-center gap-1 bg-stone-200/60 dark:bg-white/[0.05] border border-stone-300/60 dark:border-white/10 p-1 rounded-full">
                <Link
                  href="/kds"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    pathname === '/kds'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Kitchen Display</span>
                </Link>
                {isOwnerOrManager && (
                  <Link
                    href="/staff"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                      pathname === '/staff'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                        : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                    }`}
                    title="Staff & User Management"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Staff</span>
                  </Link>
                )}

                <Link
                  href="/inventory"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    pathname === '/inventory'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Stock</span>
                </Link>
              </nav>
            )}

            {/* OWNER & MANAGER DESKTOP MANAGEMENT TABS */}
            {isOwnerOrManager && (
              <nav className="flex items-center gap-1 bg-stone-200/60 dark:bg-white/[0.05] border border-stone-300/60 dark:border-white/10 p-1 rounded-full">
                {role === 'OWNER' && (
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                      pathname === '/dashboard'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                        : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </Link>
                )}

                {isOwnerOrManager && (
                  <Link
                    href="/staff"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                      pathname === '/staff'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                        : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                    }`}
                    title="Staff & User Management"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Staff</span>
                  </Link>
                )}

                <Link
                  href="/inventory"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    pathname === '/inventory'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Stock</span>
                </Link>

                <Link
                  href="/tables"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    pathname === '/tables'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                  }`}
                  title="Configure & Manage Dining Tables"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tables</span>
                </Link>

                <Link
                  href="/pos"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    pathname === '/pos'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                  }`}
                >
                  <MonitorCheck className="w-3.5 h-3.5" />
                  <span>POS</span>
                </Link>

                <Link
                  href="/kds"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    pathname === '/kds'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>KDS</span>
                </Link>

                <Link
                  href="/waiter"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                    pathname === '/waiter'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-sm'
                      : 'text-stone-600 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Waiter Pad</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right: Round Audio Button, Round Theme Switcher & Profile Pill matching reference */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Audio Feedback Button matching reference */}
            <button
              onClick={() => {
                try {
                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = audioCtx.createOscillator();
                  const gain = audioCtx.createGain();
                  osc.connect(gain);
                  gain.connect(audioCtx.destination);
                  osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
                  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                  osc.start();
                  osc.stop(audioCtx.currentTime + 0.3);
                } catch (e) {}
              }}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#1C1815] hover:bg-stone-50 dark:hover:bg-white/[0.08] border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-center text-amber-600 dark:text-amber-400 hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Sound Alerts"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Circular Theme Toggle Button matching reference */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#1C1815] hover:bg-stone-50 dark:hover:bg-white/[0.08] border border-stone-200/90 dark:border-white/10 shadow-xs flex items-center justify-center text-amber-500 dark:text-amber-400 hover:scale-105 active:scale-95 transition cursor-pointer"
              title={theme === 'dark' ? 'Switch to Warm Bistro (Light)' : 'Switch to Midnight Obsidian (Dark)'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>

            {/* User Profile Pill matching reference */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1C1815] hover:bg-stone-50 dark:hover:bg-white/[0.08] border border-stone-200/90 dark:border-white/10 rounded-full shadow-xs transition cursor-pointer text-stone-900 dark:text-white"
                title="View active session"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-500/50 flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[10px] ring-1 ring-amber-500/50 flex-shrink-0">
                    {currentUser.name?.slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                )}
                <span className="text-xs font-bold text-stone-900 dark:text-white truncate max-w-[90px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 dark:text-zinc-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <>
                  {/* Backdrop click dismiss */}
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1A1614] rounded-2xl shadow-2xl border border-stone-200 dark:border-white/15 p-3.5 z-50 text-stone-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 pb-3 border-b border-stone-200 dark:border-white/10">
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-sm ring-2 ring-amber-400/40">
                          {currentUser.name?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-sm font-black text-stone-900 dark:text-white truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">{currentUser.email || 'Terminal User'}</div>
                        <span className="inline-block mt-0.5 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          {currentUser.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {isOwnerOrManager && (
                      <div className="py-2 border-b border-stone-200 dark:border-white/10">
                        <Link
                          href="/staff"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 text-xs font-bold text-amber-700 dark:text-amber-300 transition"
                        >
                          <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Staff & Users Console</span>
                        </Link>
                      </div>
                    )}

                    <div className="pt-3">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#C11221] hover:bg-[#a50f1c] text-white border border-[#a50f1c] font-black text-xs transition shadow-sm cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-white stroke-[2.5]" />
                        <span className="text-white font-black">Sign Out & Lock Terminal</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* OWNER & MANAGER MOBILE SUB-NAVBAR (Scrollable on small screens) */}
        {isOwnerOrManager && (
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar border-t border-black/10 dark:border-white/10 mt-2">
            {role === 'OWNER' && (
              <Link
                href="/dashboard"
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  pathname === '/dashboard'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                    : 'bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Profit</span>
              </Link>
            )}
            <Link
              href="/staff"
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/staff'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff</span>
            </Link>
            <Link
              href="/inventory"
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/inventory'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Inventory</span>
            </Link>
            <Link
              href="/tables"
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/tables'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tables</span>
            </Link>
            <Link
              href="/pos"
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/pos'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <MonitorCheck className="w-3.5 h-3.5" />
              <span>POS</span>
            </Link>
            <Link
              href="/kds"
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/kds'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>KDS</span>
            </Link>
            <Link
              href="/waiter"
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/waiter'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Waiter</span>
            </Link>
          </div>
        )}
      </header>

      {/* Tables Floor Plan Modal */}
      <TablePlanModal
        isOpen={tableManagerOpen}
        onClose={() => setTableManagerOpen(false)}
        tables={tables}
        onTablesUpdated={setTables}
      />
    </>
  );
}
