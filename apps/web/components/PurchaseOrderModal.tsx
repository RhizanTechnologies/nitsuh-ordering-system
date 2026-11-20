'use client';

import React, { useState, useEffect } from 'react';
import { X, Truck, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseRecorded: () => void;
  currentUserId: string;
}

export function PurchaseOrderModal({
  isOpen,
  onClose,
  onPurchaseRecorded,
  currentUserId,
}: PurchaseOrderModalProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'PAID' | 'CREDIT' | 'PARTIAL'>('PAID');
  const [amountPaidNow, setAmountPaidNow] = useState('');
  const [creditDueDate, setCreditDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [items, setItems] = useState<
    { ingredientId: string; quantity: number; totalCost: number; unitId: string; name: string; symbol: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetchApi('/inventory/suppliers').then((data) => {
      setSuppliers(data || []);
      if (data && data.length > 0) setSelectedSupplierId(data[0].id);
    });

    fetchApi('/inventory/balances').then((locations) => {
      const main = locations?.find?.((l: any) => l.type === 'MAIN_STORE');
      if (main && Array.isArray(main.balances)) {
        setIngredients(main.balances.map((b: any) => b.ingredient).filter(Boolean));
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = (ingredientId: string) => {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;
    if (items.some((i) => i.ingredientId === ingredientId)) return;

    setItems((prev) => [
      ...prev,
      {
        ingredientId: ing.id,
        quantity: 10000, // 10 kg default
        totalCost: 200,
        unitId: ing.baseUnitId,
        name: ing.name,
        symbol: ing.baseUnit?.symbol || 'g',
      },
    ]);
  };

  const handleUpdateItem = (ingredientId: string, field: 'quantity' | 'totalCost', val: number) => {
    setItems((prev) =>
      prev.map((i) => (i.ingredientId === ingredientId ? { ...i, [field]: val } : i)),
    );
  };

  const handleRemove = (ingredientId: string) => {
    setItems((prev) => prev.filter((i) => i.ingredientId !== ingredientId));
  };

  const grandTotal = items.reduce((sum, i) => sum + i.totalCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !selectedSupplierId) return;

    const paymentSummary =
      paymentTerms === 'PAID'
        ? `[Tender: Paid in Full (${grandTotal.toFixed(2)} ETB)]`
        : paymentTerms === 'CREDIT'
        ? `[Tender: On Credit / AP - Due: ${creditDueDate || 'Net 30'}] (Unpaid: ${grandTotal.toFixed(2)} ETB)`
        : `[Tender: Partial Deposit - Paid: ${parseFloat(amountPaidNow || '0').toFixed(2)} ETB, Balance Due: ${(grandTotal - (parseFloat(amountPaidNow) || 0)).toFixed(2)} ETB, Due: ${creditDueDate || 'Net 30'}]`;

    const combinedNotes = [paymentSummary, notes.trim()].filter(Boolean).join(' • ');

    setSubmitting(true);
    try {
      await fetchApi('/inventory/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          invoiceNumber,
          createdById: currentUserId || 'm01-storekeeper',
          notes: combinedNotes,
          items: items.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            totalCost: i.totalCost,
            unitId: i.unitId,
          })),
        }),
      });

      onPurchaseRecorded();
      onClose();
    } catch (e: any) {
      alert(`Error recording purchase: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-stone-900 dark:text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 font-black flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white font-heading">
                Record Supplier Bulk Delivery (Main Store)
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Receives bulk ingredients and recalculates unit cost (ETB/g, ETB/ml) via Weighted Average Cost.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Supplier
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
                className="w-full bg-white dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Vendor Invoice #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9921"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-white dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Add Ingredient Line */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Delivered Stock Items
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full bg-white dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-[#1C1815] text-stone-500 dark:text-zinc-400">+ Select ingredient from database...</option>
              {ingredients
                .filter((i) => !items.some((it) => it.ingredientId === i.id))
                .map((ing) => (
                  <option key={ing.id} value={ing.id} className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white">
                    {ing.name} (Current: {Number(ing.currentCostPerBaseUnit).toFixed(4)} ETB / {ing.baseUnit?.symbol})
                  </option>
                ))}
            </select>
          </div>

          {/* Delivered Stock Items (Card Format) */}
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto no-scrollbar">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 dark:text-zinc-500 bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/5 rounded-2xl">
                No items added yet. Select an ingredient above to restock.
              </div>
            ) : (
              items.map((i) => {
                const unitCost = i.quantity > 0 ? i.totalCost / i.quantity : 0;
                return (
                  <div
                    key={i.ingredientId}
                    className="p-3 bg-stone-50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 hover:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">{i.name}</div>
                      <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">
                        New Cost: <span className="text-amber-600 dark:text-amber-400 font-bold">{unitCost.toFixed(4)} ETB / {i.symbol}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-xl px-2 py-1">
                        <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400">Qty:</span>
                        <input
                          type="number"
                          step="any"
                          value={i.quantity}
                          onChange={(e) =>
                            handleUpdateItem(i.ingredientId, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-transparent text-xs font-bold text-stone-900 dark:text-white focus:outline-none text-right"
                        />
                        <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-semibold">{i.symbol}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-xl px-2 py-1">
                        <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400">Total:</span>
                        <input
                          type="number"
                          step="any"
                          value={i.totalCost}
                          onChange={(e) =>
                            handleUpdateItem(i.ingredientId, 'totalCost', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-transparent text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none text-right"
                        />
                        <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-semibold">ETB</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(i.ingredientId)}
                        className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center bg-stone-100 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 p-3 rounded-2xl text-xs font-bold">
            <span className="text-stone-600 dark:text-zinc-400">Total Purchase Value:</span>
            <span className="text-base text-amber-600 dark:text-amber-400 font-extrabold">{grandTotal.toFixed(2)} ETB</span>
          </div>

          {/* Payment Terms & Credit Tracking (BUG-017) */}
          <div className="bg-stone-50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 rounded-2xl p-3 space-y-2">
            <div className="text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase">Payment Terms & Credit Status</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentTerms('PAID')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentTerms === 'PAID'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'bg-white dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-600 dark:text-zinc-400'
                }`}
              >
                Paid in Full
              </button>
              <button
                type="button"
                onClick={() => setPaymentTerms('CREDIT')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentTerms === 'CREDIT'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-400'
                    : 'bg-white dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-600 dark:text-zinc-400'
                }`}
              >
                On Credit (AP)
              </button>
              <button
                type="button"
                onClick={() => setPaymentTerms('PARTIAL')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentTerms === 'PARTIAL'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400'
                    : 'bg-white dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-600 dark:text-zinc-400'
                }`}
              >
                Partial Deposit
              </button>
            </div>

            {paymentTerms === 'PARTIAL' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase mb-0.5">Amount Paid (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase mb-0.5">Due Date / Terms</label>
                  <input
                    type="text"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    placeholder="e.g. In 15 days"
                    className="w-full bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {paymentTerms === 'CREDIT' && (
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase mb-0.5">Payment Due Date</label>
                <input
                  type="text"
                  value={creditDueDate}
                  onChange={(e) => setCreditDueDate(e.target.value)}
                  placeholder="e.g. End of Month / Net 30"
                  className="w-full bg-white dark:bg-white/5 border border-stone-300 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-900 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Committing to Store...' : 'Commit Purchase to Main Store'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
