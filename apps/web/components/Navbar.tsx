'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { NitsuhLogo } from '@/components/NitsuhLogo';
import {
  LogOut,
  Smartphone,
  ChefHat,
  Boxes,
  BarChart3,
  MonitorCheck,
  LayoutGrid,
  ChevronDown,
  Users,
  KeyRound,
  Utensils,
} from 'lucide-react';
import { fetchApi, getSocket } from '@/lib/api';
import { TablePlanModal } from '@/components/TablePlanModal';
import { ChangeCredentialsModal } from '@/components/ChangeCredentialsModal';
import { canRoleAccessPage } from '@/lib/permissions';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [, setPermissionsVer] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setPermissionsVer((v) => v + 1);
    window.addEventListener('nitsuh_permissions_updated', handleUpdate);
    return () => window.removeEventListener('nitsuh_permissions_updated', handleUpdate);
  }, []);
  const {
    currentUser,
    logout,
    waiterSlipsCount,
    setWaiterSlipsCount,
    tableManagerOpen,
    setTableManagerOpen,
  } = useAppStore();

  const [tables, setTables] = useState<any[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isChangeCredsOpen, setIsChangeCredsOpen] = useState(false);

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
    router.replace('/login');
  };

  const navLinkClass = (path: string) => `
    flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer font-sans ${
      pathname === path || (path === '/dashboard' && pathname === '/profit')
        ? 'bg-emerald-600 text-white font-black shadow-xs'
        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold'
    }
  `;

  const allNavItems: Array<{ page: 'profit' | 'staff' | 'products' | 'inventory' | 'tables' | 'pos' | 'kds' | 'waiter'; path: string; label: string; icon: any }> = [
    { page: 'profit', path: '/dashboard', label: 'Profit', icon: BarChart3 },
    { page: 'staff', path: '/staff', label: 'Staff', icon: Users },
    { page: 'inventory', path: '/inventory', label: 'Stock', icon: Boxes },
    { page: 'products', path: '/products', label: 'Menu', icon: Utensils },
    { page: 'tables', path: '/tables', label: 'Tables', icon: LayoutGrid },
    { page: 'pos', path: '/pos', label: 'POS', icon: MonitorCheck },
    { page: 'kds', path: '/kds', label: 'KDS', icon: ChefHat },
    { page: 'waiter', path: '/waiter', label: 'Waiter', icon: Smartphone },
  ];

  const allowedNavItems = allNavItems.filter((item) => canRoleAccessPage(role, item.page));

  return (
    <>
      <header className="bg-white border-b border-stone-200/90 px-3.5 sm:px-6 py-2.5 sticky top-0 z-40 text-stone-900 shadow-2xs font-sans">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <NitsuhLogo variant="navbar" />
          </div>

          {/* Center: ROLE STATION OR OWNER/MANAGER TABS */}
          <div className="hidden md:flex items-center">
            {allowedNavItems.length > 1 && (
              <nav className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-full">
                {allowedNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path} className={navLinkClass(item.path)}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right: Profile Pill */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* User Profile Pill matching reference */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full shadow-xs transition cursor-pointer text-stone-900 font-sans"
                title="View active session"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500/40 flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-800 font-bold flex items-center justify-center text-[10px] ring-1 ring-emerald-500/40 flex-shrink-0">
                    {currentUser.name?.slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                )}
                <span className="text-xs font-bold text-stone-900 truncate max-w-[90px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-3.5 z-50 text-stone-900 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-800 font-bold flex items-center justify-center text-sm ring-2 ring-emerald-500/30">
                          {currentUser.name?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-stone-900 truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                          {currentUser.role.replace(/_/g, ' ')}
                        </div>
                        {currentUser.employeeCode && (
                          <div className="text-[10px] font-mono text-stone-500">
                            ID: {currentUser.employeeCode}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 space-y-1">
                      {/* Change PIN / Password button */}
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setIsChangeCredsOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Change Password / PIN</span>
                      </button>

                      {/* Sign Out Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-white bg-[#C11221] hover:bg-[#A30F1C] rounded-xl transition cursor-pointer shadow-xs"
                      >
                        <LogOut className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                        <span>Sign Out & Lock Terminal</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* DYNAMIC ROLE STATION MOBILE SUB-NAVBAR (Scrollable on small screens) */}
        {allowedNavItems.length > 1 && (
          <div className="md:hidden flex items-center gap-1 overflow-x-auto pt-2 pb-0.5 no-scrollbar border-t border-stone-200 mt-2">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/profit');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
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

      {/* Employee Self-Service Change PIN / Password Modal */}
      <ChangeCredentialsModal
        isOpen={isChangeCredsOpen}
        onClose={() => setIsChangeCredsOpen(false)}
      />
    </>
  );
}
