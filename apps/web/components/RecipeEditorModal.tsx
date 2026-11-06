'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Check, ChefHat } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: any;
  onRecipeSaved: () => void;
}

export function RecipeEditorModal({
  isOpen,
  onClose,
  menuItem,
  onRecipeSaved,
}: RecipeEditorModalProps) {
  const { currentUser } = useAppStore();
  const isOwner = currentUser?.role === 'OWNER';

  const [ingredientsPool, setIngredientsPool] = useState<any[]>([]);
  const [recipeLines, setRecipeLines] = useState<
    { ingredientId: string; quantity: number; unitId: string; name: string; unitCost: number; symbol: string }[]
  >([]);
  const [yieldPortions, setYieldPortions] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !menuItem) return;

    fetchApi('/inventory/ingredients')
      .then((data) => {
        if (Array.isArray(data)) {
          setIngredientsPool(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load ingredients pool:', err);
      });

    if (menuItem.recipe && Array.isArray(menuItem.recipe.ingredients)) {
      setYieldPortions(Number(menuItem.recipe.yieldPortions || 1));
      setRecipeLines(
        menuItem.recipe.ingredients.map((ri: any) => ({
          ingredientId: ri.ingredientId,
          quantity: Number(ri.quantity || 0),
          unitId: ri.unitId || ri.ingredient?.baseUnitId || '',
          name: ri.ingredient?.name || 'Ingredient',
          unitCost: Number(ri.ingredient?.currentCostPerBaseUnit || 0),
          symbol: ri.unit?.symbol || ri.ingredient?.baseUnit?.symbol || 'g',
        })),
      );
    } else {
      setYieldPortions(1);
      setRecipeLines([]);
    }
    setError(null);
  }, [isOpen, menuItem]);

  if (!isOpen || !menuItem) return null;

  const handleAddIngredient = (ingredientId: string) => {
    const ing = ingredientsPool.find((i) => i.id === ingredientId);
    if (!ing) return;
    setError(null);

    setRecipeLines((prev) => [
      ...prev,
      {
        ingredientId: ing.id,
        quantity: ing.baseUnit?.symbol === 'g' ? 100 : 1,
        unitId: ing.baseUnitId,
        name: ing.name,
        unitCost: Number(ing.currentCostPerBaseUnit || 0),
        symbol: ing.baseUnit?.symbol || 'g',
      },
    ]);
  };

  const handleUpdateQty = (ingredientId: string, quantity: number) => {
    setRecipeLines((prev) =>
      prev.map((l) => (l.ingredientId === ingredientId ? { ...l, quantity } : l)),
    );
  };

  const handleRemoveLine = (ingredientId: string) => {
    setRecipeLines((prev) => prev.filter((l) => l.ingredientId !== ingredientId));
  };

  const totalCost = recipeLines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
  const portionCost = totalCost / (yieldPortions || 1);
  const sellingPrice = Number(menuItem.price || 0);
  const marginPercent =
    sellingPrice > 0 ? ((sellingPrice - portionCost) / sellingPrice) * 100 : 0;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await fetchApi(`/menu/items/${menuItem.id}/recipe`, {
        method: 'POST',
        body: JSON.stringify({
          yieldPortions,
          ingredients: recipeLines.map((l) => ({
            ingredientId: l.ingredientId,
            quantity: l.quantity,
            unitId: l.unitId,
          })),
        }),
      });

      onRecipeSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error saving recipe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161311] text-white rounded-[32px] max-w-2xl w-full p-6 shadow-2xl border border-white/15 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#C11221] p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#161311] flex items-center justify-center text-amber-400">
                <ChefHat className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Recipe Studio: {menuItem.name}</h3>
              <p className="text-xs text-zinc-400">
                Define exact ingredient grams/ml to automate kitchen deduction & calculate net profit.
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
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Cost & Margin Simulator Bar - Only Owner sees Selling Price and Profit Margin */}
        {isOwner ? (
          <div className="grid grid-cols-3 gap-3 bg-white/[0.04] border border-white/10 p-4 rounded-2xl text-xs backdrop-blur-xl">
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Calculated Food Cost</div>
              <div className="text-sm font-black text-rose-400 mt-0.5">{portionCost.toFixed(4)} ETB</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Selling Price</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">{sellingPrice.toFixed(2)} ETB</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Target Margin %</div>
              <div className={`text-sm font-black mt-0.5 ${marginPercent >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {marginPercent.toFixed(1)}%
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 bg-white/[0.04] border border-white/10 p-4 rounded-2xl text-xs backdrop-blur-xl">
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Calculated Ingredient Cost</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">{portionCost.toFixed(4)} ETB</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Yield Portions</div>
              <div className="text-sm font-black text-white mt-0.5">{yieldPortions} Portion(s)</div>
            </div>
          </div>
        )}

        {/* Add Ingredient Dropdown */}
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddIngredient(e.target.value);
                e.target.value = '';
              }
            }}
            className="flex-1 bg-[#161311] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="">+ Add an ingredient from inventory...</option>
            {ingredientsPool
              .filter((i) => !recipeLines.some((r) => r.ingredientId === i.id))
              .map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({Number(ing.currentCostPerBaseUnit).toFixed(4)} ETB / {ing.baseUnit?.symbol || 'g'})
                </option>
              ))}
          </select>
        </div>

        {/* Recipe Ingredient Requirements (Card Format) */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
          {recipeLines.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl">
              No ingredients in this recipe yet. Select from the dropdown above.
            </div>
          ) : (
            recipeLines.map((line) => (
              <div
                key={line.ingredientId}
                className="p-3 bg-white/[0.03] border border-white/10 hover:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-white truncate">{line.name}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Unit Cost: <span className="text-zinc-300 font-semibold">{line.unitCost.toFixed(4)} ETB / {line.symbol}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 rounded-xl px-2.5 py-1">
                    <span className="text-[10px] font-bold text-zinc-400">Qty:</span>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={line.quantity}
                      onChange={(e) =>
                        handleUpdateQty(line.ingredientId, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 bg-transparent text-xs font-bold text-white focus:outline-none text-right"
                    />
                    <span className="text-zinc-400 font-bold text-xs">{line.symbol}</span>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Portion Cost</div>
                    <div className="text-xs font-black text-amber-400">
                      {(line.quantity * line.unitCost).toFixed(4)} ETB
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveLine(line.ingredientId)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    title="Remove ingredient"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={saving || recipeLines.length === 0}
            onClick={handleSave}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg shadow-amber-500/25 transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{saving ? 'Saving Recipe...' : 'Save & Update Production Cost'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
