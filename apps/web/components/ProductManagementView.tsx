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
  CheckCircle2,
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
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function ProductManagementView() {
  const { t, lang } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');

  // View Mode: 'grid' | 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [singleIndex, setSingleIndex] = useState(0);

  // Pagination for Products & Add-ons
  const [productPage, setProductPage] = useState(1);
  const [productLimit, setProductLimit] = useState(12);
  const [addonPage, setAddonPage] = useState(1);
  const [addonLimit, setAddonLimit] = useState(12);

  // Category Management Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

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

  // Modern In-App Toast & Confirmation
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirmAction = async () => {
    if (!confirmModal || confirmLoading) return;
    setConfirmLoading(true);
    try {
      await confirmModal.onConfirm();
    } catch (e: any) {
      console.error('Confirmation action error:', e);
    } finally {
      setConfirmLoading(false);
      setConfirmModal(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

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
      showToast('Please upload a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }

    setUploadingImage(true);
    const originalSizeKb = Math.round(file.size / 1024);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 480;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          const optimizedSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
          setFormImageUrl(dataUrl);
          setImageSizeInfo(`Optimized: ${optimizedSizeKb} KB (Compressed from ${originalSizeKb} KB)`);
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
      showToast(isEditingAddon ? `Add-on updated successfully!` : `New Add-on "${formAddonName}" created!`, 'success');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      showToast(`Error saving add-on: ${err.message}`, 'error');
    } finally {
      setSavingAddon(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      await fetchApi('/menu/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const createdName = newCatName.trim();
      setNewCatName('');
      setCategoryModalOpen(false);
      showToast(`Category "${createdName}" created successfully!`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = (cat: any) => {
    if (cat._count?.menuItems > 0 || cat._count?.addons > 0) {
      showToast(
        `Cannot delete "${cat.name}" because it has ${cat._count?.menuItems || 0} items assigned. Reassign items first.`,
        'error',
      );
      return;
    }
    setConfirmModal({
      title: 'Delete Category',
      description: `Are you sure you want to delete category "${cat.name}"?`,
      confirmText: 'Delete Category',
      isDanger: true,
      onConfirm: async () => {
        try {
          await fetchApi(`/menu/categories/${cat.id}`, { method: 'DELETE' });
          setCategories((prev) => prev.filter((c) => c.id !== cat.id));
          showToast(`Category "${cat.name}" deleted.`, 'success');
          loadData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete category', 'error');
        }
      },
    });
  };

  const handleDeleteAddon = (addon: any) => {
    setConfirmModal({
      title: 'Delete Add-on',
      description: `Are you sure you want to delete add-on "${addon.name}"?`,
      confirmText: 'Delete Add-on',
      isDanger: true,
      onConfirm: async () => {
        try {
          await fetchApi(`/menu/addons/${addon.id}`, { method: 'DELETE' });
          showToast(`Add-on "${addon.name}" removed.`, 'success');
          loadData();
        } catch (err: any) {
          showToast(`Failed to delete add-on: ${err.message}`, 'error');
        }
      },
    });
  };

  const handleToggleAddonActive = async (addon: any) => {
    try {
      await fetchApi(`/menu/addons/${addon.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !addon.isActive }),
      });
      loadData();
    } catch (err: any) {
      showToast(`Failed to update add-on status: ${err.message}`, 'error');
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

  useEffect(() => {
    setProductPage(1);
  }, [search, selectedCatId]);

  useEffect(() => {
    setAddonPage(1);
  }, [addonSearch]);

  const productTotalPages = Math.max(1, Math.ceil(filteredItems.length / productLimit));
  const paginatedItems = useMemo(() => {
    const start = (productPage - 1) * productLimit;
    return filteredItems.slice(start, start + productLimit);
  }, [filteredItems, productPage, productLimit]);

  const addonTotalPages = Math.max(1, Math.ceil(filteredAddons.length / addonLimit));
  const paginatedAddons = useMemo(() => {
    const start = (addonPage - 1) * addonLimit;
    return filteredAddons.slice(start, start + addonLimit);
  }, [filteredAddons, addonPage, addonLimit]);

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
      showToast(editingId ? `Product updated successfully!` : `New product "${formName}" added to menu!`, 'success');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      showToast(`Error saving product: ${err.message}`, 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = (item: any) => {
    setConfirmModal({
      title: 'Remove Product',
      description: `Are you sure you want to remove "${item.name}" from the menu?`,
      confirmText: 'Remove Product',
      isDanger: true,
      onConfirm: async () => {
        try {
          await fetchApi(`/menu/items/${item.id}`, { method: 'DELETE' });
          showToast(`Product "${item.name}" removed.`, 'success');
          loadData();
        } catch (err: any) {
          showToast(`Failed to delete product: ${err.message}`, 'error');
        }
      },
    });
  };

  const selectedIngredient = ingredientsPool.find((i) => i.id === formAddonIngredientId);
  const addonQtyNum = parseFloat(formAddonQty) || 0;
  const addonPriceNum = parseFloat(formAddonPrice) || 0;
  const unitCostNum = selectedIngredient ? Number(selectedIngredient.currentCostPerBaseUnit || 0) : 0;
  const addonEstimatedCost = addonQtyNum * unitCostNum;
  const addonGrossProfit = addonPriceNum - addonEstimatedCost;
  const addonMarginPercent = addonPriceNum > 0 ? (addonGrossProfit / addonPriceNum) * 100 : 0;

  return (
    <div className="space-y-5 text-stone-900 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 max-w-sm w-full sm:w-auto animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 text-xs font-black ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/20'
                : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                confirmModal.isDanger
                  ? 'bg-rose-50 border border-rose-200 text-rose-600'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {confirmModal.isDanger ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="text-base font-black text-stone-900">{confirmModal.title}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {confirmModal.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmLoading}
                onClick={handleConfirmAction}
                className={`px-4 py-2.5 rounded-xl text-white font-black text-xs transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-60 inline-flex items-center gap-1.5 ${
                  confirmModal.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmLoading ? 'Deleting...' : confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Top Action & Control Bar */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-600" />
              <span>{t('menu_studio')}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-stone-700 transition cursor-pointer"
              title="Refresh product list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {activeTab === 'products' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCategoryModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                  title="Create or manage product categories"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{t('menu_add_category')}</span>
                </button>
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{t('menu_add_product')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={openAddAddonModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ {t('menu_addons')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{t('menu_products')}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'products' ? 'bg-black/20 text-white font-extrabold' : 'bg-stone-200 text-stone-700'
            }`}>
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('addons')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'addons'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('menu_addons')}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'addons' ? 'bg-black/20 text-stone-950 font-extrabold' : 'bg-stone-200 text-stone-700'
            }`}>
              {addons.length}
            </span>
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {actionMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center justify-between animate-in fade-in">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-stone-900 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab 1: Products Filter & Search Row */}
        {activeTab === 'products' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSingleIndex(0);
                }}
                className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-600 rounded-xl pl-10 pr-9 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none transition"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSingleIndex(0);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-900 rounded-full transition absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
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
                    ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700 hover:text-stone-950'
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
                      ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700 hover:text-stone-950'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCatId === c.id ? 'bg-black/20 text-stone-950 font-bold' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {c._count?.menuItems || 0}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 cursor-pointer shrink-0"
                title="Add new category"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Category</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Add-ons Search Row */}
        {activeTab === 'addons' && (
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search add-ons..."
              value={addonSearch}
              onChange={(e) => setAddonSearch(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-600 rounded-xl pl-10 pr-9 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none transition"
            />
            {addonSearch && (
              <button
                onClick={() => setAddonSearch('')}
                className="p-1 text-stone-400 hover:text-stone-900 rounded-full transition absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1 CONTENT: PRODUCTS STUDIO (GRID / LIST) */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* View Mode Switcher & Stats Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-100/60 border border-stone-200/80 p-3 rounded-2xl">
            <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-xl w-fit">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="View products in responsive grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="View products in clean 1-per-row list"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>List (1 Per Row)</span>
              </button>
            </div>

            <div className="text-xs font-bold text-stone-500">
              Showing{' '}
              <strong className="text-stone-900 font-black">
                {filteredItems.length === 0
                  ? 0
                  : `${(productPage - 1) * productLimit + 1}–${Math.min(productPage * productLimit, filteredItems.length)}`}
              </strong>{' '}
              of <strong className="text-stone-900 font-black">{filteredItems.length}</strong> products
              {selectedCatId && (
                <span> in <strong className="text-emerald-700 font-black">{categories.find((c) => c.id === selectedCatId)?.name}</strong></span>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: 1 PER ROW (CLEAN LIST VIEW) */}
          {viewMode === 'list' && (
            <div className="space-y-2.5">
              {paginatedItems.length === 0 ? (
                <div className="py-16 text-center text-xs text-stone-500 bg-white border border-stone-200/90 rounded-3xl">
                  No products found matching your search.
                </div>
              ) : (
                paginatedItems.map((item) => {
                  const price = Number(item.price || 0);

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-stone-200/90 hover:border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <MenuImage
                            src={item.imageUrl}
                            alt={item.name}
                            categoryName={item.category?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                            {item.category?.name || 'General'}
                          </span>
                          <h3 className="font-extrabold text-sm sm:text-base text-stone-900 truncate">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-sm sm:text-base font-black text-stone-900">
                            {price.toFixed(2)} ETB
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition border border-stone-200 cursor-pointer"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item)}
                            className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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
              {paginatedItems.length === 0 ? (
                <div className="col-span-full py-16 text-center text-xs text-stone-500 bg-white border border-stone-200/90 rounded-3xl">
                  No products found matching your search.
                </div>
              ) : (
                paginatedItems.map((item) => {
                  const price = Number(item.price || 0);

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-stone-200/90 hover:border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 shadow-xs flex flex-col justify-between transition"
                    >
                      <div>
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-3 border border-stone-200">
                          <MenuImage
                            src={item.imageUrl}
                            alt={item.name}
                            categoryName={item.category?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                          {item.category?.name || 'General'}
                        </span>
                        <h3 className="font-extrabold text-sm sm:text-base text-stone-900 truncate" title={item.name}>
                          {item.name}
                        </h3>
                        <div className="text-base font-black text-stone-900 mt-1">
                          {price.toFixed(2)} ETB
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-3 border-t border-stone-200 mt-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition border border-stone-200 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item)}
                          className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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

          {/* Products Pagination Bar */}
          {filteredItems.length > 0 && (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Left: Per Page Selector */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-500">{t('menu_per_page')}</span>
                <div className="flex items-center gap-1">
                  {[12, 24, 48, 100].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setProductLimit(size);
                        setProductPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                        productLimit === size
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Center: Range Display */}
              <div className="font-bold text-stone-600">
                {t('menu_showing')}{' '}
                <strong className="text-stone-900 font-black">
                  {(productPage - 1) * productLimit + 1}–{Math.min(productPage * productLimit, filteredItems.length)}
                </strong>{' '}
                {t('menu_of')} <strong className="text-stone-900 font-black">{filteredItems.length}</strong> {t('menu_products').toLowerCase()}
              </div>

              {/* Right: Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productPage <= 1}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-stone-700 transition cursor-pointer flex items-center gap-1"
                >
                  <span>{t('menu_previous')}</span>
                </button>

                <span className="font-bold text-stone-800 px-1">
                  {t('menu_page')} <strong className="text-emerald-700 font-black">{productPage}</strong> {t('menu_of')}{' '}
                  <strong className="font-black">{productTotalPages}</strong>
                </span>

                <button
                  onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                  disabled={productPage >= productTotalPages}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-stone-700 transition cursor-pointer flex items-center gap-1"
                >
                  <span>{t('menu_next')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2 CONTENT: CLEAN ADD-ONS */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAddons.length === 0 ? (
              <div className="col-span-full py-16 text-center text-xs text-stone-500 bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs">
                <Layers className="w-8 h-8 text-emerald-600/40 mx-auto mb-2" />
                <div className="font-bold text-stone-900 text-sm mb-1">No add-ons found</div>
                <button
                  onClick={openAddAddonModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer mt-3 shadow-xs"
                >
                  + Add Modifier
                </button>
              </div>
            ) : (
              paginatedAddons.map((addon) => {
                const scopeLabel = addon.menuItem
                  ? addon.menuItem.name
                  : addon.category
                  ? addon.category.name
                  : 'All Dishes';

                return (
                  <div
                    key={addon.id}
                    className={`p-4 rounded-2xl border transition shadow-xs flex items-center justify-between gap-3 ${
                      addon.isActive
                        ? 'bg-white border-stone-200/90 hover:border-emerald-500/30'
                        : 'bg-stone-50 border-stone-200/60 opacity-60'
                    }`}
                  >
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-stone-900">{addon.name}</h3>
                      <span className="text-[10px] font-bold text-stone-500">
                        {scopeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm sm:text-base font-black text-stone-900 whitespace-nowrap">
                        +{Number(addon.price).toFixed(2)} ETB
                      </span>

                      <button
                        onClick={() => handleToggleAddonActive(addon)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                          addon.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {addon.isActive ? 'Active' : 'Paused'}
                      </button>

                      <button
                        onClick={() => openEditAddonModal(addon)}
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition border border-stone-200 cursor-pointer"
                        title="Edit add-on"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddon(addon)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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

          {/* Add-ons Pagination Controls */}
          {filteredAddons.length > 0 && (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-500">{t('menu_per_page')}</span>
                <div className="flex items-center gap-1">
                  {[12, 24, 48].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setAddonLimit(size);
                        setAddonPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                        addonLimit === size
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="font-bold text-stone-600">
                {t('menu_showing')}{' '}
                <strong className="text-stone-900 font-black">
                  {(addonPage - 1) * addonLimit + 1}–{Math.min(addonPage * addonLimit, filteredAddons.length)}
                </strong>{' '}
                {t('menu_of')} <strong className="text-stone-900 font-black">{filteredAddons.length}</strong> {t('menu_addons').toLowerCase()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddonPage((p) => Math.max(1, p - 1))}
                  disabled={addonPage <= 1}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-stone-700 transition cursor-pointer flex items-center gap-1"
                >
                  <span>{t('menu_previous')}</span>
                </button>

                <span className="font-bold text-stone-800 px-1">
                  {t('menu_page')} <strong className="text-emerald-700 font-black">{addonPage}</strong> {t('menu_of')}{' '}
                  <strong className="font-black">{addonTotalPages}</strong>
                </span>

                <button
                  onClick={() => setAddonPage((p) => Math.min(addonTotalPages, p + 1))}
                  disabled={addonPage >= addonTotalPages}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-stone-700 transition cursor-pointer flex items-center gap-1"
                >
                  <span>{t('menu_next')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT ADD-ON MODAL */}
      {addonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>{isEditingAddon ? 'Edit Kitchen Add-on' : 'New Kitchen Add-on'}</span>
                </h3>
              </div>
              <button
                onClick={() => setAddonModalOpen(false)}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-xl bg-stone-100 hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-4">
              {/* Add-on Name */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Add-on Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Mozzarella Cheese, Extra Beef Patty (100g)"
                  value={formAddonName}
                  onChange={(e) => setFormAddonName(e.target.value)}
                  className="w-full bg-white border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
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
                  className="w-full bg-white border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3 py-2 text-xs font-black text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              </div>

              {/* Scope Selector */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
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
                          ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-900'
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
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Select Target Category
                  </label>
                  <select
                    value={formAddonCategoryId}
                    onChange={(e) => setFormAddonCategoryId(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-stone-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Item Dropdown if ITEM */}
              {formAddonTargetType === 'ITEM' && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Select Target Product
                  </label>
                  <select
                    value={formAddonItemId}
                    onChange={(e) => setFormAddonItemId(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id} className="bg-white text-stone-900">
                        {i.name} ({Number(i.price).toFixed(2)} ETB)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Linked Ingredient Selector */}
              <div className="pt-2 border-t border-stone-200">
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Linked Inventory Ingredient (for stock deduction)
                </label>
                <select
                  value={formAddonIngredientId}
                  onChange={(e) => setFormAddonIngredientId(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="" className="bg-white text-stone-500">No stock deduction (price bump only)</option>
                  {ingredientsPool.map((ing) => (
                    <option key={ing.id} value={ing.id} className="bg-white text-stone-900">
                      {ing.name} ({ing.category}) • Cost: {Number(ing.currentCostPerBaseUnit).toFixed(4)} ETB / {ing.baseUnit?.symbol || 'g'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Portion Deduction Quantity */}
              {formAddonIngredientId && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
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
                      className="w-full bg-white border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 placeholder-stone-400 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-2 rounded-xl">
                      {selectedIngredient?.baseUnit?.symbol || 'g'}
                    </span>
                  </div>
                </div>
              )}

              {/* Live Financial Calculation Card */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Live Cost & Margin Analysis
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                    <div className="text-[9px] text-stone-500 uppercase font-bold">Selling Price</div>
                    <div className="text-xs font-black text-stone-900 mt-0.5">
                      {addonPriceNum.toFixed(2)} ETB
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                    <div className="text-[9px] text-stone-500 uppercase font-bold">Stock Cost</div>
                    <div className="text-xs font-black text-rose-600 mt-0.5">
                      {addonEstimatedCost.toFixed(2)} ETB
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200">
                    <div className="text-[9px] text-stone-500 uppercase font-bold">Gross Margin</div>
                    <div className={`text-xs font-black mt-0.5 ${addonMarginPercent >= 50 ? 'text-emerald-700' : 'text-stone-700'}`}>
                      {addonMarginPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setAddonModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddon}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-black text-stone-900">
                {isEditing ? `Edit Product: ${formName}` : 'Add New Menu Product'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-500 hover:text-stone-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Product Name (English / Amharic)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Club Sandwich / ስፔሻል ክለብ ሳንድዊች"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={formCatId}
                    onChange={(e) => setFormCatId(e.target.value)}
                    className="w-full bg-white border border-stone-300 focus:border-emerald-600 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-stone-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Selling Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 750"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-white border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3 py-2.5 text-xs font-black text-stone-900 placeholder-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Preparation Station</label>
                  <select
                    value={formPrepSection}
                    onChange={(e) => setFormPrepSection(e.target.value)}
                    className="w-full bg-white border border-stone-300 focus:border-emerald-600 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 focus:outline-none cursor-pointer"
                  >
                    <option value="HOT_KITCHEN" className="bg-white text-stone-900">Hot Kitchen (Burgers, Pastas, Eggs)</option>
                    <option value="COLD_KITCHEN" className="bg-white text-stone-900">Cold Kitchen (Salads, Wraps)</option>
                    <option value="BAR_COFFEE" className="bg-white text-stone-900">Bar & Coffee (Juices, Hot/Cold Drinks)</option>
                    <option value="BAKERY" className="bg-white text-stone-900">Bakery (Desserts, Tortas per Kg)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsDirect}
                      onChange={(e) => setFormIsDirect(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 bg-white border-stone-300"
                    />
                    <span className="font-bold text-stone-700 text-xs">Direct Retail (Soda/Water)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ingredients / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Double Beef, Double Cheese, Egg, House Mayo, tomato, onion, lettuce & Fries"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-white border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl p-3 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              </div>

              {/* Product Photo Upload Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-stone-700 text-xs uppercase tracking-wider">
                    Product Photo (Upload File)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    className="text-[10px] font-semibold text-emerald-700 hover:underline transition cursor-pointer"
                  >
                    {showUrlFallback ? 'Hide URL link' : 'Or paste web link'}
                  </button>
                </div>

                {formImageUrl ? (
                  /* Image Preview Card */
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-3 flex items-center gap-4 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 relative">
                      <img
                        src={formImageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Photo Uploaded & Ready</span>
                      </div>
                      {imageSizeInfo && (
                        <div className="text-[10px] text-stone-500 mt-0.5 font-mono">{imageSizeInfo}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormImageUrl('');
                            setImageSizeInfo(null);
                          }}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
                    className="border-2 border-dashed border-stone-300 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/30 rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                      {uploadingImage ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {uploadingImage ? 'Optimizing & Processing Photo...' : 'Upload Product Photo'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Web URL Link Fallback (collapsed by default) */}
                {showUrlFallback && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                      Web Image URL (Optional Fallback)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-white border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none"
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {savingProduct ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Category Management */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">Manage Categories</h3>
                  <p className="text-[11px] text-stone-500 font-medium">Add, review, or organize menu categories</p>
                </div>
              </div>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  New Category Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Add-ons, Combo Meals, Desserts..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-stone-50 border border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={savingCat || !newCatName.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {savingCat ? 'Adding...' : '+ Add'}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Suggestions for Missing Categories */}
            {!categories.some((c) => c.name.toLowerCase().includes('add-on') || c.name.toLowerCase().includes('addon')) && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-amber-900">
                  💡 Tip: Add an "Add-ons" category for extras & toppings.
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    setSavingCat(true);
                    try {
                      await fetchApi('/menu/categories', {
                        method: 'POST',
                        body: JSON.stringify({ name: 'Add-ons' }),
                      });
                      showToast('Category "Add-ons" created!', 'success');
                      loadData();
                    } catch (e: any) {
                      showToast(e.message || 'Failed to add', 'error');
                    } finally {
                      setSavingCat(false);
                    }
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black shrink-0 cursor-pointer"
                >
                  Create "Add-ons"
                </button>
              </div>
            )}

            {/* Existing Categories List */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Active Categories ({categories.length})
              </span>
              <div className="max-h-56 overflow-y-auto divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-stone-50/50 p-1">
                {categories.map((c) => (
                  <div key={c.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-white rounded-xl transition">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{c.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-200/80 text-stone-700">
                        {c._count?.menuItems || 0} products
                      </span>
                    </div>
                    {(c._count?.menuItems || 0) === 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c)}
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete empty category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
