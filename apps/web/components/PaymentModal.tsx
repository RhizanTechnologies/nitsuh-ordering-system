'use client';

import React, { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, Check, Sparkles } from 'lucide-react';
import { playPaymentChime } from '@/lib/audio';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  onConfirmPayment: (paymentMethod: string, amount: number) => Promise<void>;
  onShowReceipt: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  orderTotal,
  onConfirmPayment,
  onShowReceipt,
}: PaymentModalProps) {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_PAY'>('CASH');
  const [customTip, setCustomTip] = useState<string>('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const tipNumber = Math.max(0, parseFloat(customTip) || 0);
  const totalPayable = orderTotal + tipNumber;
  const cashReceivedNumber = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashReceivedNumber - totalPayable);

  const handlePay = async () => {
    setProcessing(true);
    try {
      await onConfirmPayment(paymentMethod, totalPayable);
      playPaymentChime();
      onClose();
      onShowReceipt();
    } catch (e: any) {
      alert(`Payment failed: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161311] text-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-white/15 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-black text-white">Process Customer Tender</h3>
            <p className="text-xs text-zinc-400">Order Subtotal: {orderTotal.toFixed(2)} ETB</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.08] hover:bg-white/[0.15] rounded-xl transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Total Banner */}
        <div className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl text-center backdrop-blur-xl">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Amount To Pay</div>
          <div className="text-3xl font-black text-amber-400 mt-0.5 tracking-tight">
            {totalPayable.toFixed(2)} ETB
          </div>
          {tipNumber > 0 && (
            <div className="text-[11px] text-amber-300 font-bold mt-1">
              Base: {orderTotal.toFixed(2)} ETB + Custom Tip: {tipNumber.toFixed(2)} ETB
            </div>
          )}
        </div>

        {/* Custom Tip Input (No presets) */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Custom Server Tip / Gratuity (ETB)
            </span>
            {tipNumber > 0 && (
              <span className="text-amber-400 font-black">+{tipNumber.toFixed(2)} ETB</span>
            )}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="Enter custom tip amount (e.g. 25 ETB)..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition pr-16"
            />
            {customTip && (
              <button
                type="button"
                onClick={() => setCustomTip('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-white px-2 py-1 bg-white/[0.08] hover:bg-white/[0.15] rounded-xl transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Ethiopian Payment Tender */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5">
            Ethiopian Payment Tender
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-2 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <Banknote className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold">Cash (Birr)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('MOBILE_PAY')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'MOBILE_PAY'
                  ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-2 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <Smartphone className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold">Telebirr</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'CARD'
                  ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-2 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <CreditCard className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold">CBE / Card</span>
            </button>
          </div>
        </div>

        {/* Optional Cash Tender for Change Calculation (No quick cash preset buttons) */}
        {paymentMethod === 'CASH' && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-bold">Cash Received (Optional)</span>
              {cashReceivedNumber >= totalPayable && (
                <span className="text-emerald-400 font-black text-xs">
                  Change: {change.toFixed(2)} ETB
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder={`e.g. ${Math.ceil(totalPayable)} ETB`}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400/60"
            />
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handlePay}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-[#C11221] hover:brightness-110 text-black font-black text-xs shadow-xl shadow-amber-500/25 transition flex items-center gap-2 flex-1 justify-center disabled:opacity-50 cursor-pointer active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{processing ? 'Processing Payment...' : 'Settle Payment & Print Slip'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}