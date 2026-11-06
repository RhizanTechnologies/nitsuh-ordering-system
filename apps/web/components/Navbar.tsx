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
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
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
    logout();
    router.push('/login');
  };


  return (
    <>
      <header className="bg-[#12100E]/95 backdrop-blur-xl border-b border-white/10 px-2.5 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-40 text-white shadow-md">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <NitsuhLogo variant="navbar" />

            <div className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 pl-3 border-l border-black/10 dark:border-white/10">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>{format(new Date(), 'EEEE, d MMMM')}</span>
            </div>
          </div>

          {/* Center: ROLE STATION OR OWNER/MANAGER TABS */}
          <div className="hidden md:flex items-center">
            {/* WAITER ONLY BADGE */}
            {role === 'WAITER' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.06] border border-white/10 text-white rounded-xl text-xs font-bold shadow-sm">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Waiter Mobile Pad</span>
              </div>
            )}

            {/* CASHIER ONLY BADGE */}
            {role === 'CASHIER' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.06] border border-white/10 text-white rounded-xl text-xs font-bold shadow-sm">
                <MonitorCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Cashier POS & Settle Bill</span>
                {waiterSlipsCount > 0 && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-sm shadow-amber-500/50">
                    {waiterSlipsCount} Notes
                  </span>
                )}
              </div>
            )}

            {/* KITCHEN ONLY BADGE */}
            {role === 'KITCHEN_STAFF' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.06] border border-white/10 text-white rounded-xl text-xs font-bold shadow-sm">
                <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                <span>Kitchen Display (KDS Live)</span>
              </div>
            )}

            {/* MAIN STOREKEEPER ONLY BADGE */}
            {role === 'MAIN_STOREKEEPER' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.06] border border-white/10 text-white rounded-xl text-xs font-bold shadow-sm">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                <span>Main Store Bulk Warehouse</span>
              </div>
            )}

            {/* HEAD CHEF & KITCHEN KEEPER DUAL ACCESS (KDS Live + Kitchen Stock) */}
            {(role === 'HEAD_CHEF' || role === 'KITCHEN_STOREKEEPER') && (
              <nav className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 p-1 rounded-2xl">
                <Link
                  href="/kds"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/kds'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Kitchen Display (KDS)</span>
                </Link>
                <Link
                  href="/inventory"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/inventory'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Kitchen Store Stock</span>
                </Link>
              </nav>
            )}

            {/* OWNER & MANAGER DESKTOP MANAGEMENT TABS */}
            {isOwnerOrManager && (
              <nav className="flex items-center gap-1 bg-white/[0.04] border border-black/10 dark:border-white/10 p-1 rounded-2xl">
                {role === 'OWNER' && (
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      pathname === '/dashboard'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Profit & Analytics</span>
                  </Link>
                )}

                <Link
                  href="/inventory"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/inventory'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Dual Inventory</span>
                </Link>

                <Link
                  href="/tables"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/tables'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title="Configure & Manage Dining Tables"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tables ({tables.length})</span>
                </Link>

                <Link
                  href="/pos"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/pos'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <MonitorCheck className="w-3.5 h-3.5" />
                  <span>POS</span>
                </Link>

                <Link
                  href="/kds"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/kds'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>KDS</span>
                </Link>

                <Link
                  href="/waiter"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/waiter'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Waiter Pad</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right: User Status, Theme Switcher & Explicit Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Unambiguous Segmented Light / Dark Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 p-1 bg-black/10 dark:bg-white/[0.08] hover:bg-black/15 dark:hover:bg-white/[0.12] border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl transition cursor-pointer shadow-xs select-none"
              title={theme === 'dark' ? 'Currently Midnight Obsidian (Dark). Click to switch to Warm Bistro (Light).' : 'Currently Warm Bistro (Light). Click to switch to Midnight Obsidian (Dark).'}
            >
              <span className={`flex items-center gap-1 px-2 py-1 rounded-lg sm:rounded-xl text-[11px] font-black transition ${
                theme === 'light'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}>
                <Sun className="w-3 h-3 text-current" />
                <span className="hidden sm:inline">Light</span>
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-lg sm:rounded-xl text-[11px] font-black transition ${
                theme === 'dark'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}>
                <Moon className="w-3 h-3 text-current" />
                <span className="hidden sm:inline">Dark</span>
              </span>
            </button>

            {/* User Profile Pill / Quick Switcher */}
            {/* Authenticated Staff User Pill */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 rounded-xl sm:rounded-2xl shadow-xs transition cursor-pointer"
                title="View active session"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-amber-400/50 flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] ring-1 ring-amber-400/50 flex-shrink-0">
                    {currentUser.name?.slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                )}
                <div className="text-left max-w-[65px] sm:max-w-[120px] truncate">
                  <div className="text-[11px] sm:text-xs font-bold text-white truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[8px] sm:text-[9px] font-bold text-amber-400 uppercase truncate">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className={`w-3 h-3 text-zinc-400 ml-0.5 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1A1614] rounded-2xl shadow-2xl border border-white/15 p-3.5 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm ring-2 ring-amber-400/40">
                        {currentUser.name?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-zinc-400 truncate">{currentUser.email || 'Terminal User'}</div>
                      <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {currentUser.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      Sign Out & Lock Terminal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* EXPLICIT RESPONSIVE LOGOUT BUTTON */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition shadow-xs flex-shrink-0 cursor-pointer"
              title="Logout & Lock Terminal"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
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
