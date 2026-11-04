'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore, KNOWN_STAFF } from '@/lib/store';
import { getDefaultRouteForRole, isRouteAllowed } from '@/lib/route-guard';
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
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);

  const loadTables = () => {
    fetchApi('/menu/tables')
      .then(setTables)
      .catch(() => {});
  };

  useEffect(() => {
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

  const handleSwitchStaff = async (staff: any) => {
    setStaffMenuOpen(false);
    try {
      const res = await fetchApi('/auth/login-pin', {
        method: 'POST',
        body: JSON.stringify({ pin: staff.pin }),
      });
      login(res.accessToken, res.user);
      const targetRoute = getDefaultRouteForRole(res.user.role);
      router.push(targetRoute);
    } catch (e) {
      console.error('Failed to switch staff', e);
    }
  };

  return (
    <>
      <header className="bg-[#12100E]/95 backdrop-blur-xl border-b border-white/10 px-2.5 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-40 text-white shadow-md">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/[0.08] backdrop-blur-md flex items-center justify-center p-1 shadow-md flex-shrink-0 border border-white/15">
              <img
                src="/nitsuh-logo.png"
                alt="Nitsuh Foods Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-[12px] sm:text-sm tracking-wider uppercase font-black text-white leading-none flex items-center gap-1">
                <span className="text-[#EF4444]">NITSUH</span>
                <span className="text-[#F89B22]">FOODS</span>
              </div>
              <div className="hidden sm:block text-[10px] font-semibold text-zinc-400 tracking-tight mt-0.5">
                Addis Ababa, Ethiopia • 0966833177
              </div>
            </div>

            <div className="hidden xl:block text-xs font-medium text-zinc-400 pl-3 border-l border-white/10">
              {format(new Date(), 'EEEE, d MMMM')}
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
              <nav className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1 rounded-2xl">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/dashboard'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Profit & Analytics</span>
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
                  <span>Dual Inventory</span>
                </Link>

                <Link
                  href="/tables"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/tables'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
            {/* Educated Light / Dark Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 rounded-xl sm:rounded-2xl transition cursor-pointer text-xs font-bold shadow-xs"
              title={theme === 'dark' ? 'Switch to Educated Warm Alabaster Bistro (Light Theme)' : 'Switch to Midnight Obsidian (Dark Theme)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px] text-zinc-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline text-[11px] text-zinc-700 font-bold">Dark</span>
                </>
              )}
            </button>

            {/* User Profile Pill / Quick Switcher */}
            <div className="relative">
              <button
                onClick={() => setStaffMenuOpen(!staffMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 rounded-xl sm:rounded-2xl shadow-xs transition"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-amber-400/50 flex-shrink-0"
                  />
                ) : null}
                <div className="text-left max-w-[65px] sm:max-w-[120px] truncate">
                  <div className="text-[11px] sm:text-xs font-bold text-white truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[8px] sm:text-[9px] font-bold text-amber-400 uppercase truncate">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
              </button>

              {staffMenuOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-[288px] sm:w-72 bg-[#1A1614] rounded-2xl shadow-2xl border border-white/15 p-2 z-50 text-white">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-1.5">
                    Terminal Quick Staff Switcher
                  </div>
                  <div className="space-y-1">
                    {KNOWN_STAFF.map((staff) => (
                      <button
                        key={staff.pin}
                        onClick={() => handleSwitchStaff(staff)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                          currentUser.role === staff.role && currentUser.name.includes(staff.name.split(' ')[0])
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                            : 'hover:bg-white/[0.06] text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white">{staff.name}</div>
                          <div className="text-[10px] text-zinc-400">{staff.role.replace('_', ' ')}</div>
                        </div>
                        <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">
                          PIN {staff.pin}
                        </span>
                      </button>
                    ))}
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
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar border-t border-white/10 mt-2">
            <Link
              href="/dashboard"
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/dashboard'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Profit</span>
            </Link>
            <Link
              href="/inventory"
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                pathname === '/inventory'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white'
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
                  : 'bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white'
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
                  : 'bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white'
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
                  : 'bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white'
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
                  : 'bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white'
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
