'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getDefaultRouteForRole } from '@/lib/route-guard';
import { fetchApi } from '@/lib/api';
import { NitsuhLogo } from '@/components/NitsuhLogo';
import { Lock, KeyRound, ArrowRight, UserCircle, Check, Sun, Moon } from 'lucide-react';

export function LoginScreen() {
  const router = useRouter();
  const { login, theme, toggleTheme } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pin' | 'password'>('pin');

  // Staff list for profile-targeted PIN authentication
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [staffLoading, setStaffLoading] = useState(true);

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Load active staff profiles for the dropdown
  useEffect(() => {
    fetchApi('/auth/staff')
      .then((data) => {
        if (Array.isArray(data)) {
          setStaffList(data);
          const savedStaffId = typeof window !== 'undefined' ? localStorage.getItem('nitsuh_last_staff_id') : null;
          if (savedStaffId && data.some((s) => s.id === savedStaffId)) {
            setSelectedStaffId(savedStaffId);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load staff list:', err);
      })
      .finally(() => {
        setStaffLoading(false);
      });
  }, []);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { label: 'Owner / Executive', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40' };
      case 'MANAGER':
        return { label: 'General Manager', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40' };
      case 'CASHIER':
        return { label: 'Cashier / POS', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' };
      case 'WAITER':
        return { label: 'Service Waiter', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/40' };
      case 'KITCHEN_STAFF':
        return { label: 'Kitchen Cook', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40' };
      case 'HEAD_CHEF':
        return { label: 'Head Chef', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/40' };
      case 'MAIN_STOREKEEPER':
        return { label: 'Main Storekeeper', color: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40' };
      case 'KITCHEN_STOREKEEPER':
        return { label: 'Kitchen Storekeeper', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40' };
      default:
        return { label: role, color: 'bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white border-stone-300 dark:border-white/20' };
    }
  };

  const handleNumberClick = (digit: string) => {
    if (!selectedStaffId) {
      setError('Please select your name from the dropdown first');
      return;
    }
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      // Auto-submit when exactly 4 digits entered for the selected user
      if (nextPin.length === 4) {
        handlePinSubmit(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  // Physical Numpad, Hardware Keyboard & Barcode Scanner listener
  useEffect(() => {
    if (activeTab !== 'pin' || loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, loading, pin, selectedStaffId]);

  const handlePinSubmit = async (pinToTest?: string) => {
    const finalPin = pinToTest || pin;
    if (!finalPin) return;

    if (!selectedStaffId) {
      setError('Please select your name from the dropdown first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi('/auth/login-pin', {
        method: 'POST',
        body: JSON.stringify({ pin: finalPin, userId: selectedStaffId }),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('nitsuh_last_staff_id', selectedStaffId);
      }

      login(res.accessToken, res.user);
      const targetRoute = getDefaultRouteForRole(res.user.role);
      router.push(targetRoute);
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN for selected employee');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(res.accessToken, res.user);
      const targetRoute = getDefaultRouteForRole(res.user.role);
      router.push(targetRoute);
    } catch (err: any) {
      setError(err.message || 'Invalid Email or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EE] dark:bg-[#0D0B0A] text-stone-900 dark:text-white flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Theme Quick Switcher in Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-white/[0.08] backdrop-blur-md border border-stone-200 dark:border-white/15 shadow-sm hover:shadow transition-all text-xs font-bold text-stone-700 dark:text-zinc-200 cursor-pointer"
          title="Toggle Light / Dark Mode"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light UI</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-stone-700" />
              <span>Dark UI</span>
            </>
          )}
        </button>
      </div>

      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C11221]/10 dark:bg-[#C11221]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-[#161311]/95 backdrop-blur-2xl rounded-[36px] shadow-2xl border border-stone-200/90 dark:border-white/15 overflow-hidden relative z-10 transition-colors duration-300">
        {/* Header Branding: Nitsuh Creative Brand Logo & Emblem */}
        <div className="bg-gradient-to-b from-amber-500/10 via-stone-50/50 to-transparent dark:from-[#C11221]/25 dark:via-white/[0.03] dark:to-transparent p-6 text-center relative border-b border-stone-200/80 dark:border-white/10">
          <NitsuhLogo variant="login" />
        </div>

        {/* Tab switch (PIN / Email) */}
        <div className="flex border-b border-stone-200 dark:border-white/10 bg-stone-100/70 dark:bg-white/[0.02]">
          <button
            onClick={() => {
              setActiveTab('pin');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pin'
                ? 'border-b-2 border-amber-500 text-stone-950 dark:text-amber-300 bg-white dark:bg-white/[0.04] shadow-xs'
                : 'text-stone-500 dark:text-zinc-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Staff Profile & PIN</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('password');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'password'
                ? 'border-b-2 border-amber-500 text-stone-950 dark:text-amber-300 bg-white dark:bg-white/[0.04] shadow-xs'
                : 'text-stone-500 dark:text-zinc-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Manager Password</span>
          </button>
        </div>

        {/* PIN LOGIN TAB */}
        {activeTab === 'pin' ? (
          <div className="p-5 sm:p-6 flex flex-col items-center space-y-3.5">
            {/* Step 1: Employee Name Dropdown */}
            <div className="w-full">
              <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 text-center">
                1. Select Your Staff Name
              </label>
              <div className="relative">
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedStaffId(id);
                    setError(null);
                    setPin('');
                    if (id && typeof window !== 'undefined') {
                      localStorage.setItem('nitsuh_last_staff_id', id);
                    }
                  }}
                  disabled={staffLoading}
                  className="w-full bg-stone-50 dark:bg-[#201B17] border border-stone-300 dark:border-amber-500/40 text-stone-900 dark:text-amber-300 font-extrabold text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 cursor-pointer transition shadow-xs"
                >
                  <option value="" className="bg-white dark:bg-[#161311] text-stone-500 dark:text-zinc-400">
                    {staffLoading ? 'Loading staff profiles...' : '-- Choose Your Profile / Name --'}
                  </option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id} className="bg-white dark:bg-[#161311] text-stone-900 dark:text-white py-1">
                      {staff.name} — ({staff.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Employee Visual Card */}
            {selectedStaff ? (
              <div className="w-full bg-amber-50/70 dark:bg-white/[0.04] border border-amber-200/80 dark:border-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedStaff.avatarUrl ? (
                    <img
                      src={selectedStaff.avatarUrl}
                      alt={selectedStaff.name}
                      className="w-9 h-9 rounded-xl object-cover border border-amber-500/40 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {selectedStaff.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-black text-stone-900 dark:text-white truncate">{selectedStaff.name}</div>
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md border mt-0.5 ${getRoleBadge(selectedStaff.role).color}`}>
                      {getRoleBadge(selectedStaff.role).label}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 px-2 py-1 rounded-xl flex-shrink-0">
                  <Check className="w-3 h-3" />
                  <span>Ready</span>
                </div>
              </div>
            ) : (
              <div className="w-full py-2.5 px-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 text-center font-medium">
                👆 Select your name above, then tap your private PIN.
              </div>
            )}

            {/* Step 2: PIN Dots Display */}
            <div className="text-center pt-1">
              <div className="text-[10px] font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider">
                {selectedStaff ? `2. Enter PIN for ${selectedStaff.name.split(' ')[0]}` : '2. Enter 4-Digit PIN'}
              </div>
              <div className="flex items-center justify-center gap-3 mt-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      pin.length > idx
                        ? 'bg-amber-500 border-amber-400 scale-110 shadow-md shadow-amber-500/40'
                        : 'border-stone-300 dark:border-white/20 bg-stone-200/80 dark:bg-white/[0.05]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="w-full text-center py-2 px-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            {/* Touch Number Pad */}
            <div className="grid grid-cols-3 gap-2.5 w-64 pt-0.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleNumberClick(digit)}
                  className="w-18 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-95 border border-stone-200/90 text-xl font-black text-stone-900 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:border-white/10 dark:text-white transition shadow-xs hover:shadow cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="w-18 h-12 rounded-2xl bg-stone-100/70 hover:bg-stone-200/80 active:scale-95 text-xs font-black text-stone-600 hover:text-stone-900 border border-stone-200/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] dark:text-zinc-400 dark:hover:text-white dark:border-white/10 transition cursor-pointer"
              >
                CLEAR
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="w-18 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-95 border border-stone-200/90 text-xl font-black text-stone-900 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:border-white/10 dark:text-white transition shadow-xs hover:shadow cursor-pointer"
              >
                0
              </button>
              <button
                disabled={loading || pin.length === 0 || !selectedStaffId}
                onClick={() => handlePinSubmit()}
                className="w-18 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-white font-black text-xs shadow-lg shadow-amber-500/30 transition disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                {loading ? '...' : <ArrowRight className="w-5 h-5 stroke-[3] text-white" />}
              </button>
            </div>
          </div>
        ) : (
          /* EMAIL LOGIN TAB */
          <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-zinc-400 uppercase mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="staff@nitsuh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50 placeholder-stone-400 dark:placeholder-zinc-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-zinc-400 uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50 placeholder-stone-400 dark:placeholder-zinc-600 shadow-xs"
              />
            </div>

            {error && (
              <div className="py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs rounded-2xl shadow-xl shadow-amber-500/25 transition cursor-pointer active:scale-98"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
