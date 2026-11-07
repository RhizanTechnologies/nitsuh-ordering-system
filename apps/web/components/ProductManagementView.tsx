'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Layers,
  UploadCloud,
  Image as ImageIcon,
  FileImage,
  ChevronLeft,
  ChevronRight,
  Square,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';

export function ProductManagementView() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');

  // View Mode: 'single' (1 product per page) | 'list' (1 product per row) | 'grid'
  const [viewMode, setViewMode] = useState<'single' | 'list' | 'grid'>('single');
  const [singleIndex, setSingleIndex] = useState(0);

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSizeInfo, setImageSizeInfo] = useState<string | null>(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Tab: 'products' | 'addons'
  const [activeTab, setActiveTab] = useState<'products' | 'addons'>('products');

  // Real Add-ons Management
  const [addons, setAddons] = useState<any[]>([]);
  const [ingredientsPool, setIngredientsPool] = useState<any[]>([]);
  const [addonSearch, setAddonSearch] = useState('');
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [isEditingAddon, setIsEditingAddon] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [formAddonName, setFormAddonName] = useState('');
  const [formAddonPrice, setFormAddonPrice] = useState('');
  const [formAddonIngredientId, setFormAddonIngredientId] = useState('');
  const [formAddonQty, setFormAddonQty] = useState('');
  const [formAddonTargetType, setFormAddonTargetType] = useState<'GLOBAL' | 'CATEGORY' | 'ITEM'>('GLOBAL');
  const [formAddonCategoryId, setFormAddonCategoryId] = useState('');
  const [formAddonItemId, setFormAddonItemId] = useState('');
  const [savingAddon, setSavingAddon] = useState(false);

  const processAndSetImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    setUploadingImage(true);
    const originalSizeKb = Math.round(file.size / 1024);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const optimizedSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
          setFormImageUrl(dataUrl);
          setImageSizeInfo(`Optimized: ${optimizedSizeKb} KB (from ${originalSizeKb} KB)`);
        }
        setUploadingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndSetImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndSetImage(file);
    }
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi('/menu/items'),
      fetchApi('/menu/categories'),
      fetchApi('/menu/addons'),
      fetchApi('/inventory/ingredients'),
    ])
      .then(([itemsData, catsData, addonsData, ingredientsData]) => {
        setItems(itemsData || []);
        setCategories(catsData || []);
        setAddons(addonsData || []);
        setIngredientsPool(ingredientsData || []);
      })
      .catch((err) => console.error('Failed to load menu data:', err))
      .finally(() => setLoading(false));
  };

  const openAddAddonModal = () => {
    setIsEditingAddon(false);
    setEditingAddonId(null);
    setFormAddonName('');
    setFormAddonPrice('');
    setFormAddonIngredientId(ingredientsPool[0]?.id || '');
    setFormAddonQty('30');
    setFormAddonTargetType('GLOBAL');
    setFormAddonCategoryId(categories[0]?.id || '');
    setFormAddonItemId(items[0]?.id || '');
    setAddonModalOpen(true);
  };

  const openEditAddonModal = (addon: any) => {
    setIsEditingAddon(true);
    setEditingAddonId(addon.id);
    setFormAddonName(addon.name);
    setFormAddonPrice(String(addon.price));
    setFormAddonIngredientId(addon.ingredientId || '');
    setFormAddonQty(String(addon.quantity || '0'));
    if (addon.menuItemId) {
      setFormAddonTargetType('ITEM');
      setFormAddonItemId(addon.menuItemId);
    } else if (addon.categoryId) {
      setFormAddonTargetType('CATEGORY');
      setFormAddonCategoryId(addon.categoryId);
    } else {
      setFormAddonTargetType('GLOBAL');
    }
    setAddonModalOpen(true);
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAddonName.trim() || !formAddonPrice) return;
    setSavingAddon(true);

    try {
      const payload = {
        name: formAddonName.trim(),
        price: parseFloat(formAddonPrice),
        ingredientId: formAddonIngredientId || null,
        quantity: parseFloat(formAddonQty) || 0,
        categoryId: formAddonTargetType === 'CATEGORY' ? formAddonCategoryId : null,
        menuItemId: formAddonTargetType === 'ITEM' ? formAddonItemId : null,
      };

      if (isEditingAddon && editingAddonId) {
        await fetchApi(`/menu/addons/${editingAddonId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setActionMessage(`Add-on "${formAddonName}" updated successfully!`);
      } else {
        await fetchApi('/menu/addons', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setActionMessage(`New Add-on "${formAddonName}" created!`);
      }

      setAddonModalOpen(false);
      loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Error saving add-on: ${err.message}`);
    } finally {
      setSavingAddon(false);
    }
  };

  const handleDeleteAddon = async (addon: any) => {
    if (!confirm(`Are you sure you want to delete add-on "${addon.name}"?`)) return;
    try {
      await fetchApi(`/menu/addons/${addon.id}`, { method: 'DELETE' });
      setActionMessage(`Add-on "${addon.name}" removed.`);
      loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to delete add-on: ${err.message}`);
    }
  };

  const handleToggleAddonActive = async (addon: any) => {
    try {
      await fetchApi(`/menu/addons/${addon.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !addon.isActive }),
      });
      loadData();
    } catch (err: any) {
      alert(`Failed to update add-on status: ${err.message}`);
    }
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

  const safeSingleIndex =
    filteredItems.length > 0
      ? Math.min(Math.max(0, singleIndex), filteredItems.length - 1)
      : 0;
  const currentSingleItem = filteredItems[safeSingleIndex];

  // Keyboard navigation for 1 Product Per Page view
  useEffect(() => {
    if (activeTab !== 'products' || viewMode !== 'single') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) ||
        recipeModalOpen ||
        productModalOpen ||
        addonModalOpen
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSingleIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSingleIndex((prev) => Math.min(filteredItems.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, viewMode, filteredItems.length, recipeModalOpen, productModalOpen, addonModalOpen]);

  const filteredAddons = useMemo(() => {
    const q = addonSearch.trim().toLowerCase();
    return addons.filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.ingredient?.name?.toLowerCase().includes(q) ||
        a.category?.name?.toLowerCase().includes(q) ||
        a.menuItem?.name?.toLowerCase().includes(q)
      );
    });
  }, [addons, addonSearch]);

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
    setImageSizeInfo(null);
    setShowUrlFallback(false);
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
    setImageSizeInfo(null);
    setShowUrlFallback(false);
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

  const selectedIngredient = ingredientsPool.find((i) => i.id === formAddonIngredientId);
  const addonQtyNum = parseFloat(formAddonQty) || 0;
  const addonPriceNum = parseFloat(formAddonPrice) || 0;
  const unitCostNum = selectedIngredient ? Number(selectedIngredient.currentCostPerBaseUnit || 0) : 0;
  const addonEstimatedCost = addonQtyNum * unitCostNum;
  const addonGrossProfit = addonPriceNum - addonEstimatedCost;
  const addonMarginPercent = addonPriceNum > 0 ? (addonGrossProfit / addonPriceNum) * 100 : 0;

  return (
    <div className="space-y-6 text-white">
      {/* Top Action & Control Bar */}
      <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              <span>Menu Products</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-2xl text-zinc-300 transition cursor-pointer"
              title="Refresh product list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {activeTab === 'products' ? (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Product</span>
              </button>
            ) : (
              <button
                onClick={openAddAddonModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Modifier</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Products</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'products' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-zinc-400'
            }`}>
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('addons')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'addons'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Add-ons</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'addons' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-zinc-400'
            }`}>
              {addons.length}
            </span>
          </button>
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

        {/* Tab 1: Products Filter & Search Row */}
        {activeTab === 'products' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSingleIndex(0);
                }}
                className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none transition shadow-inner"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSingleIndex(0);
                  }}
                  className="p-1 text-zinc-400 hover:text-white rounded-full transition absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => {
                  setSelectedCatId('');
                  setSingleIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border cursor-pointer ${
                  selectedCatId === ''
                    ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                    : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                All ({items.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCatId(c.id);
                    setSingleIndex(0);
                  }}
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
        )}

        {/* Tab 2: Add-ons Search Row */}
        {activeTab === 'addons' && (
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search add-ons..."
              value={addonSearch}
              onChange={(e) => setAddonSearch(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none transition shadow-inner"
            />
            {addonSearch && (
              <button
                onClick={() => setAddonSearch('')}
                className="p-1 text-zinc-400 hover:text-white rounded-full transition absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1 CONTENT: PRODUCTS STUDIO (1 PER PAGE / 1 PER ROW / GRID) */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* View Mode Switcher & Stats Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1 rounded-xl w-fit">
              <button
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'single'
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="View one product per page with full recipe and margin details"
              >
                <Square className="w-3.5 h-3.5" />
                <span>1 Product Per Page</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="View products in clean 1-per-row list"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>1 Per Row (List)</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="View products in responsive grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>

            <div className="text-xs font-bold text-zinc-400">
              Showing <strong className="text-white font-black">{filteredItems.length}</strong> products
              {selectedCatId && (
                <span> in <strong className="text-amber-400 font-black">{categories.find((c) => c.id === selectedCatId)?.name}</strong></span>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: 1 PRODUCT PER PAGE (CLEAN SHOWCASE) */}
          {viewMode === 'single' && (
            <div>
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center text-xs text-zinc-500 bg-white/[0.03] border border-white/10 rounded-3xl">
                  No products found matching your search.
                </div>
              ) : currentSingleItem ? (
                <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl max-w-lg mx-auto space-y-6">
                  {/* Stepper / Pagination Header */}
                  <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
                    <button
                      onClick={() => setSingleIndex((p) => Math.max(0, p - 1))}
                      disabled={safeSingleIndex === 0}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white border border-white/10 flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <span className="text-xs font-bold text-zinc-400">
                      <span className="text-amber-400 font-black">{safeSingleIndex + 1}</span> of{' '}
                      <span className="text-white font-black">{filteredItems.length}</span>
                    </span>

                    <button
                      onClick={() => setSingleIndex((p) => Math.min(filteredItems.length - 1, p + 1))}
                      disabled={safeSingleIndex >= filteredItems.length - 1}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white border border-white/10 flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Clean Visual & Product Details */}
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
                      <MenuImage
                        src={currentSingleItem.imageUrl}
                        alt={currentSingleItem.name}
                        categoryName={currentSingleItem.category?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 inline-block">
                        {currentSingleItem.category?.name || 'General'}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                        {currentSingleItem.name}
                      </h2>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400">
                        {Number(currentSingleItem.price || 0).toFixed(2)} <span className="text-base font-bold text-amber-500">ETB</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Actions */}
                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => openEditModal(currentSingleItem)}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Edit Product</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(currentSingleItem)}
                      className="py-3 px-4 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl transition border border-rose-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* VIEW MODE 2: 1 PER ROW (CLEAN LIST VIEW) */}
          {viewMode === 'list' && (
            <div className="space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="py-16 text-center text-xs text-zinc-500 bg-white/[0.03] border border-white/10 rounded-3xl">
                  No products found matching your search.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const price = Number(item.price || 0);

                  return (
                    <div
                      key={item.id}
                      className="bg-white/[0.04] border border-white/10 hover:border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-md backdrop-blur-xl flex items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                          <MenuImage
                            src={item.imageUrl}
                            alt={item.name}
                            categoryName={item.category?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                            {item.category?.name || 'General'}
                          </span>
                          <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-sm sm:text-base font-black text-amber-400">
                            {price.toFixed(2)} ETB
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 rounded-xl transition border border-white/10 cursor-pointer"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item)}
                            className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW MODE 3: GRID VIEW (CLEAN RESPONSIVE GRID) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full py-16 text-center text-xs text-zinc-500 bg-white/[0.03] border border-white/10 rounded-3xl">
                  No products found matching your search.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const price = Number(item.price || 0);

                  return (
                    <div
                      key={item.id}
                      className="bg-white/[0.04] border border-white/10 hover:border-amber-500/30 rounded-2xl sm:rounded-3xl p-3.5 shadow-md backdrop-blur-xl flex flex-col justify-between transition"
                    >
                      <div>
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 mb-3 border border-white/10">
                          <MenuImage
                            src={item.imageUrl}
                            alt={item.name}
                            categoryName={item.category?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                          {item.category?.name || 'General'}
                        </span>
                        <h3 className="font-extrabold text-sm sm:text-base text-white truncate" title={item.name}>
                          {item.name}
                        </h3>
                        <div className="text-base font-black text-amber-400 mt-1">
                          {price.toFixed(2)} ETB
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-3 border-t border-white/10 mt-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex-1 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 font-bold text-xs rounded-xl transition border border-white/10 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
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
          )}
        </div>
      )}

      {/* TAB 2 CONTENT: CLEAN ADD-ONS */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAddons.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-zinc-500 bg-white/[0.03] border border-white/10 rounded-3xl p-6">
                <Layers className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                <div className="font-bold text-white text-sm mb-1">No add-ons found</div>
                <button
                  onClick={openAddAddonModal}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs rounded-xl cursor-pointer mt-3"
                >
                  + Add Modifier
                </button>
              </div>
            ) : (
              filteredAddons.map((addon) => {
                const scopeLabel = addon.menuItem
                  ? addon.menuItem.name
                  : addon.category
                  ? addon.category.name
                  : 'All Dishes';

                return (
                  <div
                    key={addon.id}
                    className={`p-4 rounded-2xl border transition shadow-md backdrop-blur-xl flex items-center justify-between gap-3 ${
                      addon.isActive
                        ? 'bg-white/[0.04] border-white/10 hover:border-amber-500/30'
                        : 'bg-white/[0.02] border-white/5 opacity-60'
                    }`}
                  >
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white">{addon.name}</h3>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {scopeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm sm:text-base font-black text-amber-400 whitespace-nowrap">
                        +{Number(addon.price).toFixed(2)} ETB
                      </span>

                      <button
                        onClick={() => handleToggleAddonActive(addon)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                          addon.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {addon.isActive ? 'Active' : 'Paused'}
                      </button>

                      <button
                        onClick={() => openEditAddonModal(addon)}
                        className="p-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 rounded-lg transition border border-white/10 cursor-pointer"
                        title="Edit add-on"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddon(addon)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="Delete add-on"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT ADD-ON MODAL */}
      {addonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#161311] border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{isEditingAddon ? 'Edit Kitchen Add-on' : 'Create Real Kitchen Add-on'}</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Set extra selling price and link to real stock ingredient for automatic Kitchen Store deductions.
                </p>
              </div>
              <button
                onClick={() => setAddonModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-white/[0.05] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-4">
              {/* Add-on Name */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                  Add-on Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Mozzarella Cheese, Extra Beef Patty (100g)"
                  value={formAddonName}
                  onChange={(e) => setFormAddonName(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                  Extra Selling Price (ETB charged to guest) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="e.g. 35.00"
                  value={formAddonPrice}
                  onChange={(e) => setFormAddonPrice(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-black text-amber-400 placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {/* Scope Selector */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                  Applicable Products Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'GLOBAL', label: 'All Dishes' },
                    { id: 'CATEGORY', label: 'Category' },
                    { id: 'ITEM', label: 'Single Item' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormAddonTargetType(s.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        formAddonTargetType === s.id
                          ? 'bg-amber-500 text-black border-amber-400 font-black shadow'
                          : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Dropdown if CATEGORY */}
              {formAddonTargetType === 'CATEGORY' && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                    Select Target Category
                  </label>
                  <select
                    value={formAddonCategoryId}
                    onChange={(e) => setFormAddonCategoryId(e.target.value)}
                    className="w-full bg-[#1e1a17] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Item Dropdown if ITEM */}
              {formAddonTargetType === 'ITEM' && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                    Select Target Product
                  </label>
                  <select
                    value={formAddonItemId}
                    onChange={(e) => setFormAddonItemId(e.target.value)}
                    className="w-full bg-[#1e1a17] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({Number(i.price).toFixed(2)} ETB)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Linked Ingredient Selector */}
              <div className="pt-2 border-t border-white/10">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                  Linked Inventory Ingredient (for stock deduction)
                </label>
                <select
                  value={formAddonIngredientId}
                  onChange={(e) => setFormAddonIngredientId(e.target.value)}
                  className="w-full bg-[#1e1a17] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">No stock deduction (price bump only)</option>
                  {ingredientsPool.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.category}) • Cost: {Number(ing.currentCostPerBaseUnit).toFixed(4)} ETB / {ing.baseUnit?.symbol || 'g'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Portion Deduction Quantity */}
              {formAddonIngredientId && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                    Portion Deduction Quantity ({selectedIngredient?.baseUnit?.symbol || 'g'}) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="e.g. 40"
                      value={formAddonQty}
                      onChange={(e) => setFormAddonQty(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-amber-400 bg-white/10 px-3 py-2 rounded-xl">
                      {selectedIngredient?.baseUnit?.symbol || 'g'}
                    </span>
                  </div>
                </div>
              )}

              {/* Live Financial Calculation Card */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Live Cost & Margin Analysis
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    <div className="text-[9px] text-zinc-400 uppercase font-bold">Selling Price</div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {addonPriceNum.toFixed(2)} ETB
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    <div className="text-[9px] text-zinc-400 uppercase font-bold">Stock Cost</div>
                    <div className="text-xs font-black text-rose-400 mt-0.5">
                      {addonEstimatedCost.toFixed(2)} ETB
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                    <div className="text-[9px] text-zinc-400 uppercase font-bold">Gross Margin</div>
                    <div className={`text-xs font-black mt-0.5 ${addonMarginPercent >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {addonMarginPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {formAddonIngredientId && selectedIngredient && (
                  <p className="text-[10px] text-zinc-400 italic text-center pt-1">
                    Every order with this add-on will deduct exactly {addonQtyNum} {selectedIngredient.baseUnit?.symbol || 'g'} of {selectedIngredient.name} from Kitchen Store.
                  </p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAddonModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddon}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {savingAddon ? 'Saving...' : isEditingAddon ? 'Update Add-on' : 'Create Add-on'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              {/* Product Photo Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-zinc-300 text-xs uppercase tracking-wider">
                    Product Photo (Upload File)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    className="text-[10px] font-semibold text-zinc-500 hover:text-amber-400 transition"
                  >
                    {showUrlFallback ? 'Hide URL link' : 'Or paste web link'}
                  </button>
                </div>

                {formImageUrl ? (
                  /* Image Preview Card */
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 p-3 flex items-center gap-4 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0 relative">
                      <img
                        src={formImageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Photo Uploaded & Ready</span>
                      </div>
                      {imageSizeInfo && (
                        <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">{imageSizeInfo}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormImageUrl('');
                            setImageSizeInfo(null);
                          }}
                          className="px-3 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drag & Drop Upload Zone */
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-amber-500/50 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                      {uploadingImage ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {uploadingImage ? 'Optimizing & Processing Photo...' : 'Click to Upload Product Photo'}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Choose photo file from your device (PNG, JPG, WebP) or drag here
                      </p>
                    </div>
                  </div>
                )}

                {/* Optional Web URL Link Fallback (collapsed by default) */}
                {showUrlFallback && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                      Web Image URL (Optional Fallback)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
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
