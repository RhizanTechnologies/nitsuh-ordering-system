'use client';

import React, { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, Check, Sparkles } from 'lucide-react';
import { playPaymentChime } from '@/lib/audio';
import { Button, Input } from '@/components/ui';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  onConfirmPayment: (paymentMethod: string, amount: number, transactionRef?: string) => Promise<void>;
  onShowReceipt: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  orderTotal,
  onConfirmPayment,
  onShowReceipt,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_PAY' | 'BANK_TRANSFER'>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [customTip, setCustomTip] = useState<string>('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const tipNumber = Math.max(0, parseFloat(customTip) || 0);
  const totalPayable = orderTotal + tipNumber;
  const cashReceivedNumber = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashReceivedNumber - totalPayable);

  const handlePay = async () => {
    setProcessing(true);
    setErrorMsg(null);
    try {
      await onConfirmPayment(paymentMethod, totalPayable, transactionRef.trim() || undefined);
      playPaymentChime();
      onClose();
      onShowReceipt();
    } catch (e: any) {
      setErrorMsg(`Payment failed: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161311] text-stone-900 dark:text-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-white/15 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-black text-stone-900 dark:text-white">Process Customer Tender</h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400">Order Subtotal: {orderTotal.toFixed(2)} ETB</p>
          </div>
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Big Total Banner */}
        <div className="bg-stone-50 dark:bg-white/[0.04] border border-stone-200/90 dark:border-white/10 p-4 rounded-2xl text-center">
          <div className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Amount To Pay</div>
          <div className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-0.5 tracking-tight">
            {totalPayable.toFixed(2)} ETB
          </div>
          {tipNumber > 0 && (
            <div className="text-[11px] text-amber-800 dark:text-amber-300 font-bold mt-1">
              Base: {orderTotal.toFixed(2)} ETB + Custom Tip: {tipNumber.toFixed(2)} ETB
            </div>
          )}
        </div>

        {/* Custom Tip Input */}
        <div>
          <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Custom Server Tip / Gratuity (ETB)
            </span>
            {tipNumber > 0 && (
              <span className="text-amber-700 dark:text-amber-400 font-black">+{tipNumber.toFixed(2)} ETB</span>
            )}
          </label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              step="any"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="Enter custom tip amount (e.g. 25 ETB)..."
              className="pr-16"
            />
            {customTip && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCustomTip('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Ethiopian Payment Tender */}
        <div>
          <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase mb-1.5">
            Payment Tender
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                  : 'bg-stone-50 dark:bg-white/[0.04] text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/[0.08]'
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-black">Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('MOBILE_PAY')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'MOBILE_PAY'
                  ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                  : 'bg-stone-50 dark:bg-white/[0.04] text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/[0.08]'
              }`}
            >
              <Smartphone className="w-5 h-5 text-sky-600" />
              <span className="text-xs font-black">Telebirr</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('BANK_TRANSFER')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                paymentMethod === 'BANK_TRANSFER'
                  ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold shadow-xs'
                  : 'bg-stone-50 dark:bg-white/[0.04] text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/[0.08]'
              }`}
            >
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-black">CBE</span>
            </button>
          </div>
        </div>

        {/* Transaction Reference ID for Electronic Payments (Telebirr, CBE) */}
        {paymentMethod !== 'CASH' && (
          <div className="bg-stone-50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600 dark:text-zinc-300 font-bold">
                {paymentMethod === 'MOBILE_PAY'
                  ? 'Telebirr Transaction ID (Optional)'
                  : 'CBE Reference / Slip Number (Optional)'}
              </span>
            </div>
            <Input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. TXN-9482701..."
            />
          </div>
        )}

        {/* Optional Cash Tender for Change Calculation */}
        {paymentMethod === 'CASH' && (
          <div className="bg-stone-50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-zinc-400 font-bold">Cash Received (Optional)</span>
              {cashReceivedNumber >= totalPayable && (
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">
                  Change: {change.toFixed(2)} ETB
                </span>
              )}
            </div>
            <Input
              type="number"
              min="0"
              step="any"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder={`e.g. ${Math.ceil(totalPayable)} ETB`}
            />
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-white/10">
          <Button
            variant="secondary"
            size="default"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="default"
            disabled={processing}
            onClick={handlePay}
            className="flex-1"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{processing ? 'Processing...' : 'Settle Payment & Print Slip'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
