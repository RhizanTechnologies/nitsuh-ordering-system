'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi } from '@/lib/api';
import { RecipeEditorModal } from '@/components/RecipeEditorModal';
import { PurchaseOrderModal } from '@/components/PurchaseOrderModal';
import { StockItemModal } from '@/components/StockItemModal';
import {
  Boxes,
  ArrowRightLeft,
  ChefHat,
  Trash2,
  AlertTriangle,
  History,
  Send,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  PlusCircle,
  Truck,
  Edit3,
  DollarSign,
  X,
  Plus,
  Minus,
  Check,
  PackageCheck,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sliders,
  Search,
  Filter,
  Layers,
  Scale
} from 'lucide-react';

export function InventoryView() {
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'catalog' | 'transfers' | 'recipes' | 'purchases' | 'wastage' | 'ledger'>('catalog');
  const [locations, setLocations] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<any | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // In-App Toast State (Replacing native browser alert)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Rejection Modal State (Replacing window.prompt)
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);

  // Raw Stock Items Catalog (CRUD) State
  const [rawIngredients, setRawIngredients] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [stockItemModalOpen, setStockItemModalOpen] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<any | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  // Modals
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [recipeDishSearch, setRecipeDishSearch] = useState('');
  const [recipeDishFilter, setRecipeDishFilter] = useState<'ALL' | 'MISSING' | 'CONFIGURED'>('ALL');

  // Quick Adjustment Modal State (Add or Remove stock directly)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustLocationType, setAdjustLocationType] = useState<'MAIN_STORE' | 'KITCHEN_STORE'>('MAIN_STORE');
  const [adjustIngredient, setAdjustIngredient] = useState<any | null>(null);
  const [adjustMode, setAdjustMode] = useState<'ADD' | 'REMOVE'>('ADD');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Direct Batch Send to Kitchen Modal State (Main Storekeeper dispatches multiple items)
  const [sendDirectModalOpen, setSendDirectModalOpen] = useState(false);
  const [batchQuantities, setBatchQuantities] = useState<Record<string, string>>({});
  const [sendNotes, setSendNotes] = useState('');
  const [sendSearch, setSendSearch] = useState('');
  const [sendSubmitting, setSendSubmitting] = useState(false);

  // Catalog store filter switcher (ALL | MAIN | KITCHEN)
  const [catalogStoreFilter, setCatalogStoreFilter] = useState<'ALL' | 'MAIN' | 'KITCHEN'>('ALL');

  // Supplier Registration Modal State (BUG-016)
  const [newSupplierModalOpen, setNewSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supSubmitting, setSupSubmitting] = useState(false);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [thresholdSearch, setThresholdSearch] = useState('');
  const [editingThresholds, setEditingThresholds] = useState<Record<string, { main: string; kitchen: string }>>({});
  const [savingThresholdId, setSavingThresholdId] = useState<string | null>(null);

  const role = currentUser?.role;
  const isHeadChefOnly = role === 'HEAD_CHEF' || role === 'KITCHEN_STOREKEEPER' || role === 'KITCHEN_STAFF';
  const isMainStorekeeper = role === 'MAIN_STOREKEEPER' || role === 'OWNER' || role === 'MANAGER';
  const isKitchenChef = role === 'KITCHEN_STOREKEEPER' || role === 'HEAD_CHEF' || role === 'OWNER' || role === 'MANAGER';
  const isKitchenReceiver = role === 'KITCHEN_STOREKEEPER' || role === 'HEAD_CHEF' || role === 'OWNER';
  const isOwnerOrManager = role === 'OWNER' || role === 'MANAGER';
  const isOwner = role === 'OWNER';

  // Wastage form state
  const [wasteIngredientId, setWasteIngredientId] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('');
  const [wasteReason, setWasteReason] = useState('Spoilage / Expired');
  const [customWasteReason, setCustomWasteReason] = useState('');
  const [wasteSuccess, setWasteSuccess] = useState(false);

  const loadData = () => {
    const roleParam = currentUser?.role ? `?role=${currentUser.role}` : '';
    fetchApi(`/inventory/balances${roleParam}`).then(setLocations);
    fetchApi(`/inventory/transfers${roleParam}`).then(setTransfers);
    fetchApi(`/inventory/alerts${roleParam}`).then(setAlerts);
    fetchApi('/inventory/ledger').then(setLedger);
    fetchApi('/inventory/suppliers').then(setSuppliers);
    fetchApi('/inventory/ingredients').then((ings) => setRawIngredients(ings || []));
    fetchApi('/inventory/units').then((u) => setUnits(u || []));
    fetchApi('/menu/items').then((items) => {
      setMenuItems(items);
      if (items.length > 0) {
        setSelectedRecipeItem((prev: any) =>
          prev ? items.find((i: any) => i.id === prev.id) || items[0] : items[0],
        );
      }
    });
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.role]);

  // Handle Quick Stock Adjust (Add or Remove stock directly)
  const handleOpenAdjust = (ingredient: any, locationType: 'MAIN_STORE' | 'KITCHEN_STORE', mode: 'ADD' | 'REMOVE') => {
    setAdjustIngredient(ingredient);
    setAdjustLocationType(locationType);
    setAdjustMode(mode);
    setAdjustQuantity('');
    setAdjustReason(mode === 'ADD' ? 'Manual stock addition' : 'Inventory count correction');
    setAdjustModalOpen(true);
  };

  const handleCommitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustIngredient || !adjustQuantity) return;
    const qtyNum = parseFloat(adjustQuantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showToast('Please enter a valid positive quantity', 'error');
      return;
    }

    const currentLoc = adjustLocationType === 'MAIN_STORE' ? mainStoreLoc : kitchenStoreLoc;
    const currentBalanceObj = currentLoc?.balances?.find(
      (b: any) => b.ingredientId === adjustIngredient.id || b.ingredient?.id === adjustIngredient.id,
    );
    const currentQty = Number(currentBalanceObj?.quantity || 0);

    if (adjustMode === 'REMOVE' && qtyNum > currentQty) {
      showToast(
        `Cannot remove ${qtyNum} ${adjustIngredient.baseUnit?.symbol || 'units'}. Current balance is ${currentQty} ${adjustIngredient.baseUnit?.symbol || 'units'}.`,
        'error',
      );
      return;
    }

    const delta = adjustMode === 'ADD' ? qtyNum : -qtyNum;

    setAdjustSubmitting(true);
    try {
      await fetchApi('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser?.id,
          locationType: adjustLocationType,
          ingredientId: adjustIngredient.id,
          deltaQuantity: delta,
          reason: adjustReason || `${adjustMode === 'ADD' ? 'Added' : 'Removed'} by ${currentUser?.name}`,
        }),
      });
      setAdjustModalOpen(false);
      showToast('Stock balance adjusted successfully!', 'success');
      loadData();
    } catch (err: any) {
      showToast(`Error adjusting stock: ${err.message}`, 'error');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Main Storekeeper directly dispatches multiple stock items in 1 batch to Kitchen
  const handleSendBatchToKitchen = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeItems = Object.entries(batchQuantities)
      .map(([ingredientId, qtyStr]) => ({ ingredientId, quantity: parseFloat(qtyStr) }))
      .filter((i) => !isNaN(i.quantity) && i.quantity > 0);

    if (activeItems.length === 0) {
      showToast('Please enter a delivery quantity for at least one item.', 'error');
      return;
    }

    setSendSubmitting(true);
    try {
      await fetchApi('/inventory/transfers/dispatch-batch', {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUser?.id,
          items: activeItems,
          notes: sendNotes.trim() || 'Direct batch delivery from Main Store',
        }),
      });
      setSendDirectModalOpen(false);
      setBatchQuantities({});
      setSendNotes('');
      setSendSearch('');
      showToast('Batch delivery dispatched to kitchen!', 'success');
      loadData();
    } catch (err: any) {
      showToast(`Error dispatching batch to kitchen: ${err.message}`, 'error');
    } finally {
      setSendSubmitting(false);
    }
  };

  // Kitchen Chef confirms received transfer -> adds stock to Kitchen Store
  const handleConfirmKitchenReceipt = async (transferId: string) => {
    try {
      await fetchApi(`/inventory/transfers/${transferId}/receive`, {
        method: 'POST',
        body: JSON.stringify({
          receivedById: currentUser?.id,
          receivedItems: [],
        }),
      });
      showToast('Delivery received and added to Kitchen Store!', 'success');
      loadData();
    } catch (e: any) {
      showToast(`Error confirming receipt: ${e.message}`, 'error');
    }
  };

  // Kitchen Chef rejects incoming transfer -> returns stock back to Main Store
  const handleRejectKitchenReceipt = (transferId: string) => {
    setRejectModal({
      id: transferId,
      reason: 'Quantity mismatch / damaged goods',
    });
  };

  const executeRejectKitchenReceipt = async () => {
    if (!rejectModal) return;
    setRejecting(true);
    try {
      await fetchApi(`/inventory/transfers/${rejectModal.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          rejectedById: currentUser?.id,
          reason: rejectModal.reason.trim() || 'Rejected by Head Chef',
        }),
      });
      showToast('Delivery rejected and returned to Main Store.', 'success');
      setRejectModal(null);
      loadData();
    } catch (e: any) {
      showToast(`Error rejecting delivery: ${e.message}`, 'error');
    } finally {
      setRejecting(false);
    }
  };

  // Open Threshold Cutoffs Configuration Modal
  const handleOpenThresholdModal = () => {
    const initial: Record<string, { main: string; kitchen: string }> = {};
    const seen = new Set<string>();
    locations.forEach((loc) => {
      loc.balances?.forEach((b: any) => {
        if (!seen.has(b.ingredient.id)) {
          seen.add(b.ingredient.id);
          initial[b.ingredient.id] = {
            main: String(b.ingredient.reorderThresholdMain ?? 1000),
            kitchen: String(b.ingredient.reorderThresholdKitchen ?? 200),
          };
        }
      });
    });
    setEditingThresholds(initial);
    setThresholdModalOpen(true);
  };

  // Save new threshold cutoff for an ingredient
  const handleSaveThreshold = async (ingredientId: string) => {
    const data = editingThresholds[ingredientId];
    if (!data) return;
    setSavingThresholdId(ingredientId);
    try {
      await fetchApi(`/inventory/ingredients/${ingredientId}/thresholds`, {
        method: 'PATCH',
        body: JSON.stringify({
          reorderThresholdMain: parseFloat(data.main) || 0,
          reorderThresholdKitchen: parseFloat(data.kitchen) || 0,
        }),
      });
      showToast('Threshold updated successfully!', 'success');
      loadData();
    } catch (e: any) {
      showToast(`Error updating threshold: ${e.message}`, 'error');
    } finally {
      setSavingThresholdId(null);
    }
  };

  const handleDispatch = async (transferId: string) => {
    try {
      await fetchApi(`/inventory/transfers/${transferId}/dispatch`, {
        method: 'POST',
        body: JSON.stringify({
          approvedById: currentUser.id || 'm01-storekeeper',
          dispatchedItems: [],
        }),
      });
      showToast('Transfer dispatched to kitchen!', 'success');
      loadData();
    } catch (e: any) {
      showToast(`Error dispatching transfer: ${e.message}`, 'error');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    setSupSubmitting(true);
    try {
      await fetchApi('/inventory/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          name: supName.trim(),
          contactPerson: supContact.trim() || undefined,
          phone: supPhone.trim() || undefined,
          email: supEmail.trim() || undefined,
          address: supAddress.trim() || undefined,
        }),
      });
      setNewSupplierModalOpen(false);
      showToast(`Supplier "${supName}" registered successfully!`, 'success');
      setSupName('');
      setSupContact('');
      setSupPhone('');
      setSupEmail('');
      setSupAddress('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create supplier', 'error');
    } finally {
      setSupSubmitting(false);
    }
  };

  const handleRecordWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteIngredientId || !wasteQuantity) return;
    try {
      const finalReason =
        wasteReason === 'Other'
          ? customWasteReason.trim() || 'Other wastage'
          : wasteReason;

      await fetchApi('/inventory/wastage', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id || 'k01-storekeeper',
          ingredientId: wasteIngredientId,
          quantity: parseFloat(wasteQuantity),
          reason: finalReason,
        }),
      });
      setWasteQuantity('');
      showToast('Wastage record submitted successfully!', 'success');
      setWasteSuccess(true);
      setTimeout(() => setWasteSuccess(false), 3000);
      loadData();
    } catch (err: any) {
      showToast(`Error recording wastage: ${err.message}`, 'error');
    }
  };

  // Stock Item CRUD Handlers
  const handleOpenCreateStockItem = () => {
    setEditingStockItem(null);
    setStockItemModalOpen(true);
  };

  const handleOpenEditStockItem = (item: any) => {
    setEditingStockItem(item);
    setStockItemModalOpen(true);
  };

  const handleConfirmDeleteStockItem = (item: any) => {
    setDeleteConfirmItem(item);
  };

  const executeDeleteStockItem = async () => {
    if (!deleteConfirmItem) return;
    setDeletingItem(true);
    try {
      const res = await fetchApi(`/inventory/ingredients/${deleteConfirmItem.id}`, {
        method: 'DELETE',
      });
      showToast(res?.message || 'Stock item deleted successfully', 'success');
      setDeleteConfirmItem(null);
      loadData();
    } catch (err: any) {
      showToast(`Error deleting stock item: ${err.message}`, 'error');
    } finally {
      setDeletingItem(false);
    }
  };

  const mainStoreLoc = locations.find((l) => l.type === 'MAIN_STORE');
  const kitchenStoreLoc = locations.find((l) => l.type === 'KITCHEN_STORE');

  // Transfers dispatched by Main Storekeeper awaiting Kitchen Chef confirmation
  const pendingKitchenReceipts = transfers.filter((t) => t.status === 'DISPATCHED');

  // Kitchen-specific low stock alerts (current kitchen balance <= reorderThresholdKitchen)
  const kitchenLowStockItems = kitchenStoreLoc?.balances?.filter(
    (b: any) => Number(b.quantity) <= Number(b.ingredient?.reorderThresholdKitchen ?? 200),
  ) || [];

  // Main Store low stock alerts (current main store balance <= reorderThresholdMain)
  const mainLowStockItems = mainStoreLoc?.balances?.filter(
    (b: any) => Number(b.quantity) <= Number(b.ingredient?.reorderThresholdMain ?? 1000),
  ) || [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#F8F9FA] text-stone-900 font-sans transition-colors">
      {/* Top Inventory Header */}
      <div className="bg-white border-b border-stone-200/90 px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 flex-shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-black flex items-center justify-center shadow-xs flex-shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
              {isHeadChefOnly ? 'Kitchen Pantry Stock' : 'Inventory & Stock'}
            </h2>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Catalog</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'catalog'
                ? 'bg-white/20 text-white'
                : 'bg-stone-200 text-stone-700'
            }`}>
              {rawIngredients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfers</span>
            {pendingKitchenReceipts.length > 0 && (
              <span className="bg-[#C11221] text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {pendingKitchenReceipts.length}
              </span>
            )}
          </button>

          {isOwnerOrManager && (
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              Recipes
            </button>
          )}

          {isMainStorekeeper && (
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'purchases'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Suppliers
            </button>
          )}

          {isKitchenChef && (
            <button
              onClick={() => setActiveTab('wastage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'wastage'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Wastage
            </button>
          )}

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Ledger
          </button>
        </div>
      </div>

      {/* Main Tab Contents */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto no-scrollbar">
        {/* TAB 1: STOCK ITEMS CATALOG (UNIFIED BALANCES & CRUD) */}
        {activeTab === 'catalog' && (() => {
          const effectiveStoreFilter = isHeadChefOnly ? 'KITCHEN' : catalogStoreFilter;
          const categories = ['ALL', ...Array.from(new Set(rawIngredients.map((i) => i.category || 'General')))];
          const filtered = rawIngredients.filter((item) => {
            const matchesSearch =
              !catalogSearch ||
              item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
              item.sku?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
              item.category?.toLowerCase().includes(catalogSearch.toLowerCase());
            const matchesCategory = catalogCategory === 'ALL' || item.category === catalogCategory;
            return matchesSearch && matchesCategory;
          });

          // Compute store-aware KPI totals
          const totalValuation = rawIngredients.reduce((sum, item) => {
            const cost = Number(item.currentCostPerBaseUnit || 0);
            const mainQty = Number(item.balances?.find((b: any) => b.location?.type === 'MAIN_STORE')?.quantity || 0);
            const kitQty = Number(item.balances?.find((b: any) => b.location?.type === 'KITCHEN_STORE')?.quantity || 0);
            const qty = effectiveStoreFilter === 'MAIN' ? mainQty : effectiveStoreFilter === 'KITCHEN' ? kitQty : mainQty + kitQty;
            return sum + (cost * qty);
          }, 0);

          const lowStockCount = rawIngredients.filter((item) => {
            const mainBal = Number(item.balances?.find((b: any) => b.location?.type === 'MAIN_STORE')?.quantity || 0);
            const kitBal = Number(item.balances?.find((b: any) => b.location?.type === 'KITCHEN_STORE')?.quantity || 0);
            const isMainLow = mainBal <= Number(item.reorderThresholdMain);
            const isKitLow = kitBal <= Number(item.reorderThresholdKitchen);
            if (effectiveStoreFilter === 'MAIN') return isMainLow;
            if (effectiveStoreFilter === 'KITCHEN') return isKitLow;
            return isMainLow || isKitLow;
          }).length;

          return (
            <div className="space-y-6">
              {/* PENDING KITCHEN CONFIRMATION BANNER (For Head Chef) */}
              {isKitchenChef && pendingKitchenReceipts.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl shadow-xs animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                        <PackageCheck className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>Incoming Deliveries from Main Storekeeper</span>
                          <span className="bg-rose-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black whitespace-nowrap inline-flex items-center shrink-0">
                            {pendingKitchenReceipts.length} Pending Confirmation
                          </span>
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pendingKitchenReceipts.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 bg-white dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-2xl flex flex-col justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-black text-stone-900 dark:text-white">{t.transferNumber}</span>
                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                              In-Transit
                            </span>
                          </div>
                          <div className="text-xs text-stone-900 dark:text-zinc-300 font-semibold mb-1">
                            {t.items.map((i: any) => `${i.ingredient?.name}: ${i.dispatchedQty || i.requestedQty} ${i.unit?.symbol || i.ingredient?.baseUnit?.symbol}`).join(', ')}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-zinc-400">
                            Dispatched by {t.approvedBy?.name || 'Main Storekeeper'} • Notes: {t.notes || 'Direct dispatch'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleConfirmKitchenReceipt(t.id)}
                            className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Accept & Add to Kitchen</span>
                          </button>
                          <button
                            onClick={() => handleRejectKitchenReceipt(t.id)}
                            className="py-2 px-3 bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1"
                            title="Reject delivery and return to Main Store"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low-stock Warning Banner */}
              {(kitchenLowStockItems.length > 0 || (!isHeadChefOnly && mainLowStockItems.length > 0) || alerts.length > 0) && (
                <div className="bg-amber-50/90 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 p-4 rounded-3xl space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-stone-900 dark:text-white">
                          {isHeadChefOnly
                            ? 'Kitchen Low-Stock Alert'
                            : isMainStorekeeper && !isOwnerOrManager
                            ? 'Main Warehouse Low-Stock Alert'
                            : 'Low-Stock Alerts'}
                        </h4>
                        <div className="text-xs text-stone-700 dark:text-amber-200 font-medium">
                          {isHeadChefOnly ? (
                            <span>
                              <strong className="text-amber-800 dark:text-amber-400 font-black">{kitchenLowStockItems.length}</strong> below kitchen cutoff
                            </span>
                          ) : isMainStorekeeper && !isOwnerOrManager ? (
                            <span>
                              <strong className="text-amber-800 dark:text-amber-400 font-black">{mainLowStockItems.length}</strong> below warehouse cutoff
                            </span>
                          ) : (
                            <span>
                              Kitchen: <strong className="text-amber-800 dark:text-amber-400 font-black">{kitchenLowStockItems.length} low</strong> • Main: <strong className="text-amber-800 dark:text-amber-400 font-black">{mainLowStockItems.length} low</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwnerOrManager && (
                      <button
                        onClick={handleOpenThresholdModal}
                        className="h-9 px-3.5 bg-white dark:bg-amber-500/20 hover:bg-stone-100 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Set Alert Cutoffs</span>
                      </button>
                    )}
                  </div>

                  {/* Details chip list of low items */}
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-amber-200/70 dark:border-white/10">
                    {isHeadChefOnly
                      ? kitchenLowStockItems.map((b: any) => (
                          <span
                            key={b.ingredient.id}
                            className="bg-white dark:bg-black/30 border border-stone-200 dark:border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] text-stone-700 dark:text-zinc-300 flex items-center gap-1.5 shadow-xs"
                          >
                            <span className="font-bold text-stone-900 dark:text-white">{b.ingredient.name}:</span>
                            <span className="text-amber-800 dark:text-amber-400 font-black">{b.quantity} {b.ingredient.baseUnit?.symbol}</span>
                            <span className="text-stone-500 dark:text-zinc-500">(Cutoff: {b.ingredient.reorderThresholdKitchen} {b.ingredient.baseUnit?.symbol})</span>
                          </span>
                        ))
                      : (isMainStorekeeper && !isOwnerOrManager
                          ? mainLowStockItems
                          : [
                              ...kitchenLowStockItems.map((k: any) => ({ ...k, storeLabel: 'Kitchen' })),
                              ...mainLowStockItems.map((m: any) => ({ ...m, storeLabel: 'Main' })),
                            ]
                        ).map((b: any, idx: number) => (
                          <span
                            key={`${b.ingredient.id}-${idx}`}
                            className="bg-white dark:bg-black/30 border border-stone-200 dark:border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] text-stone-700 dark:text-zinc-300 flex items-center gap-1.5 shadow-xs"
                          >
                            {b.storeLabel && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${b.storeLabel === 'Kitchen' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400'}`}>
                                {b.storeLabel}
                              </span>
                            )}
                            <span className="font-bold text-stone-900 dark:text-white">{b.ingredient.name}:</span>
                            <span className="text-amber-800 dark:text-amber-400 font-black">{b.quantity} {b.ingredient.baseUnit?.symbol}</span>
                          </span>
                        ))}
                  </div>
                </div>
              )}

              {/* Header & Controls */}
              <div className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-stone-200 dark:border-white/10 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-white/10">
                  <div>
                    <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2 font-heading">
                      <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isHeadChefOnly ? 'Kitchen Stock Catalog' : 'Stock Items Catalog'}</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isMainStorekeeper && (
                      <button
                        onClick={() => setSendDirectModalOpen(true)}
                        className="h-9 px-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-500/30 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="Send items directly to kitchen floor"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>Send to Kitchen</span>
                      </button>
                    )}
                    {!isHeadChefOnly && (
                      <button
                        onClick={() => setPurchaseModalOpen(true)}
                        className="h-9 px-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>PO Delivery</span>
                      </button>
                    )}
                    {isOwnerOrManager && (
                      <button
                        onClick={handleOpenCreateStockItem}
                        className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>New Stock Item</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Overview Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-stone-50 dark:bg-white/[0.02] border border-stone-200/80 dark:border-white/5 rounded-2xl">
                    <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Total Stock Items</div>
                    <div className="text-xl font-black text-stone-900 dark:text-white mt-1">{rawIngredients.length}</div>
                  </div>
                  <div className="p-3.5 bg-stone-50 dark:bg-white/[0.02] border border-stone-200/80 dark:border-white/5 rounded-2xl">
                    <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Categories</div>
                    <div className="text-xl font-black text-amber-800 dark:text-amber-400 mt-1">{categories.length - 1}</div>
                  </div>
                  <div className="p-3.5 bg-stone-50 dark:bg-white/[0.02] border border-stone-200/80 dark:border-white/5 rounded-2xl">
                    <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                      {effectiveStoreFilter === 'MAIN'
                        ? 'Main Store Worth'
                        : effectiveStoreFilter === 'KITCHEN'
                        ? 'Kitchen Store Worth'
                        : 'Total Asset Worth'}
                    </div>
                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                      {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-xs">ETB</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-stone-50 dark:bg-white/[0.02] border border-stone-200/80 dark:border-white/5 rounded-2xl">
                    <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Low-Stock Warnings</div>
                    <div className={`text-xl font-black mt-1 ${lowStockCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-stone-700 dark:text-zinc-400'}`}>
                      {lowStockCount}
                    </div>
                  </div>
                </div>

                {/* Store Filter (All / Main / Kitchen) */}
                {!isHeadChefOnly && (
                  <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200 w-full sm:w-fit">
                    <button
                      onClick={() => setCatalogStoreFilter('ALL')}
                      className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        catalogStoreFilter === 'ALL'
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All Stores
                    </button>
                    <button
                      onClick={() => setCatalogStoreFilter('MAIN')}
                      className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        catalogStoreFilter === 'MAIN'
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Main Store
                    </button>
                    <button
                      onClick={() => setCatalogStoreFilter('KITCHEN')}
                      className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        catalogStoreFilter === 'KITCHEN'
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Kitchen Store
                    </button>
                  </div>
                )}

                {/* Search & Category Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search stock items by name, SKU, or category..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <Filter className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-400 flex-shrink-0" />
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCatalogCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                          catalogCategory === cat
                            ? 'bg-emerald-600 text-white font-black shadow-xs'
                            : 'bg-stone-100 text-stone-700 hover:text-stone-950 hover:bg-stone-200/60 border border-stone-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stock Items Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                  <div className="col-span-full py-12 px-6 text-center bg-white dark:bg-white/[0.02] border border-stone-200 dark:border-white/10 rounded-3xl">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                      <Boxes className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1">No stock items match your criteria</h4>
                    {isOwnerOrManager && (
                      <button
                        onClick={handleOpenCreateStockItem}
                        className="mt-3 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        + Create Stock Item
                      </button>
                    )}
                  </div>
                ) : (
                  filtered.map((item) => {
                    const unitSym = item.baseUnit?.symbol || 'units';
                    const unitCost = Number(item.currentCostPerBaseUnit || 0);

                    const mainBalance = Number(item.balances?.find((b: any) => b.location?.type === 'MAIN_STORE')?.quantity ?? 0);
                    const kitchenBalance = Number(item.balances?.find((b: any) => b.location?.type === 'KITCHEN_STORE')?.quantity ?? 0);
                    const displayedQty =
                      effectiveStoreFilter === 'MAIN'
                        ? mainBalance
                        : effectiveStoreFilter === 'KITCHEN'
                        ? kitchenBalance
                        : mainBalance + kitchenBalance;
                    const displayedWorth = displayedQty * unitCost;

                    const isMainLow = mainBalance <= Number(item.reorderThresholdMain);
                    const isKitchenLow = kitchenBalance <= Number(item.reorderThresholdKitchen);

                    const showMainPanel = !isHeadChefOnly && (effectiveStoreFilter === 'ALL' || effectiveStoreFilter === 'MAIN');
                    const showKitchenPanel = effectiveStoreFilter === 'ALL' || effectiveStoreFilter === 'KITCHEN';

                    return (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-white/[0.03] backdrop-blur-md border border-stone-200 dark:border-white/10 hover:border-emerald-300 rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4 transition"
                      >
                        <div>
                          {/* Card Top: Title, SKU, Category Badge */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-stone-900 dark:text-white truncate" title={item.name}>
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-zinc-400 font-mono">
                                  {item.sku || 'NO-SKU'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                                  {item.category || 'General'}
                                </span>
                              </div>
                            </div>

                            {/* Actions Menu */}
                            {isOwnerOrManager && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleOpenEditStockItem(item)}
                                  className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-stone-700 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white rounded-xl transition cursor-pointer"
                                  title="Edit stock item"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleConfirmDeleteStockItem(item)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 rounded-xl transition cursor-pointer"
                                  title="Delete or archive stock item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Unit Cost Valuation Badge */}
                          <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-black/30 rounded-2xl border border-stone-200 dark:border-white/5 my-3">
                            <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-zinc-400">
                              <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Base Unit: <strong className="text-stone-900 dark:text-white">{item.baseUnit?.name || unitSym} ({unitSym})</strong></span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-amber-800 dark:text-amber-400">
                                {unitCost.toFixed(4)} ETB
                              </div>
                              <div className="text-[9px] text-stone-500 dark:text-zinc-500">per {unitSym}</div>
                            </div>
                          </div>

                          {/* Store Balance Split with Direct Addition / Removal */}
                          <div className={`grid gap-2.5 text-xs ${showMainPanel && showKitchenPanel ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {showMainPanel && (
                              <div className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 ${isMainLow ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30' : 'bg-stone-50 dark:bg-white/[0.02] border-stone-200 dark:border-white/5'}`}>
                                <div>
                                  <div className="text-[10px] text-stone-500 dark:text-zinc-400 uppercase font-bold flex items-center justify-between">
                                    <span>Main Store</span>
                                    {isMainLow && <span className="text-amber-800 dark:text-amber-400 font-black">Low</span>}
                                  </div>
                                  <div className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                                    {mainBalance.toLocaleString()} <span className="text-[10px] text-stone-500 dark:text-zinc-400">{unitSym}</span>
                                  </div>
                                  <div className="text-[9px] text-stone-500 dark:text-zinc-500 mt-0.5">Alert cutoff: &le;{item.reorderThresholdMain}</div>
                                </div>

                                {isMainStorekeeper && (
                                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-stone-200/70 dark:border-white/5">
                                    <button
                                      onClick={() => handleOpenAdjust(item, 'MAIN_STORE', 'ADD')}
                                      className="flex-1 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl transition cursor-pointer flex items-center justify-center"
                                      title="Add stock to Main Store"
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenAdjust(item, 'MAIN_STORE', 'REMOVE')}
                                      className="flex-1 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer flex items-center justify-center"
                                      title="Remove stock from Main Store"
                                    >
                                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setBatchQuantities((prev) => ({ ...prev, [item.id]: prev[item.id] || '' }));
                                        setSendDirectModalOpen(true);
                                      }}
                                      className="flex-1 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl transition cursor-pointer flex items-center justify-center"
                                      title="Send this ingredient to Kitchen Store"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {showKitchenPanel && (
                              <div className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 ${isKitchenLow ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30' : 'bg-stone-50 dark:bg-white/[0.02] border-stone-200 dark:border-white/5'}`}>
                                <div>
                                  <div className="text-[10px] text-stone-500 dark:text-zinc-400 uppercase font-bold flex items-center justify-between">
                                    <span>Kitchen Store</span>
                                    {isKitchenLow && <span className="text-rose-700 dark:text-rose-400 font-black">Low</span>}
                                  </div>
                                  <div className="text-sm font-black text-stone-900 dark:text-white mt-0.5">
                                    {kitchenBalance.toLocaleString()} <span className="text-[10px] text-stone-500 dark:text-zinc-400">{unitSym}</span>
                                  </div>
                                  <div className="text-[9px] text-stone-500 dark:text-zinc-500 mt-0.5">Alert cutoff: &le;{item.reorderThresholdKitchen}</div>
                                </div>

                                {isKitchenChef && (
                                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-stone-200/70 dark:border-white/5">
                                    <button
                                      onClick={() => handleOpenAdjust(item, 'KITCHEN_STORE', 'ADD')}
                                      className="flex-1 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl transition cursor-pointer flex items-center justify-center"
                                      title="Add stock to Kitchen Store"
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenAdjust(item, 'KITCHEN_STORE', 'REMOVE')}
                                      className="flex-1 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer flex items-center justify-center"
                                      title="Remove stock from Kitchen Store"
                                    >
                                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Bottom: Total Valued Assets */}
                        <div className="pt-3 border-t border-stone-200 dark:border-white/10 flex items-center justify-between">
                          <div className="text-[10px] text-stone-500 dark:text-zinc-400 uppercase font-bold">
                            {effectiveStoreFilter === 'MAIN'
                              ? 'Main Store Value'
                              : effectiveStoreFilter === 'KITCHEN'
                              ? 'Kitchen Store Value'
                              : 'Total Valued Assets'}
                          </div>
                          <div className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                            {displayedWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 3: STOCK TRANSFERS */}
        {activeTab === 'transfers' && (
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10 gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white font-heading">Stock Transfers Between Stores</h3>
              </div>
              <div className="flex items-center gap-2">
                {isMainStorekeeper && (
                  <button
                    onClick={() => setSendDirectModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-stone-950" />
                    <span>Direct Send to Kitchen</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {transfers.length === 0 ? (
                <div className="text-center py-12 text-stone-500 dark:text-zinc-500 text-xs">No transfer records found</div>
              ) : (
                transfers.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/5 hover:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-stone-900 dark:text-white">{t.transferNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'RECEIVED'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                              : t.status === 'DISPATCHED'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 animate-pulse'
                              : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-stone-800 dark:text-zinc-300 font-semibold">
                        {t.items.map((i: any) => `${i.ingredient?.name}: ${i.dispatchedQty || i.requestedQty} ${i.unit?.symbol || i.ingredient?.baseUnit?.symbol}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-1">
                        Dispatched by: {t.approvedBy?.name || t.requestedBy?.name} • Notes: {t.notes || 'None'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.status === 'REQUESTED' && isMainStorekeeper && (
                        <button
                          onClick={() => handleDispatch(t.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
                        >
                          Approve & Dispatch
                        </button>
                      )}
                      {t.status === 'DISPATCHED' && isKitchenReceiver && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmKitchenReceipt(t.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRejectKitchenReceipt(t.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                            title="Reject delivery"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RECIPE STUDIO (CARD FORMAT) */}
        {activeTab === 'recipes' && (() => {
          const itemsWithRecipe = menuItems.filter((i) => i.recipe?.ingredients?.length > 0);
          const itemsWithoutRecipe = menuItems.filter((i) => !i.recipe?.ingredients?.length && !i.isDirectSale);

          const filteredDishes = menuItems.filter((item) => {
            if (recipeDishFilter === 'MISSING' && (item.recipe?.ingredients?.length > 0 || item.isDirectSale)) return false;
            if (recipeDishFilter === 'CONFIGURED' && !item.recipe?.ingredients?.length) return false;
            if (recipeDishSearch.trim()) {
              const q = recipeDishSearch.toLowerCase();
              const nameMatch = item.name.toLowerCase().includes(q);
              const catMatch = item.category?.name?.toLowerCase().includes(q);
              return nameMatch || catMatch;
            }
            return true;
          });

          return (
            <div className="space-y-4">
              {/* Recipe Studio Top Banner with Quick Actions */}
              <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white flex items-center gap-2 font-heading">
                    <ChefHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Culinary Recipe Studio & Costing Engine</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 bg-stone-100 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 px-2.5 sm:px-3 py-1.5 rounded-2xl text-[11px] sm:text-xs">
                    <span className="text-stone-600 dark:text-zinc-400">Configured:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{itemsWithRecipe.length}</strong>
                    <span className="text-stone-300 dark:text-zinc-600">|</span>
                    <span className="text-stone-600 dark:text-zinc-400">Needs Recipe:</span>
                    <strong className="text-amber-800 dark:text-amber-400 font-bold">{itemsWithoutRecipe.length}</strong>
                  </div>

                  {isOwnerOrManager && (
                    <button
                      onClick={() => {
                        if (!selectedRecipeItem && menuItems.length > 0) {
                          setSelectedRecipeItem(itemsWithoutRecipe[0] || menuItems[0]);
                        }
                        setRecipeModalOpen(true);
                      }}
                      className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>+ Add / Build Recipe</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Main Grid: Left Dish Picker & Right Recipe Canvas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left: Dish Selector with Search & Filter Tabs */}
                <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-heading">
                      Select Dish ({filteredDishes.length})
                    </h3>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search dishes to configure..."
                      value={recipeDishSearch}
                      onChange={(e) => setRecipeDishSearch(e.target.value)}
                      className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    <button
                      onClick={() => setRecipeDishFilter('ALL')}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                        recipeDishFilter === 'ALL'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-stone-100 text-stone-600 hover:text-stone-950'
                      }`}
                    >
                      All ({menuItems.length})
                    </button>
                    <button
                      onClick={() => setRecipeDishFilter('MISSING')}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                        recipeDishFilter === 'MISSING'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-stone-100 text-stone-600 hover:text-stone-950'
                      }`}
                    >
                      Needs Recipe ({itemsWithoutRecipe.length})
                    </button>
                    <button
                      onClick={() => setRecipeDishFilter('CONFIGURED')}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                        recipeDishFilter === 'CONFIGURED'
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-stone-100 text-stone-600 hover:text-stone-950'
                      }`}
                    >
                      Configured ({itemsWithRecipe.length})
                    </button>
                  </div>

                  {/* Dish Buttons List */}
                  <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                    {filteredDishes.length === 0 ? (
                      <div className="text-center py-8 text-xs text-stone-500 dark:text-zinc-500">
                        No dishes match your filter
                      </div>
                    ) : (
                      filteredDishes.map((item) => {
                        const hasRecipe = (item.recipe?.ingredients?.length || 0) > 0;
                        const isSelected = selectedRecipeItem?.id === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedRecipeItem(item)}
                            className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white font-black shadow-xs'
                                : 'bg-stone-50 dark:bg-white/[0.02] hover:bg-stone-100 dark:hover:bg-white/[0.05] text-stone-900 dark:text-white border border-stone-200 dark:border-white/5'
                            }`}
                          >
                            <div className="min-w-0 flex-1 mr-2">
                              <div className="text-xs font-bold truncate">{item.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[9px] font-semibold ${isSelected ? 'text-white/80' : 'text-stone-500 dark:text-zinc-400'}`}>
                                  {item.category?.name || 'Dish'}
                                </span>
                                {hasRecipe ? (
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'}`}>
                                    ✓ {item.recipe.ingredients.length} items
                                  </span>
                                ) : (
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20 text-white border border-white/30' : 'bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'}`}>
                                    + Add Recipe
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-extrabold flex-shrink-0">{Number(item.price).toFixed(2)} ETB</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right 2 cols: Exact Recipe Gram Breakdown (Card Format) */}
                <div className="lg:col-span-2 bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                  {selectedRecipeItem ? (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-stone-200 dark:border-white/10 gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white font-heading break-words">
                            {selectedRecipeItem.name}
                          </h3>
                          {selectedRecipeItem.recipe?.ingredients?.length > 0 ? (
                            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Recipe Configured
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                              No Recipe Set
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                          <div className="text-left sm:text-right">
                            <div className="text-[10px] sm:text-xs text-stone-500 dark:text-zinc-400 uppercase font-semibold">Selling Price</div>
                            <div className="text-lg sm:text-xl font-extrabold text-amber-800 dark:text-amber-400">
                              {Number(selectedRecipeItem.price).toFixed(2)} ETB
                            </div>
                          </div>

                          {isOwnerOrManager && (
                            <button
                              onClick={() => setRecipeModalOpen(true)}
                              className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                            >
                              <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{selectedRecipeItem.recipe?.ingredients?.length > 0 ? 'Edit Recipe Grams' : '+ Add Recipe Now'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Margin Banner - Only Owner sees Gross Profit and Margin % Analysis */}
                      {isOwner ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6 bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/10 p-3 sm:p-4 rounded-2xl">
                          <div>
                            <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Portion Food Cost</div>
                            <div className="text-sm sm:text-base font-extrabold text-[#C11221] break-words">
                              {selectedRecipeItem.costPerPortion?.toFixed(4) || '0.00'} ETB
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Gross Margin</div>
                            <div className="text-sm sm:text-base font-extrabold text-amber-800 dark:text-amber-400 break-words">
                              {selectedRecipeItem.grossProfitEstimate?.toFixed(2) || '0.00'} ETB
                            </div>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Target Margin %</div>
                            <div className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                              {selectedRecipeItem.marginPercent?.toFixed(1) || 0}%
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-6 bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/10 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Standard Production Yield</div>
                            <div className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white mt-0.5">
                              {selectedRecipeItem.recipe?.yieldPortions || 1} Portion(s) per recipe batch
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Kitchen Section</div>
                            <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase mt-0.5">
                              {selectedRecipeItem.prepSection?.replace('_', ' ') || 'HOT KITCHEN'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Ingredients Requirements (Card Format) */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider font-heading">
                            Production Ingredient Requirements ({selectedRecipeItem.recipe?.ingredients?.length || 0} items)
                          </h4>
                          {isOwnerOrManager && selectedRecipeItem.recipe?.ingredients?.length > 0 && (
                            <button
                              onClick={() => setRecipeModalOpen(true)}
                              className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add More Ingredients</span>
                            </button>
                          )}
                        </div>

                        {selectedRecipeItem.isDirectSale ? (
                          <div className="p-4 sm:p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-xs text-amber-900 dark:text-amber-300">
                            This item is a <strong>direct retail sale</strong> (bottled drink). Deducts directly from stock upon sale.
                          </div>
                        ) : selectedRecipeItem.recipe?.ingredients?.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                            {selectedRecipeItem.recipe.ingredients.map((ri: any) => {
                              const unitCost = Number(ri.ingredient?.currentCostPerBaseUnit || 0);
                              const lineCost = unitCost * Number(ri.quantity || 0);
                              return (
                                <div
                                  key={ri.id}
                                  className="p-3 bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/5 hover:border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-xs text-stone-900 dark:text-white truncate">{ri.ingredient?.name}</div>
                                    <div className="text-[10px] text-stone-500 dark:text-zinc-400 mt-0.5">
                                      {unitCost.toFixed(4)} ETB / {ri.unit?.symbol || ri.ingredient?.baseUnit?.symbol}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-xs font-black text-amber-800 dark:text-amber-400">
                                      {Number(ri.quantity)} {ri.unit?.symbol || ri.ingredient?.baseUnit?.symbol}
                                    </div>
                                    <div className="text-[10px] font-bold text-stone-700 dark:text-zinc-300">
                                      {lineCost.toFixed(4)} ETB
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 bg-stone-50 dark:bg-white/[0.02] rounded-3xl text-center space-y-3 border border-dashed border-stone-300 dark:border-white/10">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                              <ChefHat className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-stone-900 dark:text-white">No recipe configured yet for {selectedRecipeItem.name}</h4>
                            </div>
                            {isOwnerOrManager && (
                              <button
                                onClick={() => setRecipeModalOpen(true)}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" />
                                <span>+ Add Recipe for {selectedRecipeItem.name}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-xs text-stone-500 dark:text-zinc-500">
                      Select a dish from the left list to view or add its recipe.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 4: SUPPLIERS & BULK PURCHASES */}
        {activeTab === 'purchases' && (
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10 gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white font-heading">Suppliers & Goods Receipt</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setNewSupplierModalOpen(true)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-900 dark:text-white font-bold rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Register Supplier</span>
                </button>
                <button
                  onClick={() => setPurchaseModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Record Supplier Bulk Delivery</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="p-4 bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/10 rounded-2xl space-y-2 hover:border-amber-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white">{sup.name}</h4>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Supplier
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 dark:text-zinc-400">
                    Contact: {sup.contactPerson || 'N/A'} • {sup.phone || 'N/A'}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-zinc-500 truncate">{sup.address || 'No address registered'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: KITCHEN WASTAGE LOGGER */}
        {activeTab === 'wastage' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-3xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 dark:text-white font-heading mb-4">Record Kitchen Wastage & Spoilage</h3>

            {wasteSuccess && (
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 p-3 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-400">
                Wastage recorded successfully in the ledger!
              </div>
            )}

            <form onSubmit={handleRecordWastage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Kitchen Ingredient
                </label>
                <select
                  value={wasteIngredientId}
                  onChange={(e) => setWasteIngredientId(e.target.value)}
                  required
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="" className="bg-white dark:bg-[#1C1815] text-stone-500 dark:text-zinc-400">Select ingredient...</option>
                  {kitchenStoreLoc?.balances?.map((b: any) => (
                    <option key={b.ingredient.id} value={b.ingredient.id} className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white font-bold">
                      {b.ingredient.name} (Available: {b.quantity} {b.ingredient.baseUnit.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Quantity to Waste (in grams / ml / pcs)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 200"
                  value={wasteQuantity}
                  onChange={(e) => setWasteQuantity(e.target.value)}
                  required
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Reason for Wastage
                </label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 dark:text-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="Overcooked / Burnt dish" className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white">Overcooked / Burnt dish</option>
                  <option value="Accidental Spillage" className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white">Accidental Spillage</option>
                  <option value="Expired / Past fresh date" className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white">Expired / Past fresh date</option>
                  <option value="Quality check failure" className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white">Quality check failure</option>
                  <option value="Customer Return" className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white">Customer Return</option>
                  <option value="Other" className="bg-white dark:bg-[#1C1815] text-stone-900 dark:text-white">Other (Specify below)</option>
                </select>
              </div>

              {wasteReason === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Specify Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Broken storage jar, power outage thawing..."
                    value={customWasteReason}
                    onChange={(e) => setCustomWasteReason(e.target.value)}
                    required
                    className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#C11221] hover:bg-[#A30F1C] text-white font-extrabold text-xs rounded-2xl shadow-xs transition cursor-pointer"
              >
                Commit Wastage to Ledger
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: IMMUTABLE AUDIT LEDGER (CARD FORMAT) */}
        {activeTab === 'ledger' && (() => {
          const filteredLedger = ledger.filter((row) => {
            if (ledgerTypeFilter !== 'ALL') {
              if (ledgerTypeFilter === 'TRANSFER') {
                if (!row.transactionType.includes('TRANSFER')) return false;
              } else if (row.transactionType !== ledgerTypeFilter) {
                return false;
              }
            }
            if (ledgerSearch.trim()) {
              const q = ledgerSearch.toLowerCase();
              const matchName = row.ingredient?.name?.toLowerCase().includes(q);
              const matchRef = row.referenceId?.toLowerCase().includes(q);
              const matchReason = row.reason?.toLowerCase().includes(q);
              if (!matchName && !matchRef && !matchReason) return false;
            }
            return true;
          });

          return (
            <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-white/10">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white font-heading">Immutable Inventory Transaction Ledger</h3>
                </div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400">{filteredLedger.length} of {ledger.length} entries</span>
              </div>

              {/* Filter Strip: Type buttons & Search Input */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {[
                    { id: 'ALL', label: 'All Events' },
                    { id: 'PRODUCTION_CONSUMPTION', label: '🍳 Kitchen Production' },
                    { id: 'TRANSFER', label: '📦 Transfers' },
                    { id: 'PURCHASE_RECEIPT', label: '🛒 Purchases' },
                    { id: 'WASTAGE', label: '🗑️ Wastage' },
                    { id: 'MANUAL_ADJUSTMENT', label: '⚙️ Adjustments' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setLedgerTypeFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs ${
                        ledgerTypeFilter === f.id
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'bg-stone-100 border border-stone-200 text-stone-700 hover:text-stone-950'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search ingredient, #order..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Transaction Cards Grid (Card Format) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredLedger.map((row) => (
                  <div
                    key={row.id}
                    className="p-3.5 bg-stone-50 dark:bg-white/[0.02] border border-stone-200 dark:border-white/10 hover:border-amber-500/30 rounded-2xl flex flex-col justify-between gap-2.5 transition shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            row.transactionType === 'PRODUCTION_CONSUMPTION'
                              ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30'
                              : row.transactionType === 'WASTAGE'
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                              : row.transactionType === 'TRANSFER_RECEIVE'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                              : row.transactionType === 'TRANSFER_DISPATCH'
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                              : row.transactionType === 'PURCHASE_RECEIPT'
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30'
                              : 'bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-300 dark:border-white/10'
                          }`}
                        >
                          {row.transactionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-zinc-500">
                          {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-stone-900 dark:text-white truncate">{row.ingredient?.name}</div>

                      <div className="text-[11px] text-stone-600 dark:text-zinc-400 mt-1 flex items-center justify-between">
                        <span>Quantity:</span>
                        <span className="font-bold text-amber-800 dark:text-amber-400">
                          {Number(row.quantity).toLocaleString()} {row.ingredient?.baseUnit?.symbol}
                        </span>
                      </div>

                      <div className="text-[10px] text-stone-500 dark:text-zinc-500 truncate mt-1">
                        Reason: {row.reason || row.referenceId || 'N/A'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 dark:border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500 dark:text-zinc-400">By {row.user?.name || 'Staff'}</span>
                      <span className="font-black text-stone-900 dark:text-white">
                        {Number(row.totalCost).toFixed(2)} ETB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* QUICK STOCK ADJUSTMENT MODAL (Add or Remove stock directly) */}
      {adjustModalOpen && adjustIngredient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl text-stone-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${adjustMode === 'ADD' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-700 dark:text-rose-400'}`}>
                  {adjustMode === 'ADD' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white font-heading">
                    {adjustMode === 'ADD' ? 'Add Stock Amount' : 'Remove Stock Amount'}
                  </h3>
                  <div className="text-xs text-stone-500 dark:text-zinc-400">
                    {adjustLocationType === 'MAIN_STORE' ? 'Main Store (Bulk)' : 'Kitchen Store (Production floor)'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCommitAdjust} className="space-y-4">
              <div className="p-3 bg-stone-50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-900 dark:text-white">{adjustIngredient.name}</div>
                  <div className="text-[10px] text-stone-500 dark:text-zinc-400">Unit: {adjustIngredient.baseUnit?.symbol}</div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${adjustMode === 'ADD' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'}`}>
                    {adjustMode}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Quantity to {adjustMode === 'ADD' ? 'Add' : 'Remove'} ({adjustIngredient.baseUnit?.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 5000"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory count correction"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className={`px-5 py-2.5 font-black rounded-2xl text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer ${
                    adjustMode === 'ADD'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white'
                      : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white'
                  }`}
                >
                  <span>{adjustSubmitting ? 'Updating...' : `Commit ${adjustMode === 'ADD' ? 'Addition' : 'Deduction'}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIRECT BATCH SEND TO KITCHEN MODAL (Main Storekeeper dispatches multiple items in 1 batch) */}
      {sendDirectModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl p-6 w-full max-w-2xl shadow-2xl text-stone-900 dark:text-white space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-heading">Deliver Batch to Kitchen</h3>
                </div>
              </div>
              <button
                onClick={() => setSendDirectModalOpen(false)}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search & Filter */}
            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-400" />
              <input
                type="text"
                placeholder="Search main store stock (e.g. Flour, Milk, Beef, Sugar)..."
                value={sendSearch}
                onChange={(e) => setSendSearch(e.target.value)}
                className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Main Store Stock List with Live Quantity Inputs */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-0">
              {mainStoreLoc?.balances
                ?.filter((b: any) =>
                  !sendSearch ||
                  b.ingredient.name.toLowerCase().includes(sendSearch.toLowerCase()) ||
                  b.ingredient.category.toLowerCase().includes(sendSearch.toLowerCase()),
                )
                .map((b: any) => {
                  const qtyVal = batchQuantities[b.ingredient.id] || '';
                  const hasQty = parseFloat(qtyVal) > 0;
                  const unitSymbol = b.ingredient.baseUnit?.symbol || 'units';

                  return (
                    <div
                      key={b.ingredient.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        hasQty
                          ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 shadow-xs'
                          : 'bg-stone-50 dark:bg-white/[0.03] border-stone-200 dark:border-white/10 hover:bg-stone-100/70 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-stone-900 dark:text-white truncate" title={b.ingredient.name}>
                              {b.ingredient.name}
                            </span>
                            <span className="text-[10px] bg-stone-200/80 dark:bg-white/10 text-stone-600 dark:text-zinc-400 px-2 py-0.5 rounded-md font-semibold whitespace-nowrap">
                              {b.ingredient.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                            Available in Main:{' '}
                            <span className="font-bold text-stone-800 dark:text-zinc-200">
                              {b.quantity} {unitSymbol}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max={b.quantity}
                              placeholder="Qty to send"
                              value={qtyVal}
                              onChange={(e) =>
                                setBatchQuantities((prev) => ({
                                  ...prev,
                                  [b.ingredient.id]: e.target.value,
                                }))
                              }
                              className={`w-28 sm:w-32 bg-white dark:bg-black/30 border rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-right focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                hasQty
                                  ? 'border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                                  : 'border-stone-300 dark:border-white/10 text-stone-900 dark:text-white placeholder-stone-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                              }`}
                            />
                            <span className="absolute right-2.5 text-[10px] font-semibold text-stone-400 dark:text-zinc-400 pointer-events-none select-none">
                              {unitSymbol}
                            </span>
                          </div>
                          {hasQty && (
                            <button
                              type="button"
                              onClick={() =>
                                setBatchQuantities((prev) => {
                                  const next = { ...prev };
                                  delete next[b.ingredient.id];
                                  return next;
                                })
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 text-sm font-bold transition cursor-pointer shrink-0"
                              title="Clear quantity"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Form Actions */}
            <form onSubmit={handleSendBatchToKitchen} className="space-y-3 pt-3 border-t border-stone-200 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div className="text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="font-bold text-stone-900 dark:text-white">
                    {
                      Object.entries(batchQuantities).filter(([_, q]) => parseFloat(q) > 0).length
                    }{' '}
                    items
                  </span>{' '}
                  queued for delivery
                </div>
                {Object.entries(batchQuantities).filter(([_, q]) => parseFloat(q) > 0).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBatchQuantities({})}
                    className="text-[11px] text-rose-500 dark:text-rose-400 hover:underline cursor-pointer font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Delivery Notes / Instructions (e.g. Morning kitchen prep batch)..."
                value={sendNotes}
                onChange={(e) => setSendNotes(e.target.value)}
                className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2 text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSendDirectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    sendSubmitting ||
                    Object.entries(batchQuantities).filter(([_, q]) => parseFloat(q) > 0).length === 0
                  }
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {sendSubmitting
                      ? 'Dispatching Batch...'
                      : `Deliver Batch to Kitchen (${
                          Object.entries(batchQuantities).filter(([_, q]) => parseFloat(q) > 0).length
                        } items)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THRESHOLD CUTOFF SETTINGS MODAL (Owner sets alert levels for Kitchen & Main Store) */}
      {thresholdModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl p-6 w-full max-w-2xl shadow-2xl text-stone-900 dark:text-white space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-heading">Low-Stock Alert Cutoffs</h3>
                </div>
              </div>
              <button
                onClick={() => setThresholdModalOpen(false)}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-400" />
              <input
                type="text"
                placeholder="Search ingredients to set alert cutoffs..."
                value={thresholdSearch}
                onChange={(e) => setThresholdSearch(e.target.value)}
                className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-0">
              {Array.from(
                new Map(
                  locations
                    .flatMap((l) => l.balances || [])
                    .map((b: any) => [b.ingredient.id, b.ingredient]),
                ).values(),
              )
                .filter(
                  (ing: any) =>
                    !thresholdSearch ||
                    ing.name.toLowerCase().includes(thresholdSearch.toLowerCase()) ||
                    ing.category.toLowerCase().includes(thresholdSearch.toLowerCase()),
                )
                .map((ing: any) => {
                  const state = editingThresholds[ing.id] || {
                    main: String(ing.reorderThresholdMain ?? 1000),
                    kitchen: String(ing.reorderThresholdKitchen ?? 200),
                  };
                  const unitSymbol = ing.baseUnit?.symbol || 'units';
                  const isSaving = savingThresholdId === ing.id;

                  return (
                    <div
                      key={ing.id}
                      className="p-3 bg-stone-50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-100 dark:hover:bg-white/[0.05] transition shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 dark:text-white">{ing.name}</div>
                        <div className="text-[10px] text-stone-500 dark:text-zinc-400">{ing.category} • Base Unit: {unitSymbol}</div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex flex-col">
                          <label className="text-[9px] text-stone-600 dark:text-zinc-400 uppercase font-bold">Kitchen Alert (&le;)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={state.kitchen}
                              onChange={(e) =>
                                setEditingThresholds((prev) => ({
                                  ...prev,
                                  [ing.id]: { ...state, kitchen: e.target.value },
                                }))
                              }
                              className="w-20 bg-white dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl px-2 py-1 text-xs font-bold text-amber-800 dark:text-amber-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                            />
                            <span className="text-[10px] text-stone-500 dark:text-zinc-500">{unitSymbol}</span>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[9px] text-stone-600 dark:text-zinc-400 uppercase font-bold">Main Alert (&le;)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={state.main}
                              onChange={(e) =>
                                setEditingThresholds((prev) => ({
                                  ...prev,
                                  [ing.id]: { ...state, main: e.target.value },
                                }))
                              }
                              className="w-20 bg-white dark:bg-black/40 border border-stone-300 dark:border-white/10 rounded-xl px-2 py-1 text-xs font-bold text-amber-800 dark:text-amber-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                            />
                            <span className="text-[10px] text-stone-500 dark:text-zinc-500">{unitSymbol}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveThreshold(ing.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition self-end sm:self-center cursor-pointer disabled:opacity-50"
                        >
                          {isSaving ? '...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-stone-200 dark:border-white/10 flex-shrink-0">
              <button
                type="button"
                onClick={() => setThresholdModalOpen(false)}
                className="px-5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-800 dark:text-white font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecipeEditorModal
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        menuItem={selectedRecipeItem}
        allMenuItems={menuItems}
        onRecipeSaved={loadData}
        onOpenCreateStockItem={handleOpenCreateStockItem}
      />

      <PurchaseOrderModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onPurchaseRecorded={loadData}
        currentUserId={currentUser.id}
      />

      {/* STOCK ITEM CREATE & EDIT MODAL */}
      <StockItemModal
        isOpen={stockItemModalOpen}
        onClose={() => setStockItemModalOpen(false)}
        item={editingStockItem}
        units={units}
        onSaved={loadData}
      />

      {/* DELETE / ARCHIVE STOCK ITEM CONFIRMATION DIALOG */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-stone-900 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-stone-900">Delete Stock Item</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Are you sure you want to delete <strong className="text-stone-800 font-bold">&quot;{deleteConfirmItem.name}&quot;</strong>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={deletingItem}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteStockItem}
                disabled={deletingItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingItem ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT KITCHEN RECEIPT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-stone-900 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-stone-900">Reject Delivery</h3>
              <p className="text-xs text-stone-500 mt-1">
                Enter the reason for rejecting this delivery (damaged, quantity mismatch):
              </p>
            </div>

            <input
              type="text"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
              placeholder="e.g. Quantity mismatch, damaged packages..."
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                disabled={rejecting}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRejectKitchenReceipt}
                disabled={rejecting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{rejecting ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating In-App Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[120] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border transition-all animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
      {/* REGISTER SUPPLIER MODAL */}
      {newSupplierModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-md shadow-2xl text-stone-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Register New Supplier</h3>
                </div>
              </div>
              <button
                onClick={() => setNewSupplierModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Supplier / Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="e.g. Oromia Coffee Farmers Union"
                  className="w-full bg-white border border-stone-300 rounded-2xl px-3.5 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    placeholder="e.g. Abebe K."
                    className="w-full bg-white border border-stone-300 rounded-2xl px-3.5 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="e.g. +251 91 123 4567"
                    className="w-full bg-white border border-stone-300 rounded-2xl px-3.5 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  placeholder="e.g. orders@supplier.et"
                  className="w-full bg-white border border-stone-300 rounded-2xl px-3.5 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Warehouse / Physical Address
                </label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="e.g. Merkato Block 4, Addis Ababa"
                  className="w-full bg-white border border-stone-300 rounded-2xl px-3.5 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setNewSupplierModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={supSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {supSubmitting ? 'Saving...' : 'Register Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
