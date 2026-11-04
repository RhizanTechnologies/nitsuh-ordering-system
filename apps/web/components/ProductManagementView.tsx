'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '@/lib/api';
import { RecipeEditorModal } from '@/components/RecipeEditorModal';
import { MenuImage } from '@/components/MenuImage';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChefHat,
  Check,
  X,
  AlertCircle,
  Filter,
  DollarSign,
  Utensils,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';

export function ProductManagementView() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');

  // Modals
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<any | null>(null);

  // Edit / Add Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCatId, setFormCatId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrepSection, setFormPrepSection] = useState('HOT_KITCHEN');
  const [formIsDirect, setFormIsDirect] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchApi('/menu/items'), fetchApi('/menu/categories')])
      .then(([itemsData, catsData]) => {
        setItems(itemsData);
        setCategories(catsData);
      })
      .catch((err) => console.error('Failed to load menu data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category?.name?.toLowerCase().includes(q);

      const matchCat = !selectedCatId || item.categoryId === selectedCatId;
      return matchSearch && matchCat;
    });
  }, [items, search, selectedCatId]);

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName('');
    setFormCatId(categories[0]?.id || '');
    setFormPrice('');
    setFormDesc('');
    setFormPrepSection('HOT_KITCHEN');
    setFormIsDirect(false);
    setFormImageUrl('');
    setProductModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormName(item.name);
    setFormCatId(item.categoryId);
    setFormPrice(String(item.price));
    setFormDesc(item.description || '');
    setFormPrepSection(item.prepSection || 'HOT_KITCHEN');
    setFormIsDirect(Boolean(item.isDirectSale));
    setFormImageUrl(item.imageUrl || '');
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;
    setSavingProduct(true);

    try {
      const payload = {
        name: formName.trim(),
        categoryId: formCatId,
        price: parseFloat(formPrice),
        description: formDesc.trim() || null,
        prepSection: formPrepSection,
        isDirectSale: formIsDirect,
        imageUrl: formImageUrl.trim() || null,
      };

      if (isEditing && editingId) {
        await fetchApi(`/menu/items/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setActionMessage(`Product "${formName}" updated successfully!`);
      } else {
        await fetchApi('/menu/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setActionMessage(`New product "${formName}" added to menu!`);
      }

      setProductModalOpen(false);
      loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Error saving product: ${err.message}`);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (item: any) => {
    if (!confirm(`Are you sure you want to remove "${item.name}" from the menu?`)) return;
    try {
      await fetchApi(`/menu/items/${item.id}`, { method: 'DELETE' });
      setActionMessage(`Product "${item.name}" removed.`);
      loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Action & Control Bar */}
      <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              <span>Menu Products & Recipe Studio</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage selling prices, prep stations, and configure exact ingredient amounts (grams/ml) for accurate automated food cost deductions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-2xl text-zinc-300 transition cursor-pointer"
              title="Refresh product list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {actionMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-bold flex items-center justify-between animate-in fade-in backdrop-blur-xl">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filters & Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name, ingredients, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none transition shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="p-1 text-zinc-400 hover:text-white rounded-full transition absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCatId('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border cursor-pointer ${
                selectedCatId === ''
                  ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                  : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              All Categories ({items.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border flex items-center gap-1.5 cursor-pointer ${
                  selectedCatId === c.id
                    ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                    : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{c.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCatId === c.id ? 'bg-black text-amber-300 font-bold' : 'bg-white/10 text-zinc-400'
                }`}>
                  {c._count?.menuItems || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Cards Grid (Modern Responsive Card Format) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-zinc-500 bg-white/[0.03] border border-white/10 rounded-3xl">
            No products found matching your search.
          </div>
        ) : (
          filteredItems.map((item) => {
            const ingredientsCount = item.recipe?.ingredients?.length || 0;
            const hasRecipe = ingredientsCount > 0;
            const cost = Number(item.costPerPortion || 0);
            const price = Number(item.price || 0);
            const margin = Number(item.marginPercent || 0);

            return (
              <div
                key={item.id}
                className="bg-white/[0.04] border border-white/10 hover:border-amber-500/30 rounded-3xl p-4 shadow-xl backdrop-blur-xl flex flex-col justify-between transition"
              >
                <div>
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 mb-3 border border-white/10">
                    <MenuImage
                      src={item.imageUrl}
                      alt={item.name}
                      categoryName={item.category?.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#161311]/85 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-white">
                      {item.category?.name}
                    </span>
                    {item.isDirectSale && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-lg bg-blue-600 text-white shadow">
                        Retail
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-extrabold text-sm text-white truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <span className="text-sm font-black text-amber-400 whitespace-nowrap">
                      {price.toFixed(2)} ETB
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mb-2.5" title={item.description}>
                      {item.description}
                    </p>
                  )}

                  {/* Financial & Recipe Badges */}
                  <div className="grid grid-cols-2 gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 mb-3 text-xs">
                    <div>
                      <div className="text-[9px] text-zinc-400 font-bold uppercase">Food Cost</div>
                      <div className="text-xs font-bold text-rose-400 mt-0.5">
                        {cost > 0 ? `${cost.toFixed(2)} ETB` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-400 font-bold uppercase">Gross Margin</div>
                      <div className={`text-xs font-black mt-0.5 ${margin >= 60 ? 'text-emerald-400' : margin >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {margin > 0 ? `${margin.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Recipe Status */}
                  <div className="mb-3">
                    {hasRecipe ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{ingredientsCount} recipe ingredients defined</span>
                      </span>
                    ) : item.isDirectSale ? (
                      <span className="text-[10px] text-zinc-500 font-semibold">Direct Stock Unit</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span>No recipe ingredients set</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setSelectedRecipeItem(item);
                      setRecipeModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Configure ingredients and recipe amounts"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Ingredients</span>
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 rounded-xl transition cursor-pointer border border-white/10"
                    title="Edit product details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(item)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    title="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RECIPE STUDIO MODAL */}
      {selectedRecipeItem && (
        <RecipeEditorModal
          isOpen={recipeModalOpen}
          onClose={() => setRecipeModalOpen(false)}
          menuItem={selectedRecipeItem}
          onRecipeSaved={() => {
            loadData();
          }}
        />
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#161311] text-white rounded-[32px] max-w-lg w-full p-6 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white">
                {isEditing ? `Edit Product: ${formName}` : 'Add New Menu Product'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-2 bg-white/[0.08] hover:bg-white/[0.15] rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Product Name (English / Amharic)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Club Sandwich / ስፔሻል ክለብ ሳንድዊች"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Category</label>
                  <select
                    value={formCatId}
                    onChange={(e) => setFormCatId(e.target.value)}
                    className="w-full bg-[#161311] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#161311] text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Selling Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 750"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs font-black text-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Preparation Station</label>
                  <select
                    value={formPrepSection}
                    onChange={(e) => setFormPrepSection(e.target.value)}
                    className="w-full bg-[#161311] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="HOT_KITCHEN">Hot Kitchen (Burgers, Pastas, Eggs)</option>
                    <option value="COLD_KITCHEN">Cold Kitchen (Salads, Wraps)</option>
                    <option value="BAR_COFFEE">Bar & Coffee (Juices, Hot/Cold Drinks)</option>
                    <option value="BAKERY">Bakery (Desserts, Tortas per Kg)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 bg-white/[0.04] rounded-xl border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsDirect}
                      onChange={(e) => setFormIsDirect(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500 bg-black/40 border-white/20"
                    />
                    <span className="font-bold text-zinc-300 text-xs">Direct Retail (Soda/Water)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Ingredients / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Double Beef, Double Cheese, Egg, House Mayo, tomato, onion, lettuce & Fries"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-xl p-3 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Product Photo URL (Unsplash or Image Link)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {savingProduct ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
