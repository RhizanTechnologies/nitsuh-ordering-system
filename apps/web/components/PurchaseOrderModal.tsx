'use client';

import React, { useState, useEffect } from 'react';
import { X, Truck, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

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
  const { t, lang } = useTranslation();
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);
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
      setErrorMessage(e.message || 'Error recording purchase delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-stone-900 space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">
                {t('po_title', 'Record Supplier Delivery (Main Store)')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                {t('po_supplier', 'Supplier')}
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
                className="w-full bg-white border border-stone-300 rounded-2xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white text-stone-900">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                {t('po_vendor_invoice', 'Vendor Invoice #')}
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9921"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-2xl px-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Add Ingredient Line */}
          <div>
            <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
              {t('po_delivered_items', 'Delivered Stock Items')}
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full bg-white border border-stone-300 rounded-2xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="" className="bg-white text-stone-500">{t('po_select_ingredient', '+ Select ingredient from database...')}</option>
              {ingredients
                .filter((i) => !items.some((it) => it.ingredientId === i.id))
                .map((ing) => (
                  <option key={ing.id} value={ing.id} className="bg-white text-stone-900">
                    {ing.name} ({lang === 'am' ? 'የአሁኑ ዋጋ' : 'Current'}: {Number(ing.currentCostPerBaseUnit).toFixed(4)} {lang === 'am' ? 'ብር' : 'ETB'} / {ing.baseUnit?.symbol})
                  </option>
                ))}
            </select>
          </div>

          {/* Delivered Stock Items (Card Format) */}
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto no-scrollbar">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-2xl">
                {t('po_no_items', 'No items added yet. Select an ingredient above to restock.')}
              </div>
            ) : (
              items.map((i) => {
                const unitCost = i.quantity > 0 ? i.totalCost / i.quantity : 0;
                return (
                  <div
                    key={i.ingredientId}
                    className="p-3 bg-stone-50 border border-stone-200 hover:border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-stone-900 truncate">{i.name}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        {t('po_new_cost', 'New Cost:')} <span className="text-emerald-700 font-bold">{unitCost.toFixed(4)} {lang === 'am' ? 'ብር' : 'ETB'} / {i.symbol}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2 py-1">
                        <span className="text-[10px] font-bold text-stone-500">{t('po_qty', 'Qty:')}</span>
                        <input
                          type="number"
                          step="any"
                          value={i.quantity}
                          onChange={(e) =>
                            handleUpdateItem(i.ingredientId, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-transparent text-xs font-bold text-stone-900 focus:outline-none text-right"
                        />
                        <span className="text-[10px] text-stone-500 font-semibold">{i.symbol}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2 py-1">
                        <span className="text-[10px] font-bold text-stone-500">{t('po_total', 'Total:')}</span>
                        <input
                          type="number"
                          step="any"
                          value={i.totalCost}
                          onChange={(e) =>
                            handleUpdateItem(i.ingredientId, 'totalCost', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-transparent text-xs font-bold text-emerald-700 focus:outline-none text-right"
                        />
                        <span className="text-[10px] text-stone-500 font-semibold">{lang === 'am' ? 'ብር' : 'ETB'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(i.ingredientId)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title={lang === 'am' ? 'ዕቃ አስወግድ' : 'Remove item'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center bg-stone-100 border border-stone-200 p-3 rounded-2xl text-xs font-bold">
            <span className="text-stone-600">{t('po_total_val', 'Total Purchase Value:')}</span>
            <span className="text-base text-emerald-800 font-extrabold">{grandTotal.toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'}</span>
          </div>

          {/* Payment Terms & Credit Tracking */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2">
            <div className="text-[11px] font-bold text-stone-600 uppercase">{t('po_payment_terms', 'Payment Terms & Credit Status')}</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentTerms('PAID')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentTerms === 'PAID'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-black'
                    : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                {t('po_paid_in_full', 'Paid in Full')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentTerms('CREDIT')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentTerms === 'CREDIT'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 font-black'
                    : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                {t('po_on_credit', 'On Credit (AP)')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentTerms('PARTIAL')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  paymentTerms === 'PARTIAL'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 font-black'
                    : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                {t('po_partial', 'Partial Deposit')}
              </button>
            </div>

            {paymentTerms === 'PARTIAL' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">{t('po_amount_paid', 'Amount Paid (ETB)')}</label>
                  <input
                    type="number"
                    step="any"
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">{t('po_due_date', 'Due Date / Terms')}</label>
                  <input
                    type="text"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    placeholder="e.g. In 15 days"
                    className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-900"
                  />
                </div>
              </div>
            )}

            {paymentTerms === 'CREDIT' && (
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">{t('po_due_date', 'Payment Due Date')}</label>
                <input
                  type="text"
                  value={creditDueDate}
                  onChange={(e) => setCreditDueDate(e.target.value)}
                  placeholder="e.g. End of Month / Net 30"
                  className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-bold text-stone-900"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-bold text-stone-600 hover:text-stone-900 transition cursor-pointer"
            >
              {t('common_cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? t('po_committing', 'Committing...') : t('po_commit', 'Commit Purchase')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
