'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getDefaultRouteForRole } from '@/lib/route-guard';
import { fetchApi } from '@/lib/api';
import { NitsuhLogo } from '@/components/NitsuhLogo';
import { Lock, KeyRound, ArrowRight } from 'lucide-react';

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pin' | 'password'>('pin');

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleNumberClick = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError(null);
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
  }, [activeTab, loading, pin]);

  const handlePinSubmit = async (pinToTest?: string) => {
    const finalPin = pinToTest || pin;
    if (!finalPin) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi('/auth/login-pin', {
        method: 'POST',
        body: JSON.stringify({ pin: finalPin }),
      });

      login(res.accessToken, res.user);
      const targetRoute = getDefaultRouteForRole(res.user.role);
      router.push(targetRoute);
    } catch (err: any) {
      setError(err.message || 'Invalid Employee PIN');
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
    <div className="min-h-screen bg-[#0D0B0A] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C11221]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#161311]/90 backdrop-blur-2xl rounded-[36px] shadow-2xl border border-white/15 overflow-hidden relative z-10">
        {/* Header Branding: Nitsuh Creative Brand Logo & Emblem */}
        <div className="bg-gradient-to-b from-[#C11221]/25 via-white/[0.03] to-transparent p-6 text-center text-white relative border-b border-white/10">
          <NitsuhLogo variant="login" />
        </div>

        {/* Tab switch (PIN / Email) */}
        <div className="flex border-b border-white/10 bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pin'
                ? 'border-b-2 border-amber-400 text-amber-300 bg-white/[0.04]'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Quick Touch PIN</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'password'
                ? 'border-b-2 border-amber-400 text-amber-300 bg-white/[0.04]'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Manager Password</span>
          </button>
        </div>

        {/* PIN LOGIN TAB */}
        {activeTab === 'pin' ? (
          <div className="p-6 flex flex-col items-center space-y-4">
            <div className="text-center">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Enter Employee PIN</div>
              <div className="flex items-center justify-center gap-3 mt-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      pin.length > idx
                        ? 'bg-amber-400 border-amber-300 scale-110 shadow-lg shadow-amber-500/40'
                        : 'border-white/20 bg-white/[0.05]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="w-full text-center py-2.5 px-3 bg-rose-950/40 border border-rose-500/50 text-rose-300 rounded-2xl text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            {/* Touch Number Pad */}
            <div className="grid grid-cols-3 gap-3 w-64 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleNumberClick(digit)}
                  className="w-18 h-14 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/10 text-xl font-black text-white transition shadow-lg cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="w-18 h-14 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] active:scale-95 text-xs font-black text-zinc-400 hover:text-white transition cursor-pointer border border-white/10"
              >
                CLEAR
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="w-18 h-14 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/10 text-xl font-black text-white transition shadow-lg cursor-pointer"
              >
                0
              </button>
              <button
                disabled={loading || pin.length === 0}
                onClick={() => handlePinSubmit()}
                className="w-18 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-black font-black text-xs shadow-xl shadow-amber-500/30 transition disabled:opacity-30 flex items-center justify-center cursor-pointer"
              >
                {loading ? '...' : <ArrowRight className="w-6 h-6 stroke-[3]" />}
              </button>
            </div>
          </div>
        ) : (
          /* EMAIL LOGIN TAB */
          <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="staff@nitsuh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/50 placeholder-zinc-600"
              />
            </div>

            {error && (
              <div className="py-2.5 px-3 bg-rose-950/40 border border-rose-500/50 text-rose-300 rounded-2xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-2xl shadow-xl shadow-amber-500/25 transition cursor-pointer active:scale-98"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
