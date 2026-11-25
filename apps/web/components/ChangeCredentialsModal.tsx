'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi } from '@/lib/api';
import { KeyRound, Lock, X, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';

interface ChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeCredentialsModal({ isOpen, onClose }: ChangeCredentialsModalProps) {
  const { currentUser, login } = useAppStore();

  const isManagement = currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER';
  const [activeTab, setActiveTab] = useState<'pin' | 'password'>(isManagement ? 'password' : 'pin');

  // PIN Form State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleResetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentUser.role !== 'OWNER' && !currentPin.trim()) {
      setError('Please enter your current 4-digit PIN');
      return;
    }
    if (!newPin.trim() || !/^\d{4,6}$/.test(newPin.trim())) {
      setError('New PIN must be 4 to 6 numeric digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PIN and Confirm PIN do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/users/profile/change-credentials', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPin: currentPin.trim() || undefined,
          newPin: newPin.trim(),
        }),
      });

      if (res.user) {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('cafe_token') || '' : '';
        login(storedToken, { ...currentUser, ...res.user });
      }

      setSuccessMsg(res.message || 'Your PIN has been changed successfully!');
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to update PIN. Please verify your current PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and Confirm Password do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/users/profile/change-credentials', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.user) {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('cafe_token') || '' : '';
        login(storedToken, { ...currentUser, ...res.user });
      }

      setSuccessMsg(res.message || 'Your password has been changed successfully!');
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">Profile Security</h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch if manager/owner, or subtitle for operational staff */}
        {isManagement ? (
          <div className="flex border border-stone-200 mt-3 bg-stone-100/70 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('password');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-500/20 font-black'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('pin');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pin'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-500/20 font-black'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terminal PIN</span>
            </button>
          </div>
        ) : (
          <div className="mt-3 text-[11px] text-stone-600">
            Enter your current 4-digit PIN to choose a new PIN code for terminal authentication.
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMsg ? (
          <div className="mt-4 p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="text-xs font-black text-emerald-800">{successMsg}</div>
          </div>
        ) : (
          <>
            {/* PIN CHANGE FORM */}
            {activeTab === 'pin' && (
              <form onSubmit={handlePinSubmit} className="space-y-3.5 mt-3.5">
                {currentUser.role !== 'OWNER' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Current 4-Digit PIN
                    </label>
                    <Input
                      type="password"
                      maxLength={6}
                      placeholder="••••"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      required
                      className="font-mono text-center tracking-widest text-base"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    New 4-Digit PIN
                  </label>
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    required
                    className="font-mono text-center tracking-widest text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Confirm New PIN
                  </label>
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    required
                    className="font-mono text-center tracking-widest text-base"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update PIN'}
                  </button>
                </div>
              </form>
            )}

            {/* PASSWORD CHANGE FORM */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3.5 mt-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Current Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    New Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Confirm New Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 text-stone-500" /> : <Eye className="w-3.5 h-3.5 text-stone-500" />}
                    <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
