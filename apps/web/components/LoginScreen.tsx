'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getDefaultRouteForRole } from '@/lib/route-guard';
import { fetchApi } from '@/lib/api';
import { NitsuhLogo } from '@/components/NitsuhLogo';
import { Lock, KeyRound, ArrowRight, UserCircle, Check, HelpCircle, Sparkles, X, ShieldAlert, ChevronDown } from 'lucide-react';

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pin' | 'password'>('pin');

  // Staff list for profile-targeted PIN authentication
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Email/Employee Code login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Password / PIN Reset Request Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotTargetStaffId, setForgotTargetStaffId] = useState('');
  const [forgotCustomCode, setForgotCustomCode] = useState('');
  const [forgotNote, setForgotNote] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Close custom dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean raw staff names (e.g. remove legacy parenthetical notes like '(Waiter)')
  const cleanStaffName = (name: string) => {
    return (name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  };

  const formatRoleName = (role: string) => {
    switch (role) {
      case 'WAITER': return 'Waiter';
      case 'CASHIER': return 'Cashier';
      case 'KITCHEN_STAFF': return 'Kitchen Cook';
      case 'HEAD_CHEF': return 'Head Chef';
      case 'MAIN_STOREKEEPER': return 'Main Storekeeper';
      case 'KITCHEN_STOREKEEPER': return 'Kitchen Storekeeper';
      case 'MANAGER': return 'Manager';
      case 'OWNER': return 'Owner';
      default: return role;
    }
  };

  // Filter out OWNER and MANAGER from the PIN dropdown (they sign in via Manager / Owner Password tab)
  const visibleStaffList = staffList.filter((s) => s.role !== 'OWNER' && s.role !== 'MANAGER');

  const loadStaffProfiles = () => {
    setStaffLoading(true);
    setStaffError(null);
    fetchApi('/auth/staff')
      .then((data) => {
        if (Array.isArray(data)) {
          setStaffList(data);
          const savedStaffId = typeof window !== 'undefined' ? localStorage.getItem('nitsuh_last_staff_id') : null;
          if (savedStaffId && data.some((s) => s.id === savedStaffId && s.role !== 'OWNER' && s.role !== 'MANAGER')) {
            setSelectedStaffId(savedStaffId);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load staff list:', err);
        setStaffError(err?.message || 'Could not load staff profiles');
      })
      .finally(() => {
        setStaffLoading(false);
      });
  };

  // Load active staff profiles for the dropdown
  useEffect(() => {
    loadStaffProfiles();
  }, []);

  const selectedStaff = visibleStaffList.find((s) => s.id === selectedStaffId);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { label: 'Owner / Executive', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'MANAGER':
        return { label: 'General Manager', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'CASHIER':
        return { label: 'Cashier / POS', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'WAITER':
        return { label: 'Service Waiter', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'KITCHEN_STAFF':
        return { label: 'Kitchen Cook', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'HEAD_CHEF':
        return { label: 'Head Chef', color: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'MAIN_STOREKEEPER':
        return { label: 'Main Storekeeper', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'KITCHEN_STOREKEEPER':
        return { label: 'Kitchen Storekeeper', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: role, color: 'bg-stone-50 text-stone-700 border-stone-200' };
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
    if (activeTab !== 'pin' || loading || isForgotModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input, textarea, select, or if modal is open
      const target = e.target as HTMLElement | null;
      if (
        isForgotModalOpen ||
        (target &&
          (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
            target.isContentEditable))
      ) {
        return;
      }

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
  }, [activeTab, loading, isForgotModalOpen, pin, selectedStaffId]);

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
        body: JSON.stringify({ identifier: email, password }),
      });

      login(res.accessToken, res.user);
      const targetRoute = getDefaultRouteForRole(res.user.role);
      router.push(targetRoute);
    } catch (err: any) {
      setError(err.message || 'Invalid Employee Code, Email or Password');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotTargetStaffId(selectedStaffId || (visibleStaffList[0]?.id || ''));
    setForgotCustomCode('');
    setForgotNote('');
    setForgotError(null);
    setForgotSuccess(null);
    setIsForgotModalOpen(true);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotTargetStaffId && !forgotCustomCode.trim()) {
      setForgotError('Please select your staff profile or enter your employee code');
      return;
    }

    setForgotSubmitting(true);
    setForgotError(null);

    try {
      const res = await fetchApi('/users/reset-request', {
        method: 'POST',
        body: JSON.stringify({
          userId: forgotTargetStaffId || undefined,
          identifier: !forgotTargetStaffId ? forgotCustomCode.trim() : undefined,
          note: forgotNote.trim() || undefined,
        }),
      });

      setForgotSuccess(
        res.message || 'Reset request logged! Please notify your Shift Manager or Owner.'
      );
    } catch (err: any) {
      setForgotError(err.message || 'Could not submit reset request. Please contact your manager directly.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-stone-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle ambient lighting accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200/80 overflow-hidden relative z-10 transition-all">
        {/* Header Branding: Clean Circular Nitsuh Brand Emblem & Identity */}
        <div className="p-6 pb-4 text-center border-b border-stone-100 bg-gradient-to-b from-stone-50/60 to-white">
          <NitsuhLogo variant="login" />
        </div>

        {/* Modern Segmented Tab Switch (Staff PIN vs Manager Password) */}
        <div className="px-6 pt-5">
          <div className="bg-stone-100/80 p-1 rounded-2xl flex gap-1 border border-stone-200/70">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pin');
                setError(null);
              }}
              className={`flex-1 py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 rounded-xl cursor-pointer ${
                activeTab === 'pin'
                  ? 'bg-white text-stone-900 shadow-xs font-black'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <KeyRound className={`w-3.5 h-3.5 ${activeTab === 'pin' ? 'text-emerald-600' : 'text-stone-400'}`} />
              <span>Staff Profile & PIN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('password');
                setError(null);
              }}
              className={`flex-1 py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 rounded-xl cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-white text-stone-900 shadow-xs font-black'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Lock className={`w-3.5 h-3.5 ${activeTab === 'password' ? 'text-emerald-600' : 'text-stone-400'}`} />
              <span>Manager / Owner</span>
            </button>
          </div>
        </div>

        {/* PIN LOGIN TAB */}
        {activeTab === 'pin' ? (
          <div className="p-5 sm:p-6 flex flex-col items-center space-y-4">
            {/* Step 1: Employee Name Dropdown */}
            <div className="w-full relative" ref={dropdownRef}>
              <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 text-center">
                1. Select Your Staff Profile
              </label>

              {/* Modern Trigger Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={staffLoading}
                className="w-full flex items-center justify-between gap-3 bg-stone-50 hover:bg-stone-100/70 border border-stone-200 hover:border-emerald-500/60 rounded-2xl px-3.5 py-3 text-left transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                {selectedStaff ? (
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {selectedStaff.avatarUrl ? (
                      <img
                        src={selectedStaff.avatarUrl}
                        alt={selectedStaff.name}
                        className="w-8 h-8 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-500/20 flex items-center justify-center font-black text-xs flex-shrink-0">
                        {cleanStaffName(selectedStaff.name).charAt(0)}
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-black text-stone-900 truncate">
                      {cleanStaffName(selectedStaff.name)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-auto flex-shrink-0 ${getRoleBadge(selectedStaff.role).color}`}>
                      {formatRoleName(selectedStaff.role)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold py-0.5">
                    <UserCircle className="w-5 h-5 text-stone-400 flex-shrink-0" />
                    <span>{staffLoading ? 'Loading staff profiles...' : 'Choose your profile / name...'}</span>
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Modern Floating Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto no-scrollbar">
                  {visibleStaffList.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-stone-500 text-center flex flex-col items-center gap-2">
                      <span>{staffLoading ? 'Loading staff profiles...' : staffError ? staffError : 'No staff profiles found'}</span>
                      {!staffLoading && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadStaffProfiles();
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ) : (
                    visibleStaffList.map((staff) => {
                      const isSelected = staff.id === selectedStaffId;
                      const roleBadge = getRoleBadge(staff.role);
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            setSelectedStaffId(staff.id);
                            setIsDropdownOpen(false);
                            setError(null);
                            setPin('');
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('nitsuh_last_staff_id', staff.id);
                            }
                          }}
                          className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/70 text-emerald-900 font-bold'
                              : 'hover:bg-stone-50 text-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isSelected ? 'bg-emerald-600 text-white font-black' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {cleanStaffName(staff.name).charAt(0)}
                            </div>
                            <span className="text-xs font-black truncate">
                              {cleanStaffName(staff.name)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                              {formatRoleName(staff.role)}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Step 2: PIN Dots Display */}
            <div className="text-center pt-0.5">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {selectedStaff ? `2. Enter PIN for ${selectedStaff.name.split(' ')[0]}` : '2. Enter 4-Digit PIN'}
              </div>
              <div className="flex items-center justify-center gap-3 mt-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      pin.length > idx
                        ? 'bg-emerald-600 border-emerald-600 scale-110 shadow-sm shadow-emerald-600/30'
                        : 'border-stone-300 bg-stone-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="w-full text-center py-2 px-3 bg-rose-50 border border-rose-300 text-rose-700 rounded-2xl text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            {/* Touch Number Pad */}
            <div className="grid grid-cols-3 gap-2.5 w-64 pt-0.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleNumberClick(digit)}
                  className="w-18 sm:w-20 h-12 sm:h-13 rounded-2xl bg-stone-50 hover:bg-stone-100 active:scale-95 border border-stone-200/90 text-xl font-black text-stone-900 transition shadow-2xs hover:border-stone-300 cursor-pointer select-none flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="w-18 sm:w-20 h-12 sm:h-13 rounded-2xl bg-stone-100/70 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 active:scale-95 text-xs font-black text-stone-500 border border-stone-200/80 transition cursor-pointer select-none flex items-center justify-center"
              >
                CLEAR
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="w-18 sm:w-20 h-12 sm:h-13 rounded-2xl bg-stone-50 hover:bg-stone-100 active:scale-95 border border-stone-200/90 text-xl font-black text-stone-900 transition shadow-2xs hover:border-stone-300 cursor-pointer select-none flex items-center justify-center"
              >
                0
              </button>
              <button
                disabled={loading || pin.length === 0 || !selectedStaffId}
                onClick={() => handlePinSubmit()}
                className="w-18 sm:w-20 h-12 sm:h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                {loading ? '...' : <ArrowRight className="w-5 h-5 stroke-[3] text-white" />}
              </button>
            </div>

            {/* Forgotten PIN Request Link */}
            <div className="pt-1 text-center w-full">
              <button
                type="button"
                onClick={handleOpenForgot}
                className="text-[11px] font-bold text-stone-500 hover:text-emerald-700 transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer py-1"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Forgot PIN? Request Reset from Manager</span>
              </button>
            </div>
          </div>
        ) : (
          /* EMAIL / EMPLOYEE CODE LOGIN TAB */
          <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">
                Manager / Owner Username, Code or Email
              </label>
              <input
                type="text"
                placeholder="e.g. Adam, John, or EMP-002"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-4 py-3 text-xs font-semibold text-stone-900 placeholder-stone-400 shadow-2xs focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-4 py-3 text-xs font-semibold text-stone-900 placeholder-stone-400 shadow-2xs focus:outline-none transition"
              />
            </div>

            {error && (
              <div className="py-2.5 px-3 bg-rose-50 border border-rose-300 text-rose-700 rounded-2xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-600/25 transition cursor-pointer active:scale-98"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleOpenForgot}
                className="text-[11px] font-bold text-stone-500 hover:text-emerald-700 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Forgot password? Request reset</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ================= MODAL: FORGOTTEN PIN / PASSWORD RESET REQUEST ================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Credential Reset Request</h3>
                  <p className="text-[11px] text-stone-500">
                    Request new PIN or temporary password from Manager
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory banner */}
            <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-200/70 text-emerald-900 rounded-2xl text-[11px] leading-relaxed">
              💡 <strong>Manager / Owner Assistance:</strong> When you submit this request, your Shift Manager or Owner can log into <strong>Staff Management</strong> to immediately generate and provide your new PIN or password.
            </div>

            {forgotError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded-2xl">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div className="text-xs font-black text-emerald-900">
                  {forgotSuccess}
                </div>
                <p className="text-[11px] text-stone-600">
                  Please inform your Shift Manager or Owner. They will generate your new credentials in their admin console.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5 mt-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Select Your Staff Profile
                  </label>
                  <select
                    value={forgotTargetStaffId}
                    onChange={(e) => setForgotTargetStaffId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Profile from List --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {cleanStaffName(s.name)} ({formatRoleName(s.role)}) [{s.employeeCode || 'STAFF'}]
                      </option>
                    ))}
                  </select>
                </div>

                {!forgotTargetStaffId && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Or Enter Employee Code / Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-003 or your full name"
                      value={forgotCustomCode}
                      onChange={(e) => setForgotCustomCode(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Optional Note for Manager
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Forgot PIN after shift change"
                    value={forgotNote}
                    onChange={(e) => setForgotNote(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {forgotSubmitting ? 'Submitting...' : 'Submit Request to Manager'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
