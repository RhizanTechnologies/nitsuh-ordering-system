'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, KNOWN_STAFF } from '@/lib/store';
import { getDefaultRouteForRole } from '@/lib/route-guard';
import { fetchApi } from '@/lib/api';
import { Lock, KeyRound, ArrowRight } from 'lucide-react';

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pin' | 'password'>('pin');

  // Email login state
  const [email, setEmail] = useState('adam@nitsuh.com');
  const [password, setPassword] = useState('password123');

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
        {/* Header Branding: Nitsuh Crimson & Gold */}
        <div className="bg-gradient-to-b from-[#C11221]/30 via-white/[0.03] to-transparent p-6 text-center text-white relative border-b border-white/10">
          <div className="inline-flex w-18 h-18 rounded-3xl bg-white/[0.08] backdrop-blur-xl p-2.5 items-center justify-center mb-3 shadow-2xl border border-white/20 ring-2 ring-amber-500/30">
            <img src="/nitsuh-logo.png" alt="Nitsuh Foods Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white flex items-center justify-center gap-1.5 drop-shadow-md">
            <span className="text-[#EF4444]">NITSUH</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">FOODS</span>
          </h1>
          <p className="text-xs text-amber-300 font-bold tracking-tight mt-1">From Savour Bites to Sweet Delights – We Cater It All!</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Addis Ababa, Ethiopia • Terminal Access • 0966833177</p>
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

            {/* Quick Demo PIN Helpers */}
            <div className="w-full pt-4 border-t border-white/10 space-y-1.5">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center mb-1">
                Role-Based Employee Test PINs:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {KNOWN_STAFF.map((s) => (
                  <button
                    key={s.pin}
                    onClick={() => {
                      setPin(s.pin);
                      handlePinSubmit(s.pin);
                    }}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{s.name}</div>
                      <div className="text-[10px] text-amber-400 font-semibold">{s.role}</div>
                    </div>
                    <span className="font-mono text-xs font-black text-zinc-400 bg-white/10 px-1.5 py-0.5 rounded">
                      {s.pin}
                    </span>
                  </button>
                ))}
              </div>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/50"
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
              {loading ? 'Verifying...' : 'Sign In as Manager'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
