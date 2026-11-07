'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi, getSocket } from '@/lib/api';
import { playSlipChime } from '@/lib/audio';
import { TablePlanModal } from '@/components/TablePlanModal';
import { PaymentModal } from '@/components/PaymentModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import { ActiveOrdersModal } from '@/components/ActiveOrdersModal';
import { MenuImage } from '@/components/MenuImage';
import {
  Search,
  Plus,
  Minus,
  CheckCircle2,
  BellRing,
  ArrowRight,
  Receipt,
  FileEdit,
  LayoutGrid,
  CreditCard,
  ShoppingBag,
  Utensils,
  UserCheck,
  RotateCcw,
  Flame,
  Coffee,
  Sandwich,
  Cake,
  Leaf,
  X,
  Heart,
  SlidersHorizontal,
  Clock,
  Eye,
  Check
} from 'lucide-react';

export function PosView() {
  const {
    currentUser,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    customerName,
    setCustomerName,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    setItemTip,
    setItemNotes,
    clearCart,
    setWaiterSlipsCount,
  } = useAppStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allItems, setAllItems] = useState<any[]>([]);
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'BURGER' | 'PIZZA' | 'CHICKEN' | 'FRIES' | 'DRINKS' | 'COFFEE' | 'BAKERY' | 'FASTING'>('ALL');
  const [tables, setTables] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [incomingSlips, setIncomingSlips] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Mobile drawer & modals
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeOrdersModalOpen, setActiveOrdersModalOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);
  const [orderToSettle, setOrderToSettle] = useState<any | null>(null);
  const [appendOrderTarget, setAppendOrderTarget] = useState<any | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const toggleFavorite = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const loadActiveOrders = () => {
    fetchApi('/orders?statuses=CONFIRMED,IN_PREPARATION,READY,SERVED,COMPLETED')
      .then(setActiveOrders)
      .catch(() => {});
  };

  const loadData = () => {
    fetchApi('/menu/categories').then((data) => {
      setCategories(data);
    });

    fetchApi('/menu/items').then((items) => {
      setAllItems(items);
    });

    fetchApi('/menu/tables').then(setTables);
    fetchApi('/orders/waiter-slips').then((data) => {
      setIncomingSlips(data);
      setWaiterSlipsCount(data.length);
    });
    loadActiveOrders();
  };

  useEffect(() => {
    loadData();

    const socket = getSocket();
    socket.on('waiter:new_order_note', (slip) => {
      playSlipChime();
      setIncomingSlips((prev) => {
        const next = [slip, ...prev];
        setWaiterSlipsCount(next.length);
        return next;
      });
    });

    socket.on('tables:updated', (updatedTables) => {
      setTables(updatedTables);
    });

    socket.on('order:confirmed', () => {
      loadActiveOrders();
    });

    socket.on('order:updated', () => {
      loadActiveOrders();
    });

    return () => {
      socket.off('waiter:new_order_note');
      socket.off('tables:updated');
      socket.off('order:confirmed');
      socket.off('order:updated');
    };
  }, []);

  // Category navigation cards matching reference image
  const categoryCards = [
    { id: 'BURGER', label: 'Burger', emoji: '🍔' },
    { id: 'PIZZA', label: 'Pizza', emoji: '🍕' },
    { id: 'CHICKEN', label: 'Chicken', emoji: '🍗' },
    { id: 'FRIES', label: 'Fries', emoji: '🍟' },
    { id: 'DRINKS', label: 'Drink', emoji: '🥤' },
    { id: 'COFFEE', label: 'Coffee', emoji: '☕' },
    { id: 'BAKERY', label: 'Bakery', emoji: '🍰' },
    { id: 'FASTING', label: 'Fasting', emoji: '🌱' },
  ];

  const isFastingItem = (item: any) => {
    const text = `${item.name} ${item.description || ''} ${item.category?.name || ''}`.toLowerCase();
    return (
      text.includes('fasting') ||
      text.includes('vegi') ||
      text.includes('vegetable') ||
      text.includes('salad') ||
      text.includes('ጾም') ||
      text.includes('juice') ||
      text.includes('tea') ||
      text.includes('mojito') ||
      text.includes('water')
    );
  };

  // Compute filteredItems
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allItems.filter((item) => {
      const catName = (item.category?.name || '').toLowerCase();
      const itemName = item.name.toLowerCase();

      // Group / Category Filter
      if (groupFilter !== 'ALL') {
        if (groupFilter === 'FASTING' && !isFastingItem(item)) return false;
        if (groupFilter === 'BURGER' && !catName.includes('burger') && !itemName.includes('burger')) return false;
        if (groupFilter === 'PIZZA' && !catName.includes('pizza') && !itemName.includes('pizza')) return false;
        if (groupFilter === 'CHICKEN' && !catName.includes('chicken') && !itemName.includes('chicken') && !itemName.includes('wings')) return false;
        if (groupFilter === 'FRIES' && !catName.includes('fries') && !itemName.includes('fries') && !itemName.includes('chips')) return false;
        if (groupFilter === 'DRINKS' && !catName.includes('drink') && !catName.includes('juice') && !catName.includes('mojito') && !catName.includes('soft') && !catName.includes('water') && !itemName.includes('juice')) return false;
        if (groupFilter === 'COFFEE' && !catName.includes('coffee') && !catName.includes('hot') && !catName.includes('tea') && !itemName.includes('coffee') && !itemName.includes('latte') && !itemName.includes('cappuccino') && !itemName.includes('macchiato')) return false;
        if (groupFilter === 'BAKERY' && !catName.includes('dessert') && !catName.includes('cake') && !catName.includes('bakery') && !catName.includes('torta')) return false;
      }

      // Specific Category Selection
      if (selectedCategory && !query && item.categoryId !== selectedCategory) {
        return false;
      }

      // Search matching: name, description, category
      if (query) {
        const matchName = itemName.includes(query);
        const matchDesc = (item.description || '').toLowerCase().includes(query);
        const matchCat = catName.includes(query);
        if (!matchName && !matchDesc && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, groupFilter, selectedCategory, searchQuery]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalTip = cart.reduce((sum, item) => sum + (item.tip || 0) * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = taxableAmount * 0.15; // 15% Ethiopian VAT on base items subtotal
  const total = taxableAmount + totalTip + tax;
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Fire POS Order to Kitchen (or append to existing order)
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      if (appendOrderTarget) {
        const res = await fetchApi(`/orders/${appendOrderTarget.id}/append-items`, {
          method: 'POST',
          body: JSON.stringify({
            cashierId: currentUser.id || 'c01-cashier',
            items: cart.map((c) => ({
              menuItemId: c.menuItemId,
              quantity: c.quantity,
              tip: c.tip || 0,
              specialInstructions: c.specialInstructions,
              selectedAddonIds: c.selectedAddonIds || [],
              selectedAddons: c.selectedAddons || [],
            })),
          }),
        });

        setLastCompletedOrder(res);
        setSuccessOrder(`Appended to ${res.orderNumber}`);
        clearCart();
        setAppendOrderTarget(null);
        setTimeout(() => setSuccessOrder(null), 4000);
        loadActiveOrders();
        return;
      }

      // New POS Order
      const isTakeaway = orderType === 'TAKEAWAY';
      const selectedTableObj = isTakeaway ? null : tables.find((t) => t.tableNumber === selectedTable);
      const res = await fetchApi('/orders/pos', {
        method: 'POST',
        body: JSON.stringify({
          cashierId: currentUser.id || 'c01-cashier',
          tableId: selectedTableObj ? selectedTableObj.id : null,
          customerName: isTakeaway ? (customerName.trim() || 'Takeaway Customer') : (customerName || 'Guest'),
          orderType,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            tip: c.tip || 0,
            specialInstructions: c.specialInstructions,
            selectedAddonIds: c.selectedAddonIds || [],
            selectedAddons: c.selectedAddons || [],
          })),
        }),
      });

      setLastCompletedOrder({
        ...res,
        subtotal,
        tip: totalTip,
        tax,
        discount: discountAmount,
        totalAmount: total,
      });

      setSuccessOrder(res.orderNumber);
      clearCart();
      setTimeout(() => setSuccessOrder(null), 4000);
      loadData();
    } catch (err: any) {
      alert(`Error placing order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert a Waiter's digital slip into the active POS cart with 1 click
  const handleReviewWaiterSlip = (slip: any) => {
    clearCart();
    setAppendOrderTarget(null);
    setOrderType(slip.orderType || 'DINE_IN');
    if (slip.orderType === 'TAKEAWAY') {
      setCustomerName(slip.customerName || 'Takeaway Customer');
    } else {
      setSelectedTable(slip.table?.tableNumber || 'B12 - Indoor');
      setCustomerName(slip.customerName || 'Guest');
    }

    for (const item of slip.items) {
      for (let i = 0; i < item.quantity; i++) {
        const itemAddons = Array.isArray((item as any).selectedAddons) ? (item as any).selectedAddons : [];
        const itemAddonIds = itemAddons.map((a: any) => a.id).filter(Boolean);
        const displayName = item.specialInstructions
          ? `${item.menuItem.name} (${item.specialInstructions})`
          : item.menuItem.name;

        addToCart({
          id: item.menuItemId,
          name: displayName,
          price: Number(item.unitPrice),
          imageUrl: item.menuItem.imageUrl,
          isDirectSale: item.menuItem.isDirectSale,
          specialInstructions: item.specialInstructions || undefined,
          selectedAddonIds: itemAddonIds,
          selectedAddons: itemAddons,
        });
      }
    }

    setIncomingSlips((prev) => prev.filter((s) => s.id !== slip.id));
    setWaiterSlipsCount(Math.max(0, incomingSlips.length - 1));
  };

  const confirmWaiterSlipDirectly = async (slipId: string) => {
    try {
      const res = await fetchApi(`/orders/${slipId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ cashierId: currentUser?.id || 'c01-cashier' }),
      });
      setSuccessOrder(res.orderNumber);
      setIncomingSlips((prev) => prev.filter((s) => s.id !== slipId));
      setWaiterSlipsCount(Math.max(0, incomingSlips.length - 1));
      loadActiveOrders();
      loadData();
      setTimeout(() => setSuccessOrder(null), 4000);
    } catch (err: any) {
      alert(`Error sending order to kitchen: ${err.message}`);
    }
  };

  const handleRejectWaiterSlip = async (slipId: string) => {
    if (!confirm('Reject this waiter note?')) return;
    try {
      await fetchApi(`/orders/${slipId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'CANCELLED',
          actorUserId: currentUser?.id || 'c01-cashier',
        }),
      });
      setIncomingSlips((prev) => prev.filter((s) => s.id !== slipId));
      setWaiterSlipsCount(Math.max(0, incomingSlips.length - 1));
    } catch (e: any) {
      alert(e.message || 'Error rejecting slip');
    }
  };

  const handleConfirmPayment = async (paymentMethod: string, amount: number) => {
    if (orderToSettle) {
      const payRes = await fetchApi(`/orders/${orderToSettle.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
      setLastCompletedOrder(payRes.order);
      setOrderToSettle(null);
      loadActiveOrders();
      return;
    }

    if (!lastCompletedOrder && cart.length > 0) {
      const isTakeaway = orderType === 'TAKEAWAY';
      const selectedTableObj = isTakeaway ? null : tables.find((t) => t.tableNumber === selectedTable);
      const res = await fetchApi('/orders/pos', {
        method: 'POST',
        body: JSON.stringify({
          cashierId: currentUser.id || 'c01-cashier',
          tableId: selectedTableObj ? selectedTableObj.id : null,
          customerName: isTakeaway ? (customerName.trim() || 'Takeaway Customer') : (customerName || 'Guest'),
          orderType,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            tip: c.tip || 0,
            specialInstructions: c.specialInstructions,
            selectedAddonIds: c.selectedAddonIds || [],
            selectedAddons: c.selectedAddons || [],
          })),
        }),
      });

      const payRes = await fetchApi(`/orders/${res.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });

      setLastCompletedOrder(payRes.order);
      clearCart();
      loadActiveOrders();
    } else if (lastCompletedOrder) {
      const payRes = await fetchApi(`/orders/${lastCompletedOrder.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod }),
      });
      setLastCompletedOrder(payRes.order);
      loadActiveOrders();
    }
  };

  const handleSelectTable = (tableNumber: string) => {
    setSelectedTable(tableNumber);
    const tableObj = tables.find((t) => t.tableNumber === tableNumber);
    if (tableObj) {
      const active = activeOrders.find(
        (o) =>
          o.tableId === tableObj.id &&
          ['CONFIRMED', 'IN_PREPARATION', 'READY', 'SERVED'].includes(o.status) &&
          o.paymentStatus !== 'PAID',
      );
      if (active) {
        setAppendOrderTarget(active);
      } else {
        setAppendOrderTarget(null);
      }
    } else {
      setAppendOrderTarget(null);
    }
  };

  const isTakeaway = orderType === 'TAKEAWAY';
  const destinationDisplay = isTakeaway
    ? `🛍️ TAKEAWAY (${customerName.trim() || 'Counter Pickup'})`
    : `🍽️ Table ${selectedTable}`;

  // Renders the Cashier Bill / Cart Slip Panel
  const renderCartPanel = (isMobile = false) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && (
            <button
              onClick={() => setMobileCartOpen(false)}
              className="p-1.5 bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 hover:text-white rounded-xl transition cursor-pointer flex-shrink-0 mr-1"
              title="Close slip"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>Cashier:</span>
              <span className="text-amber-400 font-bold truncate">{currentUser?.name}</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">
              {destinationDisplay}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            clearCart();
            setAppendOrderTarget(null);
          }}
          className="text-xs font-semibold text-zinc-500 hover:text-[#C11221] transition cursor-pointer flex-shrink-0 ml-2"
        >
          Clear
        </button>
      </div>

      {/* Append Items Active Banner */}
      {appendOrderTarget && (
        <div className="mx-3.5 sm:mx-4 mt-3 p-2.5 sm:p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs flex-shrink-0">
          <div>
            <div className="font-black text-amber-300 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Appending to {appendOrderTarget.orderNumber}</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              {appendOrderTarget.orderType === "TAKEAWAY" ? "Takeaway Order" : `Table ${appendOrderTarget.table?.tableNumber}`}
            </div>
          </div>
          <button
            onClick={() => setAppendOrderTarget(null)}
            className="text-[10px] font-bold text-amber-400 hover:text-white bg-white/10 px-2 py-0.5 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Order Type Toggle: Dine In vs Take Away */}
      <div className="px-3.5 sm:px-4 pt-3 flex-shrink-0">
        <div className="grid grid-cols-2 bg-white/[0.04] border border-white/10 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setOrderType('DINE_IN')}
            className={`py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              orderType === "DINE_IN"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine In</span>
          </button>
          <button
            onClick={() => setOrderType('TAKEAWAY')}
            className={`py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              orderType === "TAKEAWAY"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Take Away</span>
          </button>
        </div>
      </div>

      {/* Customer & Destination Pickers */}
      <div className="p-3.5 sm:p-4 grid grid-cols-2 gap-2.5 sm:gap-3 border-b border-white/10 flex-shrink-0">
        <div>
          <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase mb-1">
            Customer Name
          </label>
          <input
            type="text"
            placeholder={isTakeaway ? "e.g. Abebe - Takeaway" : "Guest"}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase mb-1">
            {isTakeaway ? "Destination" : "Table Number"}
          </label>
          {isTakeaway ? (
            <div className="w-full bg-purple-500/15 border border-purple-500/30 rounded-xl px-2.5 py-1.5 text-xs font-bold text-purple-300 flex items-center gap-1 truncate">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="truncate">Counter</span>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <select
                value={selectedTable}
                onChange={(e) => handleSelectTable(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-2 sm:px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500/50 truncate"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.tableNumber} className="bg-[#161311] text-white">
                    {t.tableNumber}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setTableModalOpen(true)}
                title="View Floor Plan"
                className="p-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl text-amber-400 cursor-pointer flex-shrink-0"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 no-scrollbar min-h-0">
        {cart.length === 0 ? (
          <div className="h-32 sm:h-40 flex flex-col items-center justify-center text-center text-zinc-500">
            <Receipt className="w-8 h-8 mb-2 stroke-1 text-zinc-600" />
            <p className="text-xs">Cart is empty. Tap items on menu to add.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.menuItemId}
              className="bg-white/[0.04] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between hover:border-amber-500/30 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded-xl object-cover bg-black/40 flex-shrink-0 border border-white/10"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span>{item.price.toFixed(2)} ETB × {item.quantity}</span>
                    {item.tip && item.tip > 0 ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold text-[9px] flex items-center gap-1">
                        <span>Tip: +{item.tip.toFixed(2)} ETB</span>
                        <button
                          onClick={() => setItemTip(item.menuItemId, 0)}
                          className="text-amber-400 hover:text-rose-400 font-black ml-0.5"
                          title="Remove tip"
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const val = window.prompt(`Enter custom server tip for "${item.name}" (ETB):`, '15');
                          if (val !== null && val.trim() !== '') {
                            const parsed = parseFloat(val);
                            if (!isNaN(parsed) && parsed >= 0) {
                              setItemTip(item.menuItemId, parsed);
                            }
                          }
                        }}
                        className="text-[9px] font-bold text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 bg-white/[0.04] px-1.5 py-0.5 rounded transition cursor-pointer"
                        title="Add custom tip"
                      >
                        + Tip
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black text-amber-400">
                    {((item.price + (item.tip || 0)) * item.quantity).toFixed(2)} ETB
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-xl px-1.5 py-0.5">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-xs font-black px-1 text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & Settlement Footer */}
      <div className="p-3.5 sm:p-4 border-t border-white/10 bg-white/[0.02] space-y-2.5 sm:space-y-3 flex-shrink-0">
        {/* Quick Discount Controls */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-bold">% Discount:</span>
          <div className="flex gap-1">
            {[0, 5, 10, 15].map((d) => (
              <button
                key={d}
                onClick={() => setDiscountPercent(d)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  discountPercent === d
                    ? "bg-amber-500 text-black border-amber-400 font-black"
                    : "bg-white/[0.04] text-zinc-400 border-white/10 hover:text-white"
                }`}
              >
                {d === 0 ? "None" : `${d}%`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 text-xs font-semibold text-zinc-400">
          <div className="flex justify-between">
            <span>Base Subtotal</span>
            <span className="text-white font-bold">{subtotal.toFixed(2)} ETB</span>
          </div>
          {totalTip > 0 && (
            <div className="flex justify-between text-amber-400 font-bold">
              <span>Staff Tip / Gratuity</span>
              <span>+{totalTip.toFixed(2)} ETB</span>
            </div>
          )}
          {discountPercent > 0 && (
            <div className="flex justify-between text-rose-500 font-bold">
              <span>Discount ({discountPercent}%)</span>
              <span>-{discountAmount.toFixed(2)} ETB</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax (15% VAT)</span>
            <span className="text-zinc-950 dark:text-white font-bold">{tax.toFixed(2)} ETB</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-black/10 dark:border-white/10 text-sm font-bold text-zinc-950 dark:text-white">
            <span>Total Due</span>
            <span className="text-amber-600 dark:text-amber-400 text-base sm:text-lg font-black">{total.toFixed(2)} ETB</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            disabled={cart.length === 0 || loading}
            onClick={() => {
              handlePlaceOrder();
              if (isMobile) setMobileCartOpen(false);
            }}
            className={`flex-1 py-3 px-3 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              cart.length === 0 || loading
                ? "bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 border border-black/10 dark:border-white/10 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-[#C11221] to-[#A30F1C] hover:brightness-110 !text-white active:scale-95 shadow-red-950/40"
            }`}
          >
            <span className={cart.length === 0 || loading ? "text-zinc-600 dark:text-zinc-400 font-bold" : "!text-white font-black"}>
              {loading ? "Firing..." : appendOrderTarget ? "Append to Bill" : "Fire to Kitchen"}
            </span>
            <ArrowRight className={`w-4 h-4 ${cart.length === 0 || loading ? "text-zinc-400 dark:text-zinc-500" : "!text-white"}`} />
          </button>

          <button
            disabled={cart.length === 0 && !lastCompletedOrder}
            onClick={() => {
              setPaymentModalOpen(true);
              if (isMobile) setMobileCartOpen(false);
            }}
            className={`py-3 px-4 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
              cart.length === 0 && !lastCompletedOrder
                ? "bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 border border-black/10 dark:border-white/10 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 !text-black shadow-amber-500/25"
            }`}
            title="Pay & Settle Tender"
          >
            <CreditCard className="w-4 h-4" />
            <span>Settle Bill</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row h-full overflow-hidden bg-[#FAF7F2] dark:bg-[#0D0B0A] text-stone-900 dark:text-white relative transition-colors">
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#B83E18]/5 dark:bg-[#C11221]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Left: Menu Browse & Item Selection (ALWAYS visible on both mobile and desktop) */}
      <div className="flex-1 min-h-0 flex flex-col p-3.5 sm:p-6 overflow-y-auto pb-28 lg:pb-6 relative z-10 no-scrollbar">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            onClick={() => setActiveOrdersModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Tickets</span>
            <span className="bg-[#C11221] text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {activeOrders.filter((o) => o.paymentStatus !== "PAID").length}
            </span>
          </button>
        </div>

        {/* INCOMING WAITER SLIPS SECTION: Cashier Reviews & Fired to Kitchen */}
        {incomingSlips.length > 0 && (
          <div className="mb-4 bg-amber-950/20 border border-amber-500/40 rounded-3xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl animate-in fade-in">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce flex-shrink-0">
                  <BellRing className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <span>Incoming Waiter Orders</span>
                    <span className="bg-[#C11221] text-white text-[10px] sm:text-[11px] px-2 py-0.2 rounded-full font-black">
                      {incomingSlips.length} Pending
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400">
                    Floor notes ready to confirm & fire to KDS
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto no-scrollbar">
              {incomingSlips.map((slip) => {
                const isSlipTakeaway = slip.orderType === "TAKEAWAY";
                const totalItems = slip.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;

                return (
                  <div
                    key={slip.id}
                    className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-xl flex flex-col justify-between gap-2.5 hover:border-amber-500/40 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black uppercase ${
                            isSlipTakeaway ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {isSlipTakeaway ? "🛍️ Takeaway" : `🍽️ Table ${slip.table?.tableNumber || "Assigned"}`}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 font-bold">{slip.orderNumber}</span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-amber-400">
                            {Number(slip.totalAmount || 0).toFixed(2)} ETB
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 mb-1.5">
                        Server: <strong className="text-amber-400">{slip.waiter?.name || "Waiter"}</strong>
                        {slip.customerName && <span className="text-zinc-500"> ({slip.customerName})</span>}
                        <span className="text-zinc-500 ml-1.5">• {totalItems} items</span>
                      </div>

                      <div className="bg-white/[0.03] rounded-xl p-2 space-y-1 text-xs text-zinc-300 border border-white/10">
                        {slip.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-[11px]">
                            <span><strong className="text-amber-400">{item.quantity}x</strong> {item.menuItem?.name}</span>
                            <span className="text-zinc-500 font-mono">{Number(item.subtotal || item.unitPrice * item.quantity).toFixed(2)} ETB</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <button
                        onClick={() => confirmWaiterSlipDirectly(slip.id)}
                        className="flex-1 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-black rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 fill-black text-black" />
                        <span>Send to Kitchen</span>
                      </button>

                      <button
                        onClick={() => handleReviewWaiterSlip(slip)}
                        className="py-1.5 px-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-white/10"
                      >
                        <FileEdit className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleRejectWaiterSlip(slip.id)}
                        className="p-1.5 text-zinc-400 hover:text-[#C11221] hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                        title="Reject order note"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successOrder && (
          <div className="mb-3 bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between text-white shadow-xl animate-fade-in backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs font-bold">Order {successOrder} Fired Successfully!</div>
            </div>
            <button
              onClick={() => setReceiptModalOpen(true)}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl text-xs font-black hover:brightness-110 transition shadow flex items-center gap-1 cursor-pointer"
            >
              <Receipt className="w-3 h-3" />
              <span>Print</span>
            </button>
          </div>
        )}

        {/* Search Bar matching reference style */}
        <div className="relative mb-3">
          <div className="flex items-center bg-white/[0.05] border border-white/10 focus-within:border-amber-500/50 rounded-2xl px-3.5 py-2.5 shadow-inner transition">
            <Search className="w-4 h-4 text-zinc-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search dishes, burgers, pizza, coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none placeholder-zinc-500 pr-6"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 text-zinc-400 hover:text-white rounded-full transition absolute right-3"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setTableModalOpen(true)}
                className="text-zinc-400 hover:text-amber-400 transition absolute right-3 cursor-pointer"
                title="Table Floor Plan"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Order Destination Selector (Dine-In Table vs Takeaway) */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrderType('DINE_IN')}
              className={`flex-1 min-w-0 py-2 px-2.5 sm:px-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                orderType === 'DINE_IN'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Dine-In Table</span>
            </button>

            <button
              onClick={() => setOrderType('TAKEAWAY')}
              className={`flex-1 min-w-0 py-2 px-2.5 sm:px-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                orderType === 'TAKEAWAY'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Takeaway</span>
            </button>
          </div>

          {orderType === 'DINE_IN' ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 mr-1 flex-shrink-0">Table:</span>
              {tables.map((t) => {
                const isSelected = selectedTable === t.tableNumber;
                const isOccupied = t.status === 'OCCUPIED';

                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTable(t.tableNumber)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer border flex-shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-black font-black border-amber-400 shadow-md'
                        : isOccupied
                        ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                        : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span>{t.tableNumber}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setTableModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-amber-400 font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Plan</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Takeaway Customer Name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          )}
        </div>

        {/* Category Navigation Pills - Prominent, Unclipped, with Live Counts */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 mb-3.5 no-scrollbar flex-shrink-0 min-h-[52px]">
          <button
            onClick={() => {
              setGroupFilter('ALL');
              setSelectedCategory('');
            }}
            className={`flex-shrink-0 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-black transition cursor-pointer border ${
              groupFilter === 'ALL' && !selectedCategory
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-400 shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                : 'bg-white/[0.05] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <span>🍽️</span>
            <span>All Items</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              groupFilter === 'ALL' && !selectedCategory ? 'bg-black/30 text-black' : 'bg-white/10 text-zinc-400'
            }`}>
              {allItems.length}
            </span>
          </button>

          {categoryCards.map((cat) => {
            const isActive = groupFilter === cat.id;
            const count = allItems.filter((i) => {
              const name = `${i.name} ${i.category?.name || ''}`.toLowerCase();
              if (cat.id === 'BURGER') return name.includes('burger');
              if (cat.id === 'PIZZA') return name.includes('pizza');
              if (cat.id === 'CHICKEN') return name.includes('chicken');
              if (cat.id === 'FRIES') return name.includes('fries') || name.includes('chips');
              if (cat.id === 'DRINKS') return name.includes('drink') || name.includes('coke') || name.includes('water') || name.includes('juice');
              if (cat.id === 'COFFEE') return name.includes('coffee') || name.includes('espresso') || name.includes('latte') || name.includes('macchiato');
              if (cat.id === 'BAKERY') return name.includes('cake') || name.includes('pastry') || name.includes('croissant') || name.includes('bread');
              if (cat.id === 'FASTING') return isFastingItem(i);
              return false;
            }).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setGroupFilter(isActive ? 'ALL' : (cat.id as any));
                  setSelectedCategory('');
                }}
                className={`flex-shrink-0 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-400 shadow-md shadow-amber-500/25 ring-1 ring-amber-400 font-black'
                    : 'bg-white/[0.05] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-black/30 text-black font-black' : 'bg-white/10 text-zinc-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* "Popular Picks" Header matching Reference Image */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-white font-heading tracking-tight flex items-center gap-1.5">
              <span>Popular Picks</span>
              <span className="text-amber-500">🍗</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-zinc-400 font-medium">
              Customer favorites & all-time house bestsellers
            </p>
          </div>
          <button
            onClick={() => {
              setGroupFilter('ALL');
              setSearchQuery('');
              setSelectedCategory('');
            }}
            className="text-xs font-bold text-stone-700 dark:text-zinc-300 hover:text-[#B83E18] dark:hover:text-amber-400 flex items-center gap-1 transition"
          >
            <span>View All ({filteredItems.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Food Items Grid (matching Reference Image) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {filteredItems.map((item) => {
            const inCart = cart.find((c) => c.menuItemId === item.id);
            const qty = inCart ? inCart.quantity : 0;
            const isSelected = qty > 0;
            const isFav = favorites[item.id];

            return (
              <div
                key={item.id}
                onClick={() =>
                  addToCart({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    imageUrl: item.imageUrl,
                    isDirectSale: item.isDirectSale,
                  })
                }
                className={`group relative bg-white dark:bg-[#161311] rounded-3xl p-3 sm:p-3.5 border transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.12)] ${
                  isSelected
                    ? "border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30"
                    : "border-stone-200/90 dark:border-white/10 hover:border-[#B83E18]/50 dark:hover:border-amber-500/50"
                }`}
              >
                {/* Generous Food Image (matching Reference) */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-2.5 sm:mb-3 bg-stone-100 dark:bg-black/40 border border-stone-200/60 dark:border-white/10 flex-shrink-0">
                  <MenuImage
                    src={item.imageUrl}
                    alt={item.name}
                    categoryName={item.category?.name}
                    prepSection={item.prepSection}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                  />

                  {/* Dietary / Category Badge (Top-Left) */}
                  <div className="absolute top-2 left-2 z-10">
                    {isFastingItem(item) ? (
                      <span className="bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md">
                        <Leaf className="w-2.5 h-2.5" />
                        <span>Fasting</span>
                      </span>
                    ) : item.name.toLowerCase().includes('spicy') ? (
                      <span className="bg-[#B83E18] text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full shadow-md backdrop-blur-md">
                        Spicy
                      </span>
                    ) : (
                      <span className="bg-black/55 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {item.category?.name || 'Dish'}
                      </span>
                    )}
                  </div>

                  {/* Favorite Heart Toggle (Top-Right) */}
                  <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-white/80 group-hover:text-white'}`} />
                  </button>

                  {/* Selection Overlay */}
                  {isSelected && (
                    <div className="absolute bottom-2 right-2 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-amber-300/40 flex items-center gap-1">
                      <span>x{qty} in order</span>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <h3
                      className="text-xs sm:text-base font-black text-stone-900 dark:text-white truncate group-hover:text-[#B83E18] dark:group-hover:text-amber-400 transition"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                  </div>

                  {/* Price & Action Row matching Reference */}
                  <div className="flex items-end justify-between gap-2 mt-3 pt-2.5 border-t border-stone-100 dark:border-white/5">
                    <div>
                      <div className="text-xs sm:text-base font-black text-[#B83E18] dark:text-amber-400 tracking-tight leading-none">
                        {Number(item.price).toLocaleString()} <span className="text-[10px] sm:text-xs font-bold text-stone-500 dark:text-zinc-400">ETB</span>
                      </div>
                      <span className="text-[9px] text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mt-1">
                        VAT Inc.
                      </span>
                    </div>

                    {/* Round Terracotta Quick Select Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart({
                          id: item.id,
                          name: item.name,
                          price: Number(item.price),
                          imageUrl: item.imageUrl,
                          isDirectSale: item.isDirectSale,
                        });
                      }}
                      className="w-8 h-8 rounded-full bg-[#B83E18] hover:bg-[#9E3312] active:scale-90 text-white flex items-center justify-center shadow-md shadow-[#B83E18]/30 transition cursor-pointer flex-shrink-0"
                      title="Add to cart"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE FLOATING BILL SUMMARY BAR (<lg) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30 animate-in slide-in-from-bottom duration-300">
          <div
            onClick={() => setMobileCartOpen(true)}
            className="bg-[#161311]/95 backdrop-blur-xl border border-amber-500/50 p-2.5 sm:p-3 rounded-2xl shadow-2xl shadow-black/80 flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/30 flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                  <span>{totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} in Slip</span>
                  <span className="text-[10px] bg-[#C11221] text-white px-1.5 py-0.2 rounded-full font-black flex-shrink-0">
                    {isTakeaway ? 'Takeaway' : `Table ${selectedTable}`}
                  </span>
                </div>
                <div className="text-sm font-black text-amber-400">
                  {total.toFixed(2)} ETB <span className="text-[10px] text-zinc-400 font-normal">(incl. VAT)</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileCartOpen(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition flex-shrink-0"
            >
              <span>View Slip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION DOCK (<lg) */}
      <div className="lg:hidden fixed bottom-2 left-3 right-3 z-30 bg-[#161311]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-1.5 px-4 shadow-2xl flex items-center justify-between">
        {/* Menu Home */}
        <button
          onClick={() => {
            setGroupFilter('ALL');
            setSelectedCategory('');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition cursor-pointer ${
            groupFilter === 'ALL' && !searchQuery ? 'text-amber-400 font-black' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>

        {/* Floor Plan Tables */}
        <button
          onClick={() => setTableModalOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold">Tables</span>
        </button>

        {/* Slip / Orders Drawer Trigger */}
        <button
          onClick={() => setMobileCartOpen(true)}
          className="relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl text-zinc-500 hover:text-amber-400 transition cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-zinc-300" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#C11221] text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-lg border border-white/20">
                {totalCartItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Slip</span>
        </button>

        {/* Active Tickets */}
        <button
          onClick={() => setActiveOrdersModalOpen(true)}
          className="relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl text-zinc-500 hover:text-amber-400 transition cursor-pointer"
        >
          <Clock className="w-5 h-5" />
          {activeOrders.filter((o) => o.paymentStatus !== "PAID").length > 0 && (
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
          <span className="text-[10px] font-bold">Tickets</span>
        </button>
      </div>

      {/* MOBILE CART / BILL DRAWER (<lg) */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="relative bg-[#12100E] border-t border-white/15 rounded-t-[32px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 z-10">
            {renderCartPanel(true)}
          </div>
        </div>
      )}

      {/* DESKTOP RIGHT CART PANEL (>=lg) */}
      <div className="hidden lg:flex w-80 xl:w-96 bg-white dark:bg-[#12100E]/95 backdrop-blur-2xl border-l border-stone-200/90 dark:border-white/10 flex-col h-full shadow-xl flex-shrink-0 relative z-20 text-stone-900 dark:text-white transition-colors">
        {renderCartPanel(false)}
      </div>

      {/* Modals */}
      <TablePlanModal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={handleSelectTable}
        onTablesUpdated={setTables}
      />

      <ActiveOrdersModal
        isOpen={activeOrdersModalOpen}
        onClose={() => setActiveOrdersModalOpen(false)}
        orders={activeOrders}
        onSettleOrder={(order) => {
          setOrderToSettle(order);
          setPaymentModalOpen(true);
        }}
        onPrintReceipt={(order) => {
          setLastCompletedOrder(order);
          setReceiptModalOpen(true);
        }}
        onAppendItems={(order) => {
          setAppendOrderTarget(order);
          if (order.orderType === 'TAKEAWAY') {
            setOrderType('TAKEAWAY');
            setCustomerName(order.customerName || '');
          } else {
            setOrderType('DINE_IN');
            if (order.table?.tableNumber) setSelectedTable(order.table.tableNumber);
            setCustomerName(order.customerName || 'Guest');
          }
        }}
        onRefreshOrders={loadActiveOrders}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setOrderToSettle(null);
        }}
        orderTotal={orderToSettle ? Number(orderToSettle.totalAmount) : total}
        onConfirmPayment={handleConfirmPayment}
        onShowReceipt={() => setReceiptModalOpen(true)}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        order={lastCompletedOrder}
      />
    </div>
  );
}
