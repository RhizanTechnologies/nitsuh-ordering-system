'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Check, ChefHat, Search, Sliders, Layers, ArrowRight } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

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
  const { t, lang } = useTranslation();
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white text-stone-900 rounded-3xl max-w-2xl sm:max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-stone-200/90 space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Dish Switcher */}
        <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 flex-shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-stone-900 whitespace-nowrap">{t('recipe_studio_title', 'Recipe Studio')}</h3>
                {allMenuItems.length > 1 ? (
                  <select
                    value={activeItem.id}
                    onChange={(e) => handleSwitchDish(e.target.value)}
                    className="w-full sm:w-auto sm:max-w-[320px] min-w-0 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-black text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer truncate"
                  >
                    {allMenuItems.map((item) => (
                      <option key={item.id} value={item.id} className="bg-white text-stone-900">
                        {item.name} ({Number(item.price).toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'}) {item.recipe?.ingredients?.length ? '✓' : t('recipe_no_recipe', '(No Recipe)')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm sm:text-base font-black text-emerald-700 truncate">{activeItem.name}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition text-stone-500 hover:text-stone-900 cursor-pointer flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between flex-shrink-0">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded-lg text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Cost & Margin Simulator Bar - Only Owner sees Selling Price and Profit Margin */}
        {isOwner ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 border border-stone-200 p-3.5 sm:p-4 rounded-2xl text-xs flex-shrink-0">
            <div>
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{t('recipe_portion_cost', 'Portion Cost')}</div>
              <div className="text-sm font-black text-rose-600 mt-0.5">{portionCost.toFixed(4)} {lang === 'am' ? 'ብር' : 'ETB'}</div>
            </div>
            <div>
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{t('recipe_selling_price', 'Selling Price')}</div>
              <div className="text-sm font-black text-stone-900 mt-0.5">{sellingPrice.toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'}</div>
            </div>
            <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/80">
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{t('recipe_gross_margin', 'Gross Margin')}</div>
              <div className={`text-sm font-black mt-0.5 ${marginPercent >= 60 ? 'text-emerald-700' : 'text-stone-700'}`}>
                {marginPercent.toFixed(1)}% <span className="text-[10px] text-stone-500 font-normal">({grossProfit.toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'})</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 bg-stone-50 border border-stone-200 p-3.5 sm:p-4 rounded-2xl text-xs flex-shrink-0">
            <div>
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{t('recipe_ingredient_cost', 'Ingredient Cost')}</div>
              <div className="text-sm font-black text-stone-900 mt-0.5">{portionCost.toFixed(4)} {lang === 'am' ? 'ብር' : 'ETB'}</div>
            </div>
            <div>
              <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{t('recipe_standard_yield', 'Standard Yield')}</div>
              <div className="text-sm font-black text-stone-900 mt-0.5">{yieldPortions} {t('recipe_portions_unit', 'Portion(s)')}</div>
            </div>
          </div>
        )}

        {/* Batch Yield Control & Ingredient Adder Controls (Fully Responsive) */}
        <div className="space-y-2.5 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Yield Portions Stepper */}
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">{t('recipe_yield_label', 'Yield:')}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setYieldPortions((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={yieldPortions}
                  onChange={(e) => setYieldPortions(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 bg-transparent text-center font-black text-xs text-stone-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setYieldPortions((prev) => prev + 1)}
                  className="w-6 h-6 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap">{t('recipe_portions_unit', 'portion(s)')}</span>
            </div>

            {/* Quick Link to New Stock Item if needed */}
            {onOpenCreateStockItem && (
              <button
                type="button"
                onClick={onOpenCreateStockItem}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                title={t('recipe_new_ingredient', 'Create a new stock item in inventory')}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('recipe_new_ingredient', 'New Ingredient')}</span>
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
              className="w-full min-w-0 max-w-full bg-white border border-stone-300 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer truncate"
            >
              <option value="" className="bg-white text-stone-500">{t('recipe_add_from_inventory', '+ Add an ingredient from inventory...')}</option>
              {availableIngredients.map((ing) => (
                <option key={ing.id} value={ing.id} className="bg-white text-stone-900">
                  {ing.name} ({ing.category || 'General'}) • {Number(ing.currentCostPerBaseUnit).toFixed(4)} {lang === 'am' ? 'ብር' : 'ETB'} / {ing.baseUnit?.symbol || 'g'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recipe Ingredient Requirements List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar min-h-0">
          {recipeLines.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-3xl p-6">
              <ChefHat className="w-8 h-8 text-emerald-600/40 mx-auto mb-2" />
              <div className="font-bold text-stone-900 text-sm">{t('recipe_no_ingredients', 'No ingredients in this recipe yet')}</div>
            </div>
          ) : (
            recipeLines.map((line) => {
              const lineCost = line.quantity * line.unitCost;
              const isGramOrMl = line.symbol === 'g' || line.symbol === 'ml';

              return (
                <div
                  key={line.ingredientId}
                  className="p-3.5 bg-stone-50 border border-stone-200 hover:border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm text-stone-900 truncate">{line.name}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {lang === 'am' ? 'ዋጋ' : 'Cost'}: <span className="text-stone-700 font-semibold">{line.unitCost.toFixed(4)} {lang === 'am' ? 'ብር' : 'ETB'} / {line.symbol}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap w-full sm:w-auto">
                    {/* Quick increment helpers for grams */}
                    {isGramOrMl && (
                      <div className="hidden sm:flex items-center gap-1">
                        {[10, 50, 100].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => handleIncrementQty(line.ingredientId, delta)}
                            className="px-1.5 py-0.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-stone-700 cursor-pointer"
                          >
                            +{delta}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quantity Input */}
                    <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-xl px-2.5 py-1.5">
                      <span className="text-[10px] font-bold text-stone-500">{t('po_qty', 'Qty:')}</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={line.quantity}
                        onChange={(e) =>
                          handleUpdateQty(line.ingredientId, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 bg-transparent text-xs font-black text-stone-900 focus:outline-none text-right"
                      />
                      <span className="text-stone-500 font-bold text-xs">{line.symbol}</span>
                    </div>

                    {/* Line Cost */}
                    <div className="text-right min-w-[75px]">
                      <div className="text-[9px] text-stone-500 font-bold uppercase">{t('recipe_portion_cost', 'Portion Cost')}</div>
                      <div className="text-xs font-black text-emerald-700">
                        {lineCost.toFixed(4)} {lang === 'am' ? 'ብር' : 'ETB'}
                      </div>
                    </div>

                    {/* Remove Line */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.ingredientId)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title={lang === 'am' ? 'ግብአቱን አስወግድ' : 'Remove ingredient from recipe'}
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-stone-200 flex-shrink-0">
          <div className="text-xs text-stone-500 text-center sm:text-left">
            {t('recipe_total_cost', 'Total Recipe Cost:')} <strong className="text-stone-900 font-bold">{portionCost.toFixed(4)} {lang === 'am' ? 'ብር' : 'ETB'}</strong> / {lang === 'am' ? 'ክፍል' : 'portion'}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer transition hover:bg-stone-100"
            >
              {t('common_cancel', 'Cancel')}
            </button>
            <button
              type="button"
              disabled={saving || recipeLines.length === 0}
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{saving ? (lang === 'am' ? 'በማስቀመጥ ላይ...' : 'Saving...') : t('recipe_save', 'Save Recipe')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
