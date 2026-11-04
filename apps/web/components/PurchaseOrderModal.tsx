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
  if (!isOpen) return null;

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [items, setItems] = useState<
    { ingredientId: string; quantity: number; totalCost: number; unitId: string; name: string; symbol: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApi('/inventory/suppliers').then((data) => {
      setSuppliers(data);
      if (data.length > 0) setSelectedSupplierId(data[0].id);
    });

    fetchApi('/inventory/balances').then((locations) => {
      const main = locations.find((l: any) => l.type === 'MAIN_STORE');
      if (main) {
        setIngredients(main.balances.map((b: any) => b.ingredient));
      }
    });
  }, []);

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

    setSubmitting(true);
    try {
      await fetchApi('/inventory/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          invoiceNumber,
          createdById: currentUserId || 'm01-storekeeper',
          notes,
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#161311] border border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-zinc-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Record Supplier Bulk Delivery (Main Store)
              </h3>
              <p className="text-xs text-zinc-400">
                Receives bulk ingredients and recalculates unit cost (ETB/g, ETB/ml) via Weighted Average Cost.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Supplier
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#1C1815] text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Vendor Invoice #
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-9921"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-3 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Add Ingredient Line */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Delivered Stock Items
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
            >
              <option value="" className="bg-[#1C1815] text-zinc-400">+ Select ingredient from database...</option>
              {ingredients
                .filter((i) => !items.some((it) => it.ingredientId === i.id))
                .map((ing) => (
                  <option key={ing.id} value={ing.id} className="bg-[#1C1815] text-white">
                    {ing.name} (Current: {Number(ing.currentCostPerBaseUnit).toFixed(4)} ETB / {ing.baseUnit?.symbol})
                  </option>
                ))}
            </select>
          </div>

          {/* Delivered Stock Items (Card Format) */}
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto no-scrollbar">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl">
                No items added yet. Select an ingredient above to restock.
              </div>
            ) : (
              items.map((i) => {
                const unitCost = i.quantity > 0 ? i.totalCost / i.quantity : 0;
                return (
                  <div
                    key={i.ingredientId}
                    className="p-3 bg-white/[0.03] border border-white/10 hover:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">{i.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        New Cost: <span className="text-amber-400 font-bold">{unitCost.toFixed(4)} ETB / {i.symbol}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-2 py-1">
                        <span className="text-[10px] font-bold text-zinc-400">Qty:</span>
                        <input
                          type="number"
                          step="any"
                          value={i.quantity}
                          onChange={(e) =>
                            handleUpdateItem(i.ingredientId, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-transparent text-xs font-bold text-white focus:outline-none text-right"
                        />
                        <span className="text-[10px] text-zinc-400 font-semibold">{i.symbol}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded-xl px-2 py-1">
                        <span className="text-[10px] font-bold text-zinc-400">Total:</span>
                        <input
                          type="number"
                          step="any"
                          value={i.totalCost}
                          onChange={(e) =>
                            handleUpdateItem(i.ingredientId, 'totalCost', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-transparent text-xs font-bold text-amber-400 focus:outline-none text-right"
                        />
                        <span className="text-[10px] text-zinc-400 font-semibold">ETB</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(i.ingredientId)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
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

          <div className="flex justify-between items-center bg-white/[0.04] border border-white/10 p-3 rounded-2xl text-xs font-bold">
            <span className="text-zinc-400">Total Purchase Value:</span>
            <span className="text-base text-amber-400 font-extrabold">{grandTotal.toFixed(2)} ETB</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
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
