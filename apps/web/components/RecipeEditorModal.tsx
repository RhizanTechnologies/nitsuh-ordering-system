'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Check, ChefHat, Search, Sliders, Layers, ArrowRight } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: any;
  allMenuItems?: any[];
  onRecipeSaved: () => void;
  onOpenCreateStockItem?: () => void;
}

export function RecipeEditorModal({
  isOpen,
  onClose,
  menuItem,
  allMenuItems = [],
  onRecipeSaved,
  onOpenCreateStockItem,
}: RecipeEditorModalProps) {
  const { currentUser } = useAppStore();
  const isOwner = currentUser?.role === 'OWNER';

  const [activeItem, setActiveItem] = useState<any>(menuItem);
  const [ingredientsPool, setIngredientsPool] = useState<any[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [recipeLines, setRecipeLines] = useState<
    { ingredientId: string; quantity: number; unitId: string; name: string; unitCost: number; symbol: string }[]
  >([]);
  const [yieldPortions, setYieldPortions] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync activeItem when menuItem prop changes
  useEffect(() => {
    if (menuItem) {
      setActiveItem(menuItem);
    }
  }, [menuItem]);

  // Load ingredients pool and active item's recipe lines
  useEffect(() => {
    if (!isOpen || !activeItem) return;

    fetchApi('/inventory/ingredients')
      .then((data) => {
        if (Array.isArray(data)) {
          setIngredientsPool(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load ingredients pool:', err);
      });

    if (activeItem.recipe && Array.isArray(activeItem.recipe.ingredients) && activeItem.recipe.ingredients.length > 0) {
      setYieldPortions(Number(activeItem.recipe.yieldPortions || 1));
      setRecipeLines(
        activeItem.recipe.ingredients.map((ri: any) => ({
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
    setSelectedIngredientId('');
    setIngredientSearch('');
  }, [isOpen, activeItem]);

  if (!isOpen || !activeItem) return null;

  // Add an ingredient line to the recipe
  const handleAddIngredient = (ingredientId: string) => {
    if (!ingredientId) return;
    const ing = ingredientsPool.find((i) => i.id === ingredientId);
    if (!ing) return;
    setError(null);

    // If already in recipe, do not duplicate
    if (recipeLines.some((l) => l.ingredientId === ing.id)) {
      return;
    }

    const defaultQty = ing.baseUnit?.symbol === 'g' ? 100 : ing.baseUnit?.symbol === 'ml' ? 100 : 1;

    setRecipeLines((prev) => [
      ...prev,
      {
        ingredientId: ing.id,
        quantity: defaultQty,
        unitId: ing.baseUnitId || ing.baseUnit?.id || '',
        name: ing.name,
        unitCost: Number(ing.currentCostPerBaseUnit || 0),
        symbol: ing.baseUnit?.symbol || 'g',
      },
    ]);
    setSelectedIngredientId('');
  };

  const handleUpdateQty = (ingredientId: string, quantity: number) => {
    setRecipeLines((prev) =>
      prev.map((l) => (l.ingredientId === ingredientId ? { ...l, quantity: Math.max(0, quantity) } : l)),
    );
  };

  const handleIncrementQty = (ingredientId: string, delta: number) => {
    setRecipeLines((prev) =>
      prev.map((l) => (l.ingredientId === ingredientId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l)),
    );
  };

  const handleRemoveLine = (ingredientId: string) => {
    setRecipeLines((prev) => prev.filter((l) => l.ingredientId !== ingredientId));
  };

  // Switch target dish within the modal
  const handleSwitchDish = (dishId: string) => {
    const found = allMenuItems.find((m) => m.id === dishId);
    if (found) {
      setActiveItem(found);
    }
  };

  // Calculations
  const totalCost = recipeLines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unitCost || 0), 0);
  const portionCost = totalCost / (yieldPortions || 1);
  const sellingPrice = Number(activeItem.price || 0);
  const marginPercent = sellingPrice > 0 ? ((sellingPrice - portionCost) / sellingPrice) * 100 : 0;
  const grossProfit = Math.max(0, sellingPrice - portionCost);

  // Save recipe
  const handleSave = async () => {
    if (recipeLines.length === 0) {
      setError('Please add at least one ingredient to this recipe.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetchApi(`/menu/items/${activeItem.id}/recipe`, {
        method: 'POST',
        body: JSON.stringify({
          yieldPortions: Number(yieldPortions) || 1,
          ingredients: recipeLines.map((l) => ({
            ingredientId: l.ingredientId,
            quantity: Number(l.quantity) || 0,
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

  // Filter pool for dropdown
  const availableIngredients = ingredientsPool
    .filter((i) => !recipeLines.some((r) => r.ingredientId === i.id))
    .filter((i) =>
      !ingredientSearch.trim() ||
      i.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
      i.category?.toLowerCase().includes(ingredientSearch.toLowerCase()),
    );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#161311] text-white rounded-[32px] max-w-2xl sm:max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-white/15 space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Dish Switcher */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#C11221] p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#161311] flex items-center justify-center text-amber-400">
                <ChefHat className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">Recipe Studio:</h3>
                {allMenuItems.length > 1 ? (
                  <select
                    value={activeItem.id}
                    onChange={(e) => handleSwitchDish(e.target.value)}
                    className="bg-black/50 border border-amber-500/40 rounded-xl px-2.5 py-1 text-xs font-black text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {allMenuItems.map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#161311] text-white">
                        {item.name} ({Number(item.price).toFixed(2)} ETB) {item.recipe?.ingredients?.length ? '✓' : '(No Recipe)'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-base font-black text-amber-400 truncate">{activeItem.name}</span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Define exact ingredient grams/ml to automate kitchen inventory deductions & calculate net food margins.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.08] hover:bg-white/[0.15] rounded-xl transition text-zinc-400 hover:text-white cursor-pointer flex-shrink-0 ml-2"
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

        {/* Live Cost & Margin Simulator Bar - Only Owner sees Selling Price and Profit Margin */}
        {isOwner ? (
          <div className="grid grid-cols-3 gap-3 bg-white/[0.04] border border-white/10 p-3.5 rounded-2xl text-xs backdrop-blur-xl flex-shrink-0">
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Portion Food Cost</div>
              <div className="text-sm font-black text-rose-400 mt-0.5">{portionCost.toFixed(4)} ETB</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Selling Price</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">{sellingPrice.toFixed(2)} ETB</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Gross Margin %</div>
              <div className={`text-sm font-black mt-0.5 ${marginPercent >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {marginPercent.toFixed(1)}% <span className="text-[10px] text-zinc-400 font-normal">({grossProfit.toFixed(2)} ETB)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 bg-white/[0.04] border border-white/10 p-3.5 rounded-2xl text-xs backdrop-blur-xl flex-shrink-0">
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Calculated Ingredient Cost</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">{portionCost.toFixed(4)} ETB</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Standard Yield</div>
              <div className="text-sm font-black text-white mt-0.5">{yieldPortions} Portion(s)</div>
            </div>
          </div>
        )}

        {/* Batch Yield Control & Ingredient Adder Controls (Fully Responsive) */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Yield Portions Stepper */}
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Yield:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setYieldPortions((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={yieldPortions}
                  onChange={(e) => setYieldPortions(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 bg-transparent text-center font-black text-xs text-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setYieldPortions((prev) => prev + 1)}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">portion(s)</span>
            </div>

            {/* Quick Link to New Stock Item if needed */}
            {onOpenCreateStockItem && (
              <button
                type="button"
                onClick={onOpenCreateStockItem}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 ml-auto"
                title="Create a new stock item in inventory"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Ingredient</span>
              </button>
            )}
          </div>

          {/* Full-width Responsive Ingredient Selector */}
          <div className="w-full min-w-0">
            <select
              value={selectedIngredientId}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  handleAddIngredient(val);
                }
              }}
              className="w-full min-w-0 max-w-full bg-[#1e1a17] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer truncate"
            >
              <option value="">+ Add an ingredient from inventory...</option>
              {availableIngredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.category || 'General'}) • {Number(ing.currentCostPerBaseUnit).toFixed(4)} ETB / {ing.baseUnit?.symbol || 'g'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recipe Ingredient Requirements List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar min-h-0">
          {recipeLines.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
              <ChefHat className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
              <div className="font-bold text-white text-sm mb-1">No ingredients in this recipe yet</div>
              <p className="max-w-sm mx-auto text-zinc-500">
                Select ingredients from the dropdown above to define how many grams/ml are used per portion of {activeItem.name}.
              </p>
            </div>
          ) : (
            recipeLines.map((line) => {
              const lineCost = line.quantity * line.unitCost;
              const isGramOrMl = line.symbol === 'g' || line.symbol === 'ml';

              return (
                <div
                  key={line.ingredientId}
                  className="p-3.5 bg-white/[0.03] border border-white/10 hover:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm text-white truncate">{line.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Cost: <span className="text-zinc-300 font-semibold">{line.unitCost.toFixed(4)} ETB / {line.symbol}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Quick increment helpers for grams */}
                    {isGramOrMl && (
                      <div className="hidden sm:flex items-center gap-1">
                        {[10, 50, 100].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => handleIncrementQty(line.ingredientId, delta)}
                            className="px-1.5 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-bold text-zinc-300 cursor-pointer"
                          >
                            +{delta}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quantity Input */}
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
                      <span className="text-[10px] font-bold text-zinc-400">Qty:</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={line.quantity}
                        onChange={(e) =>
                          handleUpdateQty(line.ingredientId, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 bg-transparent text-xs font-black text-amber-400 focus:outline-none text-right"
                      />
                      <span className="text-zinc-400 font-bold text-xs">{line.symbol}</span>
                    </div>

                    {/* Line Cost */}
                    <div className="text-right min-w-[75px]">
                      <div className="text-[9px] text-zinc-400 font-bold uppercase">Portion Cost</div>
                      <div className="text-xs font-black text-emerald-400">
                        {lineCost.toFixed(4)} ETB
                      </div>
                    </div>

                    {/* Remove Line */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.ingredientId)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                      title="Remove ingredient from recipe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10 flex-shrink-0">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            Total Recipe Cost: <strong className="text-white font-bold">{portionCost.toFixed(4)} ETB</strong> / portion
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || recipeLines.length === 0}
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{saving ? 'Saving...' : 'Save Recipe & Recalculate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
