'use client';

import React, { useState, useEffect } from 'react';
import { X, Boxes, Tag, DollarSign, Sliders, Layers, Hash, Check } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface StockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null; // null for Create, item object for Edit
  units: any[];
  onSaved: () => void;
}

const CATEGORIES = [
  'General',
  'Coffee',
  'Dairy',
  'Produce',
  'Bakery',
  'Meat & Poultry',
  'Dry Goods & Grains',
  'Spices & Seasoning',
  'Beverage & Syrups',
  'Packaging & Supplies',
];

export function StockItemModal({ isOpen, onClose, item, units, onSaved }: StockItemModalProps) {
  const isEditing = Boolean(item);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [baseUnitId, setBaseUnitId] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [reorderThresholdMain, setReorderThresholdMain] = useState('1000');
  const [reorderThresholdKitchen, setReorderThresholdKitchen] = useState('200');
  const [initialMainStock, setInitialMainStock] = useState('0');
  const [initialKitchenStock, setInitialKitchenStock] = useState('0');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setSku(item.sku || '');
      if (CATEGORIES.includes(item.category)) {
        setCategory(item.category);
        setCustomCategory('');
      } else {
        setCategory('CUSTOM');
        setCustomCategory(item.category || '');
      }
      setBaseUnitId(item.baseUnitId || item.baseUnit?.id || (units[0]?.id ?? ''));
      setCostPerUnit(String(item.currentCostPerBaseUnit ?? '0'));
      setReorderThresholdMain(String(item.reorderThresholdMain ?? '1000'));
      setReorderThresholdKitchen(String(item.reorderThresholdKitchen ?? '200'));
    } else {
      setName('');
      setSku('');
      setCategory('General');
      setCustomCategory('');
      setBaseUnitId(units[0]?.id || '');
      setCostPerUnit('1.00');
      setReorderThresholdMain('1000');
      setReorderThresholdKitchen('200');
      setInitialMainStock('0');
      setInitialKitchenStock('0');
    }
    setError(null);
  }, [item, units, isOpen]);

  if (!isOpen) return null;

  const selectedUnit = units.find((u) => u.id === baseUnitId) || units[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a stock item name');
      return;
    }
    const costNum = parseFloat(costPerUnit);
    if (isNaN(costNum) || costNum < 0) {
      setError('Please enter a valid cost per base unit');
      return;
    }
    if (!baseUnitId) {
      setError('Please select a measurement unit');
      return;
    }

    const finalCategory = category === 'CUSTOM' ? (customCategory.trim() || 'General') : category;

    setSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        await fetchApi(`/inventory/ingredients/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: name.trim(),
            sku: sku.trim() || undefined,
            category: finalCategory,
            baseUnitId,
            currentCostPerBaseUnit: costNum,
            reorderThresholdMain: parseFloat(reorderThresholdMain) || 0,
            reorderThresholdKitchen: parseFloat(reorderThresholdKitchen) || 0,
          }),
        });
      } else {
        await fetchApi('/inventory/ingredients', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            sku: sku.trim() || undefined,
            category: finalCategory,
            baseUnitId,
            currentCostPerBaseUnit: costNum,
            reorderThresholdMain: parseFloat(reorderThresholdMain) || 0,
            reorderThresholdKitchen: parseFloat(reorderThresholdKitchen) || 0,
            initialMainStock: parseFloat(initialMainStock) || 0,
            initialKitchenStock: parseFloat(initialKitchenStock) || 0,
          }),
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save stock item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161311] text-white rounded-[28px] max-w-xl w-full p-6 shadow-2xl border border-white/15 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#161311] flex items-center justify-center text-amber-400">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isEditing ? `Edit Stock Item: ${item?.name}` : 'Create New Stock Item / Ingredient'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? 'Update unit pricing, category classification and low-stock cutoffs'
                  : 'Register a raw ingredient, retail item, or consumable in dual inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.08] hover:bg-white/[0.15] rounded-xl transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-center justify-between flex-shrink-0">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar min-h-0">
          {/* Item Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Stock Item Name</span>
                <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Arabica Coffee Beans (Yirgacheffe)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-zinc-400" />
                <span>SKU Code</span>
              </label>
              <input
                type="text"
                placeholder="Auto-generate"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>
          </div>

          {/* Category & Measurement Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-amber-400" />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1e1a17] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="CUSTOM">+ Custom Category...</option>
              </select>
              {category === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="Enter custom category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 bg-white/[0.05] border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Base Measurement Unit</span>
                <span className="text-amber-500">*</span>
              </label>
              <select
                value={baseUnitId}
                onChange={(e) => setBaseUnitId(e.target.value)}
                className="w-full bg-[#1e1a17] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol}) • {u.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Cost Valuation */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-amber-400" />
                <span>Current Valuation Cost per Base Unit (ETB)</span>
                <span className="text-amber-500">*</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold lowercase">
                per {selectedUnit?.symbol || 'unit'}
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pl-4 pr-16 py-2.5 text-xs font-black text-amber-400 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                ETB / {selectedUnit?.symbol || 'unit'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">
              Used to calculate Recipe COGS, dish food cost, and balance asset valuations.
            </p>
          </div>

          {/* Reorder Threshold Alerts */}
          <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Low-Stock Alert Cutoffs</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">
                  Main Warehouse Alert (&le;)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={reorderThresholdMain}
                    onChange={(e) => setReorderThresholdMain(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs font-bold text-zinc-400">{selectedUnit?.symbol}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">
                  Kitchen Store Alert (&le;)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={reorderThresholdKitchen}
                    onChange={(e) => setReorderThresholdKitchen(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs font-bold text-zinc-400">{selectedUnit?.symbol}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Initial Opening Stock (Create mode only) */}
          {!isEditing && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Opening Stock Balances (Optional)</span>
                </div>
                <span className="text-[10px] text-amber-400/80 font-semibold">Initial On-Hand Quantity</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Main Store Opening Qty</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={initialMainStock}
                      onChange={(e) => setInitialMainStock(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs font-bold text-zinc-400">{selectedUnit?.symbol}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Kitchen Store Opening Qty</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={initialKitchenStock}
                      onChange={(e) => setInitialKitchenStock(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs font-bold text-zinc-400">{selectedUnit?.symbol}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Saving...' : isEditing ? 'Update Stock Item' : 'Create Stock Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
