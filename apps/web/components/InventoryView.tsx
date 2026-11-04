'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi } from '@/lib/api';
import { RecipeEditorModal } from '@/components/RecipeEditorModal';
import { PurchaseOrderModal } from '@/components/PurchaseOrderModal';
import {
  Boxes,
  ArrowRightLeft,
  ChefHat,
  Trash2,
  AlertTriangle,
  History,
  Send,
  CheckCircle,
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
  Search
} from 'lucide-react';

export function InventoryView() {
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'balances' | 'transfers' | 'recipes' | 'purchases' | 'wastage' | 'ledger'>('balances');
  const [locations, setLocations] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<any | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Modals
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

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

  // Threshold Settings Modal State (Owner adjusts cutoff levels)
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

  // Wastage form state
  const [wasteIngredientId, setWasteIngredientId] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('');
  const [wasteReason, setWasteReason] = useState('Spoilage / Expired');
  const [wasteSuccess, setWasteSuccess] = useState(false);

  const loadData = () => {
    const roleParam = currentUser?.role ? `?role=${currentUser.role}` : '';
    fetchApi(`/inventory/balances${roleParam}`).then(setLocations);
    fetchApi(`/inventory/transfers${roleParam}`).then(setTransfers);
    fetchApi(`/inventory/alerts${roleParam}`).then(setAlerts);
    fetchApi('/inventory/ledger').then(setLedger);
    fetchApi('/inventory/suppliers').then(setSuppliers);
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
      alert('Please enter a valid positive quantity');
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
      loadData();
    } catch (err: any) {
      alert(`Error adjusting stock: ${err.message}`);
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
      alert('Please enter a delivery quantity for at least one item.');
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
      loadData();
    } catch (err: any) {
      alert(`Error dispatching batch to kitchen: ${err.message}`);
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
      loadData();
    } catch (e: any) {
      alert(`Error confirming receipt: ${e.message}`);
    }
  };

  // Kitchen Chef rejects incoming transfer -> returns stock back to Main Store
  const handleRejectKitchenReceipt = async (transferId: string) => {
    const reason = window.prompt(
      'Enter reason for rejecting this delivery (e.g. damaged goods, quantity mismatch, wrong items):',
      'Quantity mismatch / damaged goods',
    );
    if (reason === null) return;

    try {
      await fetchApi(`/inventory/transfers/${transferId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          rejectedById: currentUser?.id,
          reason: reason.trim() || 'Rejected by Head Chef',
        }),
      });
      loadData();
    } catch (e: any) {
      alert(`Error rejecting delivery: ${e.message}`);
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
      loadData();
    } catch (e: any) {
      alert(`Error updating threshold: ${e.message}`);
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
      loadData();
    } catch (e: any) {
      alert(`Error dispatching transfer: ${e.message}`);
    }
  };

  const handleRecordWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteIngredientId || !wasteQuantity) return;
    try {
      await fetchApi('/inventory/wastage', {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id || 'k01-storekeeper',
          ingredientId: wasteIngredientId,
          quantity: parseFloat(wasteQuantity),
          reason: wasteReason,
        }),
      });
      setWasteQuantity('');
      setWasteSuccess(true);
      setTimeout(() => setWasteSuccess(false), 3000);
      loadData();
    } catch (err: any) {
      alert(`Error recording wastage: ${err.message}`);
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
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] overflow-hidden bg-[#0D0B0A] text-white">
      {/* Top Inventory Header */}
      <div className="bg-[#12100E]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-zinc-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white font-heading tracking-wide">
              {isHeadChefOnly ? 'Kitchen Pantry Stock & Requisitions' : 'Dual-Store Inventory & Recipe Engine'}
            </h2>
            <div className="text-xs text-zinc-400">
              {isHeadChefOnly
                ? 'Kitchen Store (Production Floor) • Managed by Head Chef'
                : 'Main Store (Bulk) ➔ Kitchen Store (Cooking floor) with live transfer reconciliation'}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'balances'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Store Balances
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              Recipe Studio
            </button>
          )}

          {isMainStorekeeper && (
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'purchases'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Suppliers & POs
            </button>
          )}

          {isKitchenChef && (
            <button
              onClick={() => setActiveTab('wastage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'wastage'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Wastage Log
            </button>
          )}

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Ledger
          </button>
        </div>
      </div>

      {/* Main Tab Contents */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto no-scrollbar">
        {/* TAB 1: STORE BALANCES */}
        {activeTab === 'balances' && (
          <div className="space-y-6">
            {/* Low-stock Warning System */}
            {(kitchenLowStockItems.length > 0 || mainLowStockItems.length > 0 || alerts.length > 0) && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-3xl space-y-3 shadow-lg shadow-amber-950/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        {isHeadChefOnly
                          ? 'Kitchen Low-Stock Alert'
                          : isMainStorekeeper && !isOwnerOrManager
                          ? 'Main Warehouse Low-Stock Alert'
                          : 'Store Low-Stock Alert System'}
                      </h4>
                      <div className="text-xs text-amber-200">
                        {isHeadChefOnly ? (
                          <span>
                            <strong className="text-amber-400">{kitchenLowStockItems.length}</strong> ingredient(s) are running below the kitchen alert cutoff!
                          </span>
                        ) : isMainStorekeeper && !isOwnerOrManager ? (
                          <span>
                            <strong className="text-amber-400">{mainLowStockItems.length}</strong> bulk item(s) are running below warehouse alert cutoff!
                          </span>
                        ) : (
                          <span>
                            Kitchen Floor: <strong className="text-amber-400">{kitchenLowStockItems.length} low</strong> • Main Warehouse: <strong className="text-amber-400">{mainLowStockItems.length} low</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isOwnerOrManager && (
                      <button
                        onClick={handleOpenThresholdModal}
                        className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Set Alert Cutoffs</span>
                      </button>
                    )}
                    {!isHeadChefOnly && (
                      <button
                        onClick={() => setPurchaseModalOpen(true)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer"
                      >
                        Receive Bulk PO
                      </button>
                    )}
                    {!isHeadChefOnly && (
                      <button
                        onClick={() => setSendDirectModalOpen(true)}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition border border-white/10 cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3 text-amber-400" />
                        <span>Deliver to Kitchen</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details chip list of low items */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/10">
                  {isHeadChefOnly
                    ? kitchenLowStockItems.map((b: any) => (
                        <span
                          key={b.ingredient.id}
                          className="bg-black/30 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] text-zinc-300 flex items-center gap-1.5"
                        >
                          <span className="font-bold text-white">{b.ingredient.name}:</span>
                          <span className="text-amber-400 font-black">{b.quantity} {b.ingredient.baseUnit?.symbol}</span>
                          <span className="text-zinc-500">(Cutoff: {b.ingredient.reorderThresholdKitchen} {b.ingredient.baseUnit?.symbol})</span>
                        </span>
                      ))
                    : (isMainStorekeeper && !isOwnerOrManager ? mainLowStockItems : [...kitchenLowStockItems.map((k: any) => ({ ...k, storeLabel: 'Kitchen' })), ...mainLowStockItems.map((m: any) => ({ ...m, storeLabel: 'Main' }))]).map((b: any, idx: number) => (
                        <span
                          key={`${b.ingredient.id}-${idx}`}
                          className="bg-black/30 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] text-zinc-300 flex items-center gap-1.5"
                        >
                          {b.storeLabel && (
                            <span className={`px-1 py-0.2 rounded text-[9px] font-black ${b.storeLabel === 'Kitchen' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {b.storeLabel}
                            </span>
                          )}
                          <span className="font-bold text-white">{b.ingredient.name}:</span>
                          <span className="text-amber-400 font-black">{b.quantity} {b.ingredient.baseUnit?.symbol}</span>
                        </span>
                      ))}
                </div>
              </div>
            )}

            {/* PENDING KITCHEN CONFIRMATION BANNER (For Head Chef) */}
            {isKitchenChef && pendingKitchenReceipts.length > 0 && (
              <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900/90 to-amber-950/40 border border-amber-500/40 p-4 rounded-3xl shadow-2xl backdrop-blur-xl animate-in fade-in">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black animate-bounce shadow-lg shadow-amber-500/30">
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Incoming Deliveries from Main Storekeeper</span>
                        <span className="bg-[#C11221] text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                          {pendingKitchenReceipts.length} Pending Confirmation
                        </span>
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Main store stock has already been deducted. Cook head chef confirmation adds stock to the Kitchen.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingKitchenReceipts.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 bg-white/[0.04] border border-white/10 rounded-2xl flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-white">{t.transferNumber}</span>
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                            In-Transit
                          </span>
                        </div>
                        <div className="text-xs text-zinc-300 font-semibold mb-1">
                          {t.items.map((i: any) => `${i.ingredient?.name}: ${i.dispatchedQty || i.requestedQty} ${i.unit?.symbol || i.ingredient?.baseUnit?.symbol}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Dispatched by {t.approvedBy?.name || 'Main Storekeeper'} • Notes: {t.notes || 'Direct dispatch'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmKitchenReceipt(t.id)}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Accept & Add to Kitchen</span>
                        </button>
                        <button
                          onClick={() => handleRejectKitchenReceipt(t.id)}
                          className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1"
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

            {/* Store Balances Grid */}
            <div className={`grid gap-6 ${isHeadChefOnly ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {/* Store 1: Main Store (Bulk Warehouse) - NEVER shown to Head Chef / Kitchen Staff */}
              {!isHeadChefOnly && (
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 flex-shrink-0">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                        Main Store (Bulk Warehouse)
                      </h3>
                      <div className="text-xs text-zinc-400">Add/remove stock or dispatch directly to kitchen</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMainStorekeeper && (
                        <button
                          onClick={() => setSendDirectModalOpen(true)}
                          className="text-xs font-bold text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          title="Send items directly to kitchen floor"
                        >
                          <Send className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Send to Kitchen</span>
                        </button>
                      )}
                      <button
                        onClick={() => setPurchaseModalOpen(true)}
                        className="text-xs font-extrabold text-zinc-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>PO Delivery</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Store Cards List */}
                  <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1 no-scrollbar">
                    {mainStoreLoc?.balances?.map((b: any) => (
                      <div
                        key={b.id}
                        className="p-3 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">{b.ingredient.name}</div>
                          <div className="text-[10px] text-zinc-400 font-medium">
                            Valuation: {Number(b.ingredient.currentCostPerBaseUnit).toFixed(4)} ETB / {b.ingredient.baseUnit.symbol}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-white">
                              {Number(b.quantity).toLocaleString()} {b.ingredient.baseUnit.symbol}
                            </div>
                            <div className="text-[10px] font-bold text-amber-400">
                              {(Number(b.quantity) * Number(b.ingredient.currentCostPerBaseUnit)).toFixed(2)} ETB
                            </div>
                          </div>

                          {/* Storekeeper Controls: Add Stock, Remove Stock, Send to Kitchen */}
                          {isMainStorekeeper && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenAdjust(b.ingredient, 'MAIN_STORE', 'ADD')}
                                className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl transition cursor-pointer"
                                title="Add amount to Main Store stock"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(b.ingredient, 'MAIN_STORE', 'REMOVE')}
                                className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer"
                                title="Remove amount from Main Store stock"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setBatchQuantities((prev) => ({ ...prev, [b.ingredient.id]: prev[b.ingredient.id] || '' }));
                                  setSendDirectModalOpen(true);
                                }}
                                className="p-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-xl transition cursor-pointer"
                                title="Send this ingredient to Kitchen Store"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Store 2: Kitchen Store (Production Floor) */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C11221] shadow-sm shadow-red-500/50" />
                      Kitchen Store (Production Floor)
                    </h3>
                    <div className="text-xs text-zinc-400">Head Chef controlled: auto-deducted on food preparation</div>
                  </div>
                </div>

                {/* Kitchen Store Cards List */}
                <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1 no-scrollbar">
                  {kitchenStoreLoc?.balances?.map((b: any) => {
                    const isLow = Number(b.quantity) <= Number(b.ingredient.reorderThresholdKitchen);
                    return (
                      <div
                        key={b.id}
                        className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                          isLow
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="truncate">{b.ingredient.name}</span>
                            {isLow && (
                              <span className="text-[9px] bg-[#C11221] text-white font-extrabold px-1.5 py-0.5 rounded-md flex-shrink-0">
                                Low
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-medium">
                            Threshold: {b.ingredient.reorderThresholdKitchen} {b.ingredient.baseUnit.symbol}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-sm font-extrabold ${isLow ? 'text-amber-400' : 'text-white'}`}>
                              {Number(b.quantity).toLocaleString()} {b.ingredient.baseUnit.symbol}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-medium">
                              Ready for cooking
                            </div>
                          </div>

                          {/* Cook Head Chef Controls: Add Stock, Deduct Stock directly in Kitchen */}
                          {isKitchenChef && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenAdjust(b.ingredient, 'KITCHEN_STORE', 'ADD')}
                                className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl transition cursor-pointer"
                                title="Add/replenish kitchen stock"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(b.ingredient, 'KITCHEN_STORE', 'REMOVE')}
                                className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer"
                                title="Deduct kitchen stock (prep spillage/count correction)"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK TRANSFERS */}
        {activeTab === 'transfers' && (
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Stock Transfers Between Stores</h3>
                <p className="text-xs text-zinc-400">
                  Main Storekeeper sends stock ➔ In-Transit buffer ➔ Cook Head Chef confirms receipt into Kitchen Store
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isMainStorekeeper && (
                  <button
                    onClick={() => setSendDirectModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-zinc-950" />
                    <span>Direct Send to Kitchen</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {transfers.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">No transfer records found</div>
              ) : (
                transfers.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">{t.transferNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'RECEIVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : t.status === 'DISPATCHED'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-300 font-semibold">
                        {t.items.map((i: any) => `${i.ingredient?.name}: ${i.dispatchedQty || i.requestedQty} ${i.unit?.symbol || i.ingredient?.baseUnit?.symbol}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        Dispatched by: {t.approvedBy?.name || t.requestedBy?.name} • Notes: {t.notes || 'None'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.status === 'REQUESTED' && isMainStorekeeper && (
                        <button
                          onClick={() => handleDispatch(t.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer"
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
                            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
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
        {activeTab === 'recipes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Dish Selector */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 font-heading">
                Select Dish to Configure
              </h3>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRecipeItem(item)}
                    className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between transition cursor-pointer ${
                      selectedRecipeItem?.id === item.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-lg shadow-amber-500/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] text-white border border-white/5'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className={`text-[10px] ${selectedRecipeItem?.id === item.id ? 'text-zinc-900 font-semibold' : 'text-zinc-400'}`}>
                        {item.category?.name}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold">{Number(item.price).toFixed(2)} ETB</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right 2 cols: Exact Recipe Gram Breakdown (Card Format) */}
            <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              {selectedRecipeItem ? (
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                    <div>
                      <h3 className="text-lg font-bold text-white font-heading">{selectedRecipeItem.name}</h3>
                      <p className="text-xs text-zinc-400">
                        Gram-Level Production Costing & Margin Analysis
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-zinc-400 uppercase font-semibold">Selling Price</div>
                        <div className="text-xl font-extrabold text-amber-400">
                          {Number(selectedRecipeItem.price).toFixed(2)} ETB
                        </div>
                      </div>
                      <button
                        onClick={() => setRecipeModalOpen(true)}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Recipe Grams</span>
                      </button>
                    </div>
                  </div>

                  {/* Margin Banner */}
                  <div className="grid grid-cols-3 gap-3 mb-6 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
                    <div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Portion Food Cost</div>
                      <div className="text-base font-extrabold text-[#C11221]">
                        {selectedRecipeItem.costPerPortion?.toFixed(4) || '0.00'} ETB
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Gross Margin</div>
                      <div className="text-base font-extrabold text-amber-400">
                        {selectedRecipeItem.grossProfitEstimate?.toFixed(2) || '0.00'} ETB
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Target Margin %</div>
                      <div className="text-base font-extrabold text-emerald-400">
                        {selectedRecipeItem.marginPercent?.toFixed(1) || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Ingredients Requirements (Card Format) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-heading">
                      Production Ingredient Requirements (Card Format)
                    </h4>

                    {selectedRecipeItem.isDirectSale ? (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300">
                        This item is a <strong>direct retail sale</strong> (bottled drink). Deducts directly from stock upon sale.
                      </div>
                    ) : selectedRecipeItem.recipe?.ingredients?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                        {selectedRecipeItem.recipe.ingredients.map((ri: any) => {
                          const unitCost = Number(ri.ingredient.currentCostPerBaseUnit);
                          const lineCost = unitCost * Number(ri.quantity);
                          return (
                            <div
                              key={ri.id}
                              className="p-3 bg-white/[0.02] border border-white/5 hover:border-white/15 rounded-2xl flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-white truncate">{ri.ingredient.name}</div>
                                <div className="text-[10px] text-zinc-400 mt-0.5">
                                  {unitCost.toFixed(4)} ETB / {ri.unit?.symbol || ri.ingredient.baseUnit?.symbol}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs font-black text-amber-400">
                                  {Number(ri.quantity)} {ri.unit?.symbol || ri.ingredient.baseUnit?.symbol}
                                </div>
                                <div className="text-[10px] font-bold text-zinc-300">
                                  {lineCost.toFixed(4)} ETB
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 bg-white/[0.02] rounded-2xl text-center space-y-2 border border-white/5">
                        <p className="text-xs text-zinc-400">No recipe defined yet for this item.</p>
                        <button
                          onClick={() => setRecipeModalOpen(true)}
                          className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer"
                        >
                          Build Recipe Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 4: SUPPLIERS & BULK PURCHASES */}
        {activeTab === 'purchases' && (
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
              <div>
                <h3 className="text-base font-bold text-white font-heading">Suppliers & Goods Receipt</h3>
                <p className="text-xs text-zinc-400">
                  Bulk supplier purchases restock the Main Store and recalculate cost per gram automatically.
                </p>
              </div>
              <button
                onClick={() => setPurchaseModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 w-fit cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Record Supplier Bulk Delivery</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2 hover:border-white/20 transition"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{sup.name}</h4>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Supplier
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Contact: {sup.contactPerson || 'N/A'} • {sup.phone || 'N/A'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">{sup.address}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: KITCHEN WASTAGE LOGGER */}
        {activeTab === 'wastage' && (
          <div className="max-w-xl mx-auto bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white font-heading mb-1">Record Kitchen Wastage & Spoilage</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Track burnt dishes, spilled ingredients, or damaged stock. Deducts from Kitchen Store and records financial loss.
            </p>

            {wasteSuccess && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-xs font-bold text-emerald-400">
                Wastage recorded successfully in the ledger!
              </div>
            )}

            <form onSubmit={handleRecordWastage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Kitchen Ingredient
                </label>
                <select
                  value={wasteIngredientId}
                  onChange={(e) => setWasteIngredientId(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="" className="bg-[#1C1815] text-zinc-400">Select ingredient...</option>
                  {kitchenStoreLoc?.balances?.map((b: any) => (
                    <option key={b.ingredient.id} value={b.ingredient.id} className="bg-[#1C1815] text-white">
                      {b.ingredient.name} (Available: {b.quantity} {b.ingredient.baseUnit.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Quantity to Waste (in grams / ml / pcs)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 200"
                  value={wasteQuantity}
                  onChange={(e) => setWasteQuantity(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Reason for Wastage
                </label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Overcooked / Burnt dish" className="bg-[#1C1815] text-white">Overcooked / Burnt dish</option>
                  <option value="Accidental Spillage" className="bg-[#1C1815] text-white">Accidental Spillage</option>
                  <option value="Expired / Past fresh date" className="bg-[#1C1815] text-white">Expired / Past fresh date</option>
                  <option value="Quality check failure" className="bg-[#1C1815] text-white">Quality check failure</option>
                  <option value="Customer Return" className="bg-[#1C1815] text-white">Customer Return</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#C11221] hover:bg-[#A30F1C] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-950/40 transition cursor-pointer"
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
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Immutable Inventory Transaction Ledger</h3>
                  <p className="text-xs text-zinc-400">
                    Double-entry audit log of all receipts, direct transfers, kitchen consumption, adjustments & wastage.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-400">{filteredLedger.length} of {ledger.length} entries</span>
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
                          ? 'bg-amber-500 text-black font-black shadow-md'
                          : 'bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search ingredient, #order..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Transaction Cards Grid (Card Format) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredLedger.map((row) => (
                  <div
                    key={row.id}
                    className="p-3.5 bg-white/[0.02] border border-white/10 hover:border-amber-500/30 rounded-2xl flex flex-col justify-between gap-2.5 transition backdrop-blur-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            row.transactionType === 'PRODUCTION_CONSUMPTION'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : row.transactionType === 'WASTAGE'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : row.transactionType === 'TRANSFER_RECEIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : row.transactionType === 'TRANSFER_DISPATCH'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : row.transactionType === 'PURCHASE_RECEIPT'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-zinc-800 text-zinc-300 border border-white/10'
                          }`}
                        >
                          {row.transactionType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-white truncate">{row.ingredient?.name}</div>

                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                        <span>Quantity:</span>
                        <span className="font-bold text-amber-400">
                          {Number(row.quantity).toLocaleString()} {row.ingredient?.baseUnit?.symbol}
                        </span>
                      </div>

                      <div className="text-[10px] text-zinc-500 truncate mt-1">
                        Reason: {row.reason || row.referenceId || 'N/A'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">By {row.user?.name || 'Staff'}</span>
                      <span className="font-black text-white">
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
          <div className="bg-[#161311] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${adjustMode === 'ADD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {adjustMode === 'ADD' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    {adjustMode === 'ADD' ? 'Add Stock Amount' : 'Remove Stock Amount'}
                  </h3>
                  <div className="text-xs text-zinc-400">
                    {adjustLocationType === 'MAIN_STORE' ? 'Main Store (Bulk)' : 'Kitchen Store (Production floor)'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCommitAdjust} className="space-y-4">
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{adjustIngredient.name}</div>
                  <div className="text-[10px] text-zinc-400">Unit: {adjustIngredient.baseUnit?.symbol}</div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${adjustMode === 'ADD' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {adjustMode}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
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
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory count correction"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
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
          <div className="bg-[#161311] border border-white/15 rounded-3xl p-6 w-full max-w-2xl shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Deliver Batch of Stock to Kitchen</h3>
                  <div className="text-xs text-zinc-400">
                    Select stock items, type delivery quantities, and send the full batch to the Kitchen in one click
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSendDirectModalOpen(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search & Filter */}
            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search main store stock (e.g. Flour, Milk, Beef, Sugar)..."
                value={sendSearch}
                onChange={(e) => setSendSearch(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
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
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        hasQty
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{b.ingredient.name}</span>
                          <span className="text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.2 rounded-full font-medium">
                            {b.ingredient.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Available in Main: <span className="text-amber-400 font-bold">{b.quantity} {unitSymbol}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
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
                            className={`w-32 bg-black/40 border rounded-xl px-3 py-1.5 text-xs font-bold text-white text-right focus:outline-none transition ${
                              hasQty ? 'border-amber-500 text-amber-300' : 'border-white/10 focus:border-amber-500'
                            }`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 pointer-events-none">
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
                            className="p-1 text-zinc-500 hover:text-rose-400 text-xs font-black cursor-pointer"
                            title="Clear"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Form Actions */}
            <form onSubmit={handleSendBatchToKitchen} className="space-y-3 pt-3 border-t border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div className="text-zinc-400 flex items-center gap-1.5">
                  <span className="font-bold text-white">
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
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer font-bold"
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
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSendDirectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    sendSubmitting ||
                    Object.entries(batchQuantities).filter(([_, q]) => parseFloat(q) > 0).length === 0
                  }
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-[#C11221] hover:brightness-110 text-black font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
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
          <div className="bg-[#161311] border border-white/15 rounded-3xl p-6 w-full max-w-2xl shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Configure Low-Stock Alert Cutoffs</h3>
                  <div className="text-xs text-zinc-400">
                    Owner Settings: Set custom minimum thresholds to alert Head Chef and Main Storekeeper when stock drops
                  </div>
                </div>
              </div>
              <button
                onClick={() => setThresholdModalOpen(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search ingredients to set alert cutoffs..."
                value={thresholdSearch}
                onChange={(e) => setThresholdSearch(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
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
                      className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/[0.05] transition"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{ing.name}</div>
                        <div className="text-[10px] text-zinc-400">{ing.category} • Base Unit: {unitSymbol}</div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex flex-col">
                          <label className="text-[9px] text-zinc-400 uppercase font-bold">Kitchen Alert (&le;)</label>
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
                              className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                            />
                            <span className="text-[10px] text-zinc-500">{unitSymbol}</span>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[9px] text-zinc-400 uppercase font-bold">Main Alert (&le;)</label>
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
                              className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                            />
                            <span className="text-[10px] text-zinc-500">{unitSymbol}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveThreshold(ing.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-black text-xs rounded-xl shadow transition self-end sm:self-center cursor-pointer disabled:opacity-50"
                        >
                          {isSaving ? '...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-white/10 flex-shrink-0">
              <button
                type="button"
                onClick={() => setThresholdModalOpen(false)}
                className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
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
        onRecipeSaved={loadData}
      />

      <PurchaseOrderModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onPurchaseRecorded={loadData}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
