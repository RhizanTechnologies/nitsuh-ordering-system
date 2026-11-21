'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi, getSocket } from '@/lib/api';
import { playSlipChime } from '@/lib/audio';
import { TablePlanModal } from '@/components/TablePlanModal';
import { PaymentModal } from '@/components/PaymentModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import { MenuImage } from '@/components/MenuImage';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Button, Badge, Card, Input } from '@/components/ui';
import {
  Search,
  Plus,
  Minus,
  CheckCircle2,
  BellRing,
  ArrowRight,
  ArrowLeft,
  Receipt,
  FileEdit,
  LayoutGrid,
  CreditCard,
  ShoppingBag,
  Utensils,
  UserCheck,
  RotateCcw,
  Flame,
  X,
  Clock,
  ChevronDown,
  Printer,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Check,
  CheckCircle,
  Calendar
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

  // Primary Cashier Navigation: Default is 'orders' (Orders, Firing & Billing)
  const [posTab, setPosTab] = useState<'orders' | 'menu'>('orders');

  // Orders View Filters & Search
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'SLIPS' | 'UNPAID' | 'PREPARING' | 'READY' | 'SERVED' | 'DINE_IN' | 'TAKEAWAY'>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Menu / Product Catalog State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allItems, setAllItems] = useState<any[]>([]);
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'BURGER' | 'PIZZA' | 'CHICKEN' | 'FRIES' | 'DRINKS' | 'COFFEE' | 'BAKERY' | 'FASTING'>('ALL');
  const [tables, setTables] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Orders & Slips State
  const [incomingSlips, setIncomingSlips] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);

  // Mobile drawer & modals
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);
  const [orderToSettle, setOrderToSettle] = useState<any | null>(null);
  const [appendOrderTarget, setAppendOrderTarget] = useState<any | null>(null);
  const [editingSlipTarget, setEditingSlipTarget] = useState<any | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'day_before' | '3_days' | 'all'>('today');

  const loadActiveOrders = () => {
    return fetchApi('/orders?statuses=CONFIRMED,IN_PREPARATION,READY,SERVED,COMPLETED&limit=250')
      .then(setActiveOrders)
      .catch(() => {});
  };

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchApi('/menu/categories').then(setCategories).catch(() => {}),
        fetchApi('/menu/items').then(setAllItems).catch(() => {}),
        fetchApi('/menu/tables').then(setTables).catch(() => {}),
        fetchApi('/orders/waiter-slips')
          .then((data) => {
            setIncomingSlips(data);
            setWaiterSlipsCount(data.length);
          })
          .catch(() => {}),
        loadActiveOrders(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
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

    socket.on('kitchen:order_status', () => {
      loadActiveOrders();
    });

    socket.on('kitchen:order_ready', () => {
      loadActiveOrders();
    });

    socket.on('order:status_changed', () => {
      loadActiveOrders();
    });

    return () => {
      socket.off('waiter:new_order_note');
      socket.off('tables:updated');
      socket.off('order:confirmed');
      socket.off('order:updated');
      socket.off('kitchen:order_status');
      socket.off('kitchen:order_ready');
      socket.off('order:status_changed');
    };
  }, []);

  // Category navigation cards
  const categoryCards = [
    { id: 'BURGER', label: 'Burger', emoji: '🍔' },
    { id: 'PIZZA', label: 'Pizza', emoji: '🍕' },
    { id: 'CHICKEN', label: 'Chicken', emoji: '🍗' },
    { id: 'FRIES', label: 'Fries', emoji: '🍟' },
    { id: 'DRINKS', label: 'Drink', emoji: '🥤' },
    { id: 'COFFEE', label: 'Coffee', emoji: '☕' },
    { id: 'BAKERY', label: 'Bakery', emoji: '🍰' },
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

  // Compute filtered menu items
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

  // Helper to determine day bucket ('today' | 'yesterday' | 'day_before' | 'older')
  const getOrderDayKey = (dateStr: string | Date): 'today' | 'yesterday' | 'day_before' | 'older' => {
    if (!dateStr) return 'older';
    const d = new Date(dateStr);
    const now = new Date();

    const toYMD = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const target = toYMD(d);
    const today = toYMD(now);

    const yDate = new Date(now);
    yDate.setDate(now.getDate() - 1);
    const yesterday = toYMD(yDate);

    const dbDate = new Date(now);
    dbDate.setDate(now.getDate() - 2);
    const dayBefore = toYMD(dbDate);

    if (target === today) return 'today';
    if (target === yesterday) return 'yesterday';
    if (target === dayBefore) return 'day_before';
    return 'older';
  };

  // Label for Day Before Yesterday (e.g. "Wed, Nov 18")
  const dayBeforeDateLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }, []);

  // Breakdown counts for the past 3 days and all-time
  const dayCounts = useMemo(() => {
    let today = 0;
    let yesterday = 0;
    let day_before = 0;
    let all = 0;
    let todayUnpaid = 0;
    let yesterdayUnpaid = 0;
    let dayBeforeUnpaid = 0;
    let allUnpaid = 0;

    for (const o of activeOrders) {
      const key = getOrderDayKey(o.createdAt);
      const isUnpaid = o.paymentStatus !== 'PAID' && o.status !== 'COMPLETED';
      all++;
      if (isUnpaid) allUnpaid++;
      if (key === 'today') {
        today++;
        if (isUnpaid) todayUnpaid++;
      } else if (key === 'yesterday') {
        yesterday++;
        if (isUnpaid) yesterdayUnpaid++;
      } else if (key === 'day_before') {
        day_before++;
        if (isUnpaid) dayBeforeUnpaid++;
      }
    }

    return {
      today: { total: today, unpaid: todayUnpaid },
      yesterday: { total: yesterday, unpaid: yesterdayUnpaid },
      day_before: { total: day_before, unpaid: dayBeforeUnpaid },
      threeDays: today + yesterday + day_before,
      all: { total: all, unpaid: allUnpaid },
    };
  }, [activeOrders]);

  // Orders filtered by the selected date bucket (today by default, yesterday, day before, 3-day range, or all days)
  const dayFilteredOrders = useMemo(() => {
    return activeOrders.filter((o) => {
      const key = getOrderDayKey(o.createdAt);
      if (dateFilter === 'today') return key === 'today';
      if (dateFilter === 'yesterday') return key === 'yesterday';
      if (dateFilter === 'day_before') return key === 'day_before';
      if (dateFilter === '3_days') return ['today', 'yesterday', 'day_before'].includes(key);
      if (dateFilter === 'all') return true;
      return false;
    });
  }, [activeOrders, dateFilter]);

  // Statistics calculation for Cashier Command Center (scoped to selected date bucket)
  const unpaidOrders = useMemo(
    () => dayFilteredOrders.filter((o) => o.paymentStatus !== 'PAID' && o.status !== 'COMPLETED'),
    [dayFilteredOrders]
  );
  const unpaidTotalAmount = useMemo(() => unpaidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0), [unpaidOrders]);
  const inPrepCount = useMemo(() => dayFilteredOrders.filter((o) => ['CONFIRMED', 'IN_PREPARATION'].includes(o.status)).length, [dayFilteredOrders]);
  const readyCount = useMemo(() => dayFilteredOrders.filter((o) => o.status === 'READY').length, [dayFilteredOrders]);
  const servedCount = useMemo(() => dayFilteredOrders.filter((o) => o.status === 'SERVED').length, [dayFilteredOrders]);

  // Filtered & Sorted Orders for the Cashier main page
  // Requirement: UNPAID and SERVED orders MUST appear FIRST!
  const filteredOrders = useMemo(() => {
    const matches = dayFilteredOrders.filter((o) => {
      // Status filter
      if (orderFilter === 'SLIPS') return false;
      if (orderFilter === 'DINE_IN' && o.orderType !== 'DINE_IN') return false;
      if (orderFilter === 'TAKEAWAY' && o.orderType !== 'TAKEAWAY') return false;
      // UNPAID filter: strictly only show unpaid bills (never completed/paid bills)
      if (orderFilter === 'UNPAID') {
        if (o.paymentStatus === 'PAID' || o.status === 'COMPLETED') return false;
      }
      if (orderFilter === 'PREPARING' && !['CONFIRMED', 'IN_PREPARATION'].includes(o.status)) return false;
      if (orderFilter === 'READY' && o.status !== 'READY') return false;
      if (orderFilter === 'SERVED' && o.status !== 'SERVED') return false;

      // Search filter
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const numMatch = o.orderNumber?.toLowerCase().includes(q);
        const tableMatch = o.table?.tableNumber?.toLowerCase().includes(q);
        const custMatch = o.customerName?.toLowerCase().includes(q);
        const cashierMatch = o.cashier?.name?.toLowerCase().includes(q);
        const waiterMatch = o.waiter?.name?.toLowerCase().includes(q);
        const itemsMatch = o.items?.some((i: any) =>
          (i.menuItem?.name || i.name || '').toLowerCase().includes(q)
        );
        return numMatch || tableMatch || custMatch || cashierMatch || waiterMatch || itemsMatch;
      }

      return true;
    });

    // Priority sorting:
    // 1. UNPAID + SERVED (Customers have received food and are ready to settle bill)
    // 2. UNPAID + READY (Food plated, ready to be served/paid)
    // 3. UNPAID + IN_PREPARATION / CONFIRMED (Cooking in kitchen)
    // 4. Other UNPAID
    // 5. PAID & active
    // 6. PAID & COMPLETED
    return matches.sort((a, b) => {
      const getPriority = (o: any) => {
        const isUnpaid = o.paymentStatus !== 'PAID' && o.status !== 'COMPLETED';
        const isServed = o.status === 'SERVED';
        const isReady = o.status === 'READY';
        const isInPrep = ['CONFIRMED', 'IN_PREPARATION'].includes(o.status);

        if (isUnpaid && isServed) return 1;
        if (isUnpaid && isReady) return 2;
        if (isUnpaid && isInPrep) return 3;
        if (isUnpaid) return 4;
        if (o.status !== 'COMPLETED') return 5;
        return 6;
      };

      const pA = getPriority(a);
      const pB = getPriority(b);
      if (pA !== pB) return pA - pB;

      // Same priority: newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [dayFilteredOrders, orderFilter, orderSearch]);

  // Waiter Slips scoped to selected day
  const daySlips = useMemo(() => {
    return incomingSlips.filter((s) => {
      const key = getOrderDayKey(s.createdAt);
      if (dateFilter === 'today') return key === 'today';
      if (dateFilter === 'yesterday') return key === 'yesterday';
      if (dateFilter === 'day_before') return key === 'day_before';
      if (dateFilter === '3_days') return ['today', 'yesterday', 'day_before'].includes(key);
      if (dateFilter === 'all') return true;
      return false;
    });
  }, [incomingSlips, dateFilter]);

  // Filtered Incoming Slips (filtered by day & search)
  const filteredSlips = useMemo(() => {
    if (orderFilter !== 'ALL' && orderFilter !== 'SLIPS') return [];
    if (!orderSearch.trim()) return daySlips;
    const q = orderSearch.toLowerCase();
    return daySlips.filter((s) => {
      const numMatch = s.orderNumber?.toLowerCase().includes(q);
      const tableMatch = s.table?.tableNumber?.toLowerCase().includes(q);
      const custMatch = s.customerName?.toLowerCase().includes(q);
      const waiterMatch = s.waiter?.name?.toLowerCase().includes(q);
      const itemsMatch = s.items?.some((i: any) =>
        (i.menuItem?.name || i.name || '').toLowerCase().includes(q)
      );
      return numMatch || tableMatch || custMatch || waiterMatch || itemsMatch;
    });
  }, [daySlips, orderFilter, orderSearch]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalTip = cart.reduce((sum, item) => sum + (item.tip || 0) * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  // Menu prices are inclusive of tax: no extra tax added on top
  const tax = taxableAmount > 0 ? Number(((taxableAmount * 0.15) / 1.15).toFixed(2)) : 0;
  const total = taxableAmount + totalTip;
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Time formatter (day-aware)
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const dayKey = getOrderDayKey(date);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (dayKey === 'today') {
        const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        return timeStr;
      }
      if (dayKey === 'yesterday') {
        return `Yesterday, ${timeStr}`;
      }
      return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch {
      return '';
    }
  };

  // Place POS Order / Append Items and return to Orders View
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
        setPosTab('orders');
        setTimeout(() => setSuccessOrder(null), 4000);
        loadActiveOrders();
        return;
      }

      // If reviewing/editing an incoming waiter slip, update that exact slip in-place and fire it!
      if (editingSlipTarget) {
        const isTakeaway = orderType === 'TAKEAWAY';
        const selectedTableObj = isTakeaway ? null : tables.find((t) => t.tableNumber === selectedTable);

        const res = await fetchApi(`/orders/${editingSlipTarget.id}/update-and-confirm`, {
          method: 'POST',
          body: JSON.stringify({
            cashierId: currentUser.id || 'c01-cashier',
            tableId: selectedTableObj ? selectedTableObj.id : null,
            customerName: isTakeaway ? (customerName.trim() || 'Takeaway Customer') : (customerName || 'Guest'),
            orderType,
            discount: discountAmount,
            discountPercent,
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
        setEditingSlipTarget(null);
        setPosTab('orders');
        setTimeout(() => setSuccessOrder(null), 4000);
        loadActiveOrders();
        loadData();
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
          discount: discountAmount,
          discountPercent,
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
      setPosTab('orders');
      setTimeout(() => setSuccessOrder(null), 4000);
      loadData();
    } catch (err: any) {
      alert(`Error placing order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert a Waiter's digital slip into the active POS cart and switch to Menu
  const handleReviewWaiterSlip = (slip: any) => {
    clearCart();
    setAppendOrderTarget(null);
    setEditingSlipTarget(slip);
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
    setPosTab('menu');
  };

  // Confirm Waiter Slip directly to Kitchen KDS
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

  // Reject Waiter Slip
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

  // Settle Bill payment
  const handleConfirmPayment = async (paymentMethod: string, amount: number, transactionRef?: string) => {
    if (orderToSettle) {
      const payRes = await fetchApi(`/orders/${orderToSettle.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod, transactionRef }),
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
          discount: discountAmount,
          discountPercent,
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
        body: JSON.stringify({ amount, paymentMethod, transactionRef }),
      });

      setLastCompletedOrder(payRes.order);
      clearCart();
      setPosTab('orders');
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
    if (tableObj && !editingSlipTarget) {
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
    } else if (!editingSlipTarget) {
      setAppendOrderTarget(null);
    }
  };

  // Start appending items to an existing active order
  const handleStartAppendItems = (order: any) => {
    setEditingSlipTarget(null);
    setAppendOrderTarget(order);
    if (order.orderType === 'TAKEAWAY') {
      setOrderType('TAKEAWAY');
      setCustomerName(order.customerName || '');
    } else {
      setOrderType('DINE_IN');
      if (order.table?.tableNumber) setSelectedTable(order.table.tableNumber);
      setCustomerName(order.customerName || 'Guest');
    }
    setPosTab('menu');
  };

  // Start editing an active order (allows cashier to add, reduce, or remove items)
  const handleStartEditOrder = (order: any) => {
    clearCart();
    setAppendOrderTarget(null);
    setEditingSlipTarget(order);
    setOrderType(order.orderType || 'DINE_IN');
    if (order.orderType === 'TAKEAWAY') {
      setCustomerName(order.customerName || 'Takeaway Customer');
    } else {
      setSelectedTable(order.table?.tableNumber || 'B12 - Indoor');
      setCustomerName(order.customerName || 'Guest');
    }

    for (const item of order.items || []) {
      for (let i = 0; i < item.quantity; i++) {
        const itemAddons = Array.isArray((item as any).selectedAddons) ? (item as any).selectedAddons : [];
        const itemAddonIds = itemAddons.map((a: any) => a.id).filter(Boolean);
        const displayName = item.specialInstructions
          ? `${item.menuItem?.name || item.name} (${item.specialInstructions})`
          : (item.menuItem?.name || item.name);

        addToCart({
          id: item.menuItemId || item.menuItem?.id,
          name: displayName,
          price: Number(item.unitPrice || item.price),
          imageUrl: item.menuItem?.imageUrl,
          isDirectSale: item.menuItem?.isDirectSale,
          specialInstructions: item.specialInstructions || undefined,
          selectedAddonIds: itemAddonIds,
          selectedAddons: itemAddons,
        });
      }
    }

    setPosTab('menu');
  };

  const isTakeaway = orderType === 'TAKEAWAY';
  const destinationDisplay = isTakeaway
    ? `🛍️ TAKEAWAY (${customerName.trim() || 'Counter Pickup'})`
    : `🍽️ Table ${selectedTable}`;

  // Renders the Cashier Bill / Cart Slip Panel
  const renderCartPanel = (isMobile = false) => (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-transparent text-stone-900 dark:text-white">
      {/* Panel Header */}
      <div className="p-3.5 sm:p-4 border-b border-stone-200/90 dark:border-white/10 bg-stone-50/70 dark:bg-white/[0.02] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && (
            <button
              onClick={() => setMobileCartOpen(false)}
              className="p-1.5 bg-stone-200/80 hover:bg-stone-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-stone-700 dark:text-zinc-300 hover:text-stone-950 dark:hover:text-white rounded-xl transition cursor-pointer flex-shrink-0 mr-1"
              title="Close slip"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span>Cashier:</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold truncate">{currentUser?.name}</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-stone-900 dark:text-white mt-0.5 truncate">
              {destinationDisplay}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            clearCart();
            setAppendOrderTarget(null);
            setEditingSlipTarget(null);
            loadData();
          }}
          className="text-xs font-semibold text-stone-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 transition cursor-pointer flex-shrink-0 ml-2"
        >
          Clear
        </button>
      </div>

      {/* Editing Waiter Note Banner */}
      {editingSlipTarget && (
        <div className="mx-3.5 sm:mx-4 mt-3 p-2.5 sm:p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs flex-shrink-0">
          <div>
            <div className="font-black text-amber-900 flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-amber-600" />
              <span>Editing Slip {editingSlipTarget.orderNumber?.startsWith('#') ? editingSlipTarget.orderNumber : `#${editingSlipTarget.orderNumber}`}</span>
            </div>
            <div className="text-[10px] text-stone-500">
              {editingSlipTarget.orderType === "TAKEAWAY" ? "Takeaway Order" : `Table ${editingSlipTarget.table?.tableNumber || "Assigned"}`}
              {editingSlipTarget.waiter?.name ? ` • Waiter: ${editingSlipTarget.waiter.name}` : ''}
            </div>
          </div>
          <button
            onClick={() => {
              clearCart();
              setEditingSlipTarget(null);
              loadData();
            }}
            className="text-[10px] font-bold text-amber-900 hover:text-stone-900 bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded-lg cursor-pointer transition"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* Append Items Active Banner */}
      {appendOrderTarget && (
        <div className="mx-3.5 sm:mx-4 mt-3 p-2.5 sm:p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs flex-shrink-0">
          <div>
            <div className="font-black text-emerald-800 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Appending to {appendOrderTarget.orderNumber?.startsWith('#') ? appendOrderTarget.orderNumber : `#${appendOrderTarget.orderNumber}`}</span>
            </div>
            <div className="text-[10px] text-stone-500">
              {appendOrderTarget.orderType === "TAKEAWAY" ? "Takeaway Order" : `Table ${appendOrderTarget.table?.tableNumber}`}
            </div>
          </div>
          <button
            onClick={() => setAppendOrderTarget(null)}
            className="text-[10px] font-bold text-emerald-800 hover:text-stone-900 bg-emerald-100 px-2 py-0.5 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Order Type Toggle: Dine In vs Take Away */}
      <div className="px-3.5 sm:px-4 pt-3 flex-shrink-0">
        <div className="grid grid-cols-2 bg-stone-100 border border-stone-200/90 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setOrderType('DINE_IN')}
            className={`py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              orderType === "DINE_IN"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-950"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Dine In</span>
          </button>
          <button
            onClick={() => setOrderType('TAKEAWAY')}
            className={`py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              orderType === "TAKEAWAY"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-950"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Take Away</span>
          </button>
        </div>
      </div>

      {/* Customer & Destination Pickers */}
      <div className={`p-3.5 sm:p-4 grid ${isTakeaway ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 sm:gap-3 border-b border-stone-200/90 dark:border-white/10 flex-shrink-0`}>
        {isTakeaway && (
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase mb-1">
              Customer Name
            </label>
            <input
              type="text"
              placeholder="e.g. Abebe - Takeaway"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-stone-100 dark:bg-white/[0.04] border border-stone-200/90 dark:border-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] sm:text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase mb-1">
            {isTakeaway ? "Destination" : "Table Number"}
          </label>
          {isTakeaway ? (
            <div className="w-full bg-purple-500/15 border border-purple-500/30 rounded-xl px-2.5 py-1.5 text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1 truncate">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span className="truncate">Counter</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTableModalOpen(true)}
              className="w-full bg-stone-100 dark:bg-white/[0.04] hover:bg-stone-200/70 border border-stone-200/90 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-900 dark:text-white flex items-center justify-between gap-1.5 cursor-pointer transition shadow-2xs group"
              title="Select Dining Table from Floor Plan"
            >
              <div className="flex items-center gap-1.5 truncate">
                <LayoutGrid className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{selectedTable ? `Table ${selectedTable}` : 'Select Table'}</span>
              </div>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white dark:bg-white/10 text-stone-700 dark:text-stone-300">Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 no-scrollbar min-h-0">
        {cart.length === 0 ? (
          <div className="h-32 sm:h-40 flex flex-col items-center justify-center text-center text-stone-400 dark:text-zinc-500">
            <Receipt className="w-8 h-8 mb-2 stroke-1 text-stone-400 dark:text-zinc-600" />
            <p className="text-xs">Cart is empty. Tap items on menu to add.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.menuItemId}
              className="bg-stone-50 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/10 rounded-2xl p-2.5 flex items-center justify-between hover:border-amber-500/30 transition shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded-xl object-cover bg-stone-200 dark:bg-black/40 flex-shrink-0 border border-stone-200/60 dark:border-white/10"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate">{item.name}</h4>
                  <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span>{item.price.toFixed(2)} ETB × {item.quantity}</span>
                    {item.tip && item.tip > 0 ? (
                      <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold text-[9px] flex items-center gap-1">
                        <span>Tip: +{item.tip.toFixed(2)} ETB</span>
                        <button
                          onClick={() => setItemTip(item.menuItemId, 0)}
                          className="text-amber-600 dark:text-amber-400 hover:text-red-600 dark:hover:text-rose-400 font-black ml-0.5"
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
                        className="text-[9px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 bg-stone-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded transition cursor-pointer"
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
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                    {((item.price + (item.tip || 0)) * item.quantity).toFixed(2)} ETB
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-white/[0.06] border border-stone-300/80 dark:border-white/10 rounded-xl px-1.5 py-0.5">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    className="text-stone-600 dark:text-zinc-400 hover:text-stone-950 dark:hover:text-white transition cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-xs font-black px-1 text-stone-900 dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    className="text-stone-600 dark:text-zinc-400 hover:text-stone-950 dark:hover:text-white transition cursor-pointer"
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
      <div className="p-3.5 sm:p-4 border-t border-stone-200/90 dark:border-white/10 bg-stone-50/70 dark:bg-white/[0.02] space-y-2.5 sm:space-y-3 flex-shrink-0">
        {/* Quick Discount Controls */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500 font-bold">% Discount:</span>
          <div className="flex gap-1">
            {[0, 5, 10, 15].map((d) => (
              <button
                key={d}
                onClick={() => setDiscountPercent(d)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  discountPercent === d
                    ? "bg-emerald-600 text-white border-emerald-500 font-black shadow-xs"
                    : "bg-stone-100 text-stone-600 border-stone-200/90 hover:text-stone-950"
                }`}
              >
                {d === 0 ? "None" : `${d}%`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 text-xs font-semibold text-stone-500 dark:text-zinc-400">
          <div className="flex justify-between">
            <span>Base Subtotal</span>
            <span className="text-stone-900 dark:text-white font-bold">{subtotal.toFixed(2)} ETB</span>
          </div>
          {totalTip > 0 && (
            <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
              <span>Staff Tip / Gratuity</span>
              <span>+{totalTip.toFixed(2)} ETB</span>
            </div>
          )}
          {discountPercent > 0 && (
            <div className="flex justify-between text-red-600 dark:text-rose-500 font-bold">
              <span>Discount ({discountPercent}%)</span>
              <span>-{discountAmount.toFixed(2)} ETB</span>
            </div>
          )}
          <div className="flex justify-between text-stone-400 text-[11px]">
            <span>VAT (15%)</span>
            <span className="font-semibold text-stone-500">Included in prices</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-stone-200 dark:border-white/10 text-sm font-bold text-stone-900 dark:text-white">
            <span>Total Due</span>
            <span className="text-amber-700 dark:text-amber-400 text-base sm:text-lg font-black">{total.toFixed(2)} ETB</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="destructive"
            size="lg"
            disabled={cart.length === 0 || loading}
            onClick={() => {
              handlePlaceOrder();
              if (isMobile) setMobileCartOpen(false);
            }}
            className="flex-1"
          >
            <span>
              {loading
                ? "Firing..."
                : editingSlipTarget
                  ? "Update Order"
                  : appendOrderTarget
                    ? "Append to Bill"
                    : "Fire to Kitchen"}
            </span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Button>

          <Button
            variant="primary"
            size="lg"
            disabled={cart.length === 0 && !lastCompletedOrder}
            onClick={() => {
              setPaymentModalOpen(true);
              if (isMobile) setMobileCartOpen(false);
            }}
            title="Pay & Settle Tender"
          >
            <CreditCard className="w-4 h-4" />
            <span>Settle Bill</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-[#F8F9FA] text-stone-900 relative transition-colors font-sans">
      {/* ================= CASHIER TOP CONTROL BAR ================= */}
      <div className="bg-white border-b border-stone-200/90 px-3.5 sm:px-6 py-2.5 z-20 flex items-center justify-between gap-2 sm:gap-4 flex-shrink-0">
        {/* Left: Station Identity & Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-stone-500">
            <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="truncate">Cashier Terminal</span>
          </div>

          {/* Primary View Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200/80 shadow-2xs">
              <button
                onClick={() => setPosTab('orders')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  posTab === 'orders'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Orders & Billing</span>
                {(incomingSlips.length > 0 || unpaidOrders.length > 0) && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    posTab === 'orders' ? 'bg-emerald-800 text-white' : 'bg-[#C11221] text-white'
                  }`}>
                    {incomingSlips.length + unpaidOrders.length}
                  </span>
                )}
              </button>
            </div>

            {/* Active editing/appending indicator */}
            {(editingSlipTarget || appendOrderTarget) && (
              <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
                <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {editingSlipTarget
                    ? `Editing ${editingSlipTarget.orderNumber?.startsWith('#') ? editingSlipTarget.orderNumber : `#${editingSlipTarget.orderNumber}`}`
                    : `Appending to ${appendOrderTarget.orderNumber?.startsWith('#') ? appendOrderTarget.orderNumber : `#${appendOrderTarget.orderNumber}`}`}
                </span>
                <button
                  onClick={() => {
                    clearCart();
                    setEditingSlipTarget(null);
                    setAppendOrderTarget(null);
                    setPosTab('orders');
                    loadData();
                  }}
                  className="ml-1 text-[10px] text-red-600 hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Tools (Refresh only — Floor Plan button removed since it is on the bottom bar) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={loadData}
            disabled={isRefreshing}
            title="Refresh Orders & Slips"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-stone-600'}`} />
          </Button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successOrder && (
        <div className="mx-3.5 sm:mx-6 mt-3 bg-emerald-950/70 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between text-white shadow-xl animate-fade-in backdrop-blur-xl z-20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="text-xs font-bold">Order {successOrder} Fired Successfully!</div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setReceiptModalOpen(true)}
          >
            <Receipt className="w-3 h-3" />
            <span>Print</span>
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 1: ORDERS & BILLING COMMAND CENTER (DEFAULT / MAIN)  */}
      {/* ========================================================= */}
      {posTab === 'orders' && (
        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 overflow-y-auto pb-24 lg:pb-6 relative z-10 no-scrollbar bg-[#F8F9FA]">
          {/* Compact Clickable Stat Cards (Function as interactive filters) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 mb-3 flex-shrink-0">
            {/* 1. All Orders */}
            <div
              onClick={() => setOrderFilter('ALL')}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                orderFilter === 'ALL'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white border-stone-200/90 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                  All Orders
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  orderFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  <Receipt className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-black text-stone-900">
                {daySlips.length + dayFilteredOrders.length}
              </div>
            </div>

            {/* 2. Pending Slips */}
            <div
              onClick={() => setOrderFilter(orderFilter === 'SLIPS' ? 'ALL' : 'SLIPS')}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                orderFilter === 'SLIPS'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-white border-stone-200/90 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                  Pending Firing
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  daySlips.length > 0 ? 'bg-amber-500/20 text-amber-700' : 'bg-stone-100 text-stone-500'
                }`}>
                  <Flame className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-1.5">
                <span>{daySlips.length}</span>
                {daySlips.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C11221] text-white font-bold">
                    Action Required
                  </span>
                )}
              </div>
            </div>

            {/* 3. Unpaid Bills */}
            <div
              onClick={() => setOrderFilter(orderFilter === 'UNPAID' ? 'ALL' : 'UNPAID')}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                orderFilter === 'UNPAID'
                  ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-white border-stone-200/90 hover:border-rose-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                  Unpaid Bills
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  orderFilter === 'UNPAID' ? 'bg-rose-600 text-white' : 'bg-rose-500/15 text-rose-600'
                }`}>
                  <CreditCard className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-black text-rose-600">
                {unpaidOrders.length}
              </div>
              <div className="text-[10px] text-stone-500 font-bold truncate">
                {unpaidTotalAmount.toFixed(2)} ETB
              </div>
            </div>

            {/* 4. In Kitchen Prep */}
            <div
              onClick={() => setOrderFilter(orderFilter === 'PREPARING' ? 'ALL' : 'PREPARING')}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                orderFilter === 'PREPARING'
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-white border-stone-200/90 hover:border-blue-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                  In Kitchen
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  orderFilter === 'PREPARING' ? 'bg-blue-600 text-white' : 'bg-blue-500/15 text-blue-600'
                }`}>
                  <Clock className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-black text-stone-900">
                {inPrepCount}
              </div>
            </div>

            {/* 5. Ready to Serve */}
            <div
              onClick={() => setOrderFilter(orderFilter === 'READY' ? 'ALL' : 'READY')}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                orderFilter === 'READY'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white border-stone-200/90 hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                  Ready to Serve
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  orderFilter === 'READY' ? 'bg-emerald-600 text-white' : 'bg-emerald-500/15 text-emerald-600'
                }`}>
                  <CheckCircle className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-600">
                {readyCount}
              </div>
            </div>

            {/* 6. Served Orders */}
            <div
              onClick={() => setOrderFilter(orderFilter === 'SERVED' ? 'ALL' : 'SERVED')}
              className={`p-2 sm:p-2.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                orderFilter === 'SERVED'
                  ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
                  : 'bg-white border-stone-200/90 hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                  Served
                </span>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  orderFilter === 'SERVED' ? 'bg-purple-600 text-white' : 'bg-purple-500/15 text-purple-700'
                }`}>
                  <Utensils className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base sm:text-xl font-black text-purple-700">
                {servedCount}
              </div>
            </div>
          </div>

          {/* Search, Day Range & Active Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 mb-3 bg-white border border-stone-200/90 rounded-2xl p-2.5 px-3.5 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs sm:text-sm font-black text-stone-900 uppercase tracking-tight whitespace-nowrap">
                Active Bills ({filteredOrders.length})
              </h2>
              {orderFilter !== 'ALL' && (
                <button
                  onClick={() => setOrderFilter('ALL')}
                  className="text-[10px] font-bold text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
                >
                  Clear Filter ({orderFilter === 'SERVED' ? 'Served' : orderFilter === 'UNPAID' ? 'Unpaid' : orderFilter === 'PREPARING' ? 'Kitchen' : orderFilter === 'READY' ? 'Ready' : orderFilter}) ✕
                </button>
              )}
            </div>

            {/* Day Filter Segmented Controls (Today by default, Yesterday, 2 Days Ago, 3-Day View, All Days) */}
            <div className="flex items-center bg-stone-100 p-0.5 sm:p-1 rounded-xl border border-stone-200/80 gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  dateFilter === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>Today</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  dateFilter === 'today' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {dayCounts.today.total}
                </span>
                {dayCounts.today.unpaid > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title={`${dayCounts.today.unpaid} unpaid bills today`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('yesterday')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  dateFilter === 'yesterday'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span>Yesterday</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  dateFilter === 'yesterday' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {dayCounts.yesterday.total}
                </span>
                {dayCounts.yesterday.unpaid > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title={`${dayCounts.yesterday.unpaid} unpaid bills from yesterday`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('day_before')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  dateFilter === 'day_before'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span>{dayBeforeDateLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  dateFilter === 'day_before' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {dayCounts.day_before.total}
                </span>
                {dayCounts.day_before.unpaid > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title={`${dayCounts.day_before.unpaid} unpaid bills`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('3_days')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  dateFilter === '3_days'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
                title="View all orders across the 3-day window"
              >
                <span>Past 3 Days</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  dateFilter === '3_days' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {dayCounts.threeDays}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  dateFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
                title="View all orders across all recorded days"
              >
                <span>All Days</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  dateFilter === 'all' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {dayCounts.all.total}
                </span>
                {dayCounts.all.unpaid > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title={`${dayCounts.all.unpaid} total unpaid bills`} />
                )}
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full lg:w-64 flex-shrink-0">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search table, order #, guest..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-8 py-1.5 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500"
              />
              {orderSearch && (
                <button
                  onClick={() => setOrderSearch('')}
                  className="p-1 text-stone-400 hover:text-stone-900 transition absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* INCOMING WAITER SLIPS SECTION: Cashier Reviews & Fires to Kitchen */}
          {filteredSlips.length > 0 && (
            <div className="mb-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl p-3.5 sm:p-4 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-emerald-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <BellRing className="w-4 h-4 font-bold" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-2">
                      <span>Incoming Waiter Notes</span>
                      <span className="bg-[#C11221] text-white text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-black">
                        {filteredSlips.length} Pending Firing
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Floor notes taken by waiters — review, edit or send straight to kitchen KDS
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredSlips.map((slip) => {
                  const isSlipTakeaway = slip.orderType === "TAKEAWAY";

                  return (
                    <div
                      key={slip.id}
                      className="p-4 rounded-2xl border transition-all bg-amber-50/60 border-amber-300 shadow-xs flex flex-col justify-between gap-3 hover:border-amber-400"
                    >
                      <div>
                        {/* Card Header: Separated into clean non-colliding rows (identical to Waiter) */}
                        <div className="pb-3 border-b border-amber-200/80 space-y-2">
                          {/* Row 1: Order Number + Table and Order Time */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base font-black text-stone-900 tracking-tight flex-shrink-0">
                                {slip.orderNumber?.startsWith('#') ? slip.orderNumber : `#${slip.orderNumber}`}
                              </span>
                              <span className="text-xs font-bold text-stone-700 truncate">
                                {isSlipTakeaway
                                  ? `🛍️ Takeaway (${slip.customerName || 'Guest'})`
                                  : `🍽️ Table ${slip.table?.tableNumber || 'Assigned'}`}
                              </span>
                            </div>

                            {/* Order Time Pill */}
                            <div className="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border flex-shrink-0 whitespace-nowrap bg-amber-100 text-amber-900 border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                              <span>{formatTime(slip.createdAt)}</span>
                            </div>
                          </div>

                          {/* Row 2: Status Badge + Attribution */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <Badge variant="amber">
                              ⏳ Awaiting Cashier Firing
                            </Badge>

                            <div className="text-[11px] text-stone-500 flex items-center gap-1.5 ml-auto">
                              <span>Server: <strong className="text-stone-800">{slip.waiter?.name || 'Waiter'}</strong></span>
                              {slip.customerName && <span>• Guest: <strong>{slip.customerName}</strong></span>}
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-3 text-xs text-stone-600 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                          {slip.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between">
                              <span className="truncate pr-2">
                                <strong className="text-stone-900 mr-1.5">{item.quantity}x</strong>
                                <span className="text-stone-800">{item.menuItem?.name || item.name}</span>
                                {item.specialInstructions && (
                                  <span className="text-[10px] text-emerald-700 italic ml-1">
                                    &quot;{item.specialInstructions}&quot;
                                  </span>
                                )}
                              </span>
                              <span className="text-stone-500 font-mono text-[11px] whitespace-nowrap">
                                {Number(item.subtotal || (item.unitPrice || item.price) * item.quantity).toFixed(2)} ETB
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions & Total */}
                      <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-stone-900">
                          {Number(slip.totalAmount || 0).toFixed(2)} ETB
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => confirmWaiterSlipDirectly(slip.id)}
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Fire to Kitchen</span>
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReviewWaiterSlip(slip)}
                            title="Edit items in slip before firing"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-stone-600" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRejectWaiterSlip(slip.id)}
                            className="text-stone-400 hover:text-[#C11221]"
                            title="Reject order note"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIVE ACTIVE & DINING ORDERS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Active Bills & Tickets</span>
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-bold">
                  ({filteredOrders.length})
                </span>
              </h3>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-stone-200/90 rounded-3xl p-12 text-center text-stone-400 shadow-xs">
                <Receipt className="w-12 h-12 mx-auto mb-3 stroke-1 text-stone-300" />
                <p className="text-sm font-bold text-stone-700">No orders matching this filter</p>
                <p className="text-xs mt-1 text-stone-500">
                  Try changing your status filter or tap &quot;+ New Order&quot; to ring up a guest.
                </p>
                <button
                  onClick={() => {
                    clearCart();
                    setAppendOrderTarget(null);
                    setEditingSlipTarget(null);
                    setPosTab('menu');
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition"
                >
                  + Create New Order
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5">
                {filteredOrders.map((order) => {
                  const isReady = order.status === 'READY';
                  const isServed = order.status === 'SERVED';
                  const isPaid = order.paymentStatus === 'PAID';
                  const isOrderTakeaway = order.orderType === 'TAKEAWAY';

                  const statusLabel =
                    order.status === 'CONFIRMED'
                    ? 'In Kitchen'
                    : order.status === 'IN_PREPARATION'
                    ? 'Cooking'
                    : order.status === 'READY'
                    ? 'Ready to Serve'
                    : order.status === 'SERVED'
                    ? 'Served'
                    : order.status === 'COMPLETED'
                    ? 'Completed'
                    : order.status;

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isReady
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                          : isServed
                          ? 'bg-purple-50/40 border-purple-200/90 shadow-xs'
                          : 'bg-white border-stone-200/90 shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Card Header: Separated into clean non-colliding rows (identical to Waiter) */}
                        <div className="pb-3 border-b border-stone-200/70 space-y-2">
                          {/* Row 1: Order Number + Table / Destination and Order Time */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base font-black text-stone-900 tracking-tight flex-shrink-0">
                                {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                              </span>
                              <span className="text-xs font-bold text-stone-700 truncate">
                                {isOrderTakeaway
                                  ? `🛍️ Takeaway (${order.customerName || 'Guest'})`
                                  : `🍽️ Table ${order.table?.tableNumber || 'Guest'}`}
                              </span>
                            </div>

                            {/* Order Time */}
                            <div className="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border flex-shrink-0 whitespace-nowrap bg-stone-100 text-stone-700 border-stone-200">
                              <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                              <span>{formatTime(order.createdAt)}</span>
                            </div>
                          </div>

                          {/* Row 2: Status Badge + Payment Badge + Attribution */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant={
                                  isReady
                                    ? 'success'
                                    : isServed
                                    ? 'purple'
                                    : order.status === 'IN_PREPARATION'
                                    ? 'info'
                                    : order.status === 'CONFIRMED'
                                    ? 'amber'
                                    : 'default'
                                }
                              >
                                {statusLabel}
                              </Badge>

                              {/* Payment Badge */}
                              <Badge variant={isPaid ? 'success' : 'destructive'}>
                                {isPaid ? 'PAID' : 'UNPAID'}
                              </Badge>
                            </div>

                            {/* Staff Attribution */}
                            <div className="text-[11px] text-stone-500 flex items-center gap-1.5 ml-auto flex-wrap">
                              {order.waiter && (
                                <span>
                                  Server: <strong className="text-stone-800">{order.waiter.name}</strong>
                                </span>
                              )}
                              {order.cashier && (
                                <span>
                                  • Cashier: <strong className="text-stone-800">{order.cashier.name}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items: Clean unboxed typography matching Waiter */}
                        <div className="mt-3 text-xs text-stone-600 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                          {order.items?.map((itm: any) => (
                            <div key={itm.id} className="flex items-center justify-between">
                              <span className="truncate pr-2">
                                <strong className="text-stone-900 mr-1.5">{itm.quantity}x</strong>
                                <span className="text-stone-800">{itm.menuItem?.name || itm.name}</span>
                                {itm.specialInstructions && (
                                  <span className="text-[10px] text-emerald-700 italic ml-1">
                                    &quot;{itm.specialInstructions}&quot;
                                  </span>
                                )}
                              </span>
                              <span className="text-stone-500 font-mono text-[11px] whitespace-nowrap">
                                {Number(itm.subtotal || (itm.unitPrice || itm.price) * itm.quantity).toFixed(2)} ETB
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions & Total Bill */}
                      <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-stone-900">
                          {Number(order.totalAmount || 0).toFixed(2)} ETB
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Edit / Modify Order Items (Add or Remove items) */}
                          {!isPaid && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStartEditOrder(order)}
                              title="Edit order items (add or remove items)"
                            >
                              <FileEdit className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Edit</span>
                            </Button>
                          )}

                          {/* Add Items */}
                          {!isPaid && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStartAppendItems(order)}
                              title="Add more items to this bill"
                            >
                              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>+ Items</span>
                            </Button>
                          )}

                          {/* Print Receipt / Bill */}
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            onClick={() => {
                              setLastCompletedOrder(order);
                              setReceiptModalOpen(true);
                            }}
                            title="Print Bill / Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 text-stone-600" />
                          </Button>

                          {/* Settle Bill Button */}
                          {!isPaid ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setOrderToSettle(order);
                                setPaymentModalOpen(true);
                              }}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Settle Bill</span>
                            </Button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                              <span>Settled</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: PRODUCT CATALOG & ORDER CREATION (WHEN NEEDED)    */}
      {/* ========================================================= */}
      {posTab === 'menu' && (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Main Left: Menu Browse & Item Selection */}
          <div className="flex-1 min-h-0 flex flex-col p-3.5 sm:p-6 overflow-y-auto pb-28 lg:pb-6 relative z-10 no-scrollbar">
            {/* Top Back to Orders Banner */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setPosTab('orders')}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Back to Orders & Billing</span>
              </button>

              {editingSlipTarget ? (
                <div className="bg-amber-500/20 text-amber-900 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Editing Waiter Note{' '}
                    {editingSlipTarget.orderNumber?.startsWith('#')
                      ? editingSlipTarget.orderNumber
                      : `#${editingSlipTarget.orderNumber}`}
                  </span>
                  <button
                    onClick={() => {
                      clearCart();
                      setEditingSlipTarget(null);
                      loadData();
                    }}
                    className="ml-1 text-red-600 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : appendOrderTarget ? (
                <div className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    Appending to{' '}
                    {appendOrderTarget.orderNumber?.startsWith('#')
                      ? appendOrderTarget.orderNumber
                      : `#${appendOrderTarget.orderNumber}`}
                  </span>
                  <button
                    onClick={() => setAppendOrderTarget(null)}
                    className="ml-1 text-red-600 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>

            {/* UNIFIED POS ACTION BAR */}
            <div className="bg-white/90 dark:bg-[#161311]/90 backdrop-blur-xl border border-stone-200/90 dark:border-white/10 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 mb-2.5 shadow-xs transition-colors">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                {/* Fulfillment Mode (Dine-In vs Takeaway) & Table Picker */}
                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                  {/* Segmented Mode Switcher */}
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setOrderType('DINE_IN')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        orderType === 'DINE_IN'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                      title="Dine-In Table Order"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Dine-In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderType('TAKEAWAY')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        orderType === 'TAKEAWAY'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                      title="Takeaway Order"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Takeaway</span>
                    </button>
                  </div>

                  {/* Takeaway: Quick Customer Name */}
                  {orderType === 'TAKEAWAY' && (
                    <input
                      type="text"
                      placeholder="Customer name..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="flex-1 sm:w-36 bg-stone-100 border border-stone-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2 flex-1 sm:max-w-md min-w-0">
                  <div className="flex items-center bg-stone-100 border border-stone-200/80 focus-within:border-emerald-500 rounded-xl px-3 py-1.5 flex-1 min-w-0 transition relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search dishes, burgers, pizza..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-stone-900 focus:outline-none placeholder-stone-400 pr-5"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-0.5 text-stone-400 hover:text-stone-900 transition absolute right-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-3 no-scrollbar flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setGroupFilter('ALL');
                  setSelectedCategory('');
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition cursor-pointer border ${
                  groupFilter === 'ALL' && !selectedCategory
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs ring-1 ring-emerald-400'
                    : 'bg-white border-stone-200/90 text-stone-700 hover:text-stone-950 hover:bg-stone-50'
                }`}
              >
                <span>🍽️</span>
                <span>All Items</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  groupFilter === 'ALL' && !selectedCategory ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600'
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
                    type="button"
                    onClick={() => {
                      setGroupFilter(isActive ? 'ALL' : (cat.id as any));
                      setSelectedCategory('');
                    }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition cursor-pointer border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs ring-1 ring-emerald-400 font-black'
                        : 'bg-white border-stone-200/90 text-stone-700 hover:text-stone-950 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-sm">{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-emerald-800 text-white font-black' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Food Items Grid (Using shared MenuItemCard) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.menuItemId === item.id);
                const qty = inCart ? inCart.quantity : 0;

                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={qty}
                    onAdd={(it) =>
                      addToCart({
                        id: it.id,
                        name: it.name,
                        price: Number(it.price),
                        imageUrl: it.imageUrl,
                        isDirectSale: it.isDirectSale,
                      })
                    }
                    onUpdateQuantity={(it, delta) => updateQuantity(it.id, delta)}
                  />
                );
              })}
            </div>
          </div>

          {/* DESKTOP RIGHT CART PANEL (>=lg) */}
          <div className="hidden lg:flex w-80 xl:w-96 bg-white dark:bg-[#12100E]/95 backdrop-blur-2xl border-l border-stone-200/90 dark:border-white/10 flex-col h-full shadow-xl flex-shrink-0 relative z-20 text-stone-900 dark:text-white transition-colors">
            {renderCartPanel(false)}
          </div>
        </div>
      )}

      {/* MOBILE FLOATING BILL SUMMARY BAR (<lg) */}
      {cart.length > 0 && posTab === 'menu' && (
        <div className="lg:hidden fixed bottom-16 left-3 right-3 z-30 animate-in slide-in-from-bottom duration-300">
          <div
            onClick={() => setMobileCartOpen(true)}
            className="bg-white/95 backdrop-blur-xl border border-stone-200/90 p-2.5 sm:p-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition text-stone-900"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5 truncate">
                  <span>{totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} in Slip</span>
                  <span className="text-[10px] bg-[#C11221] text-white px-1.5 py-0.2 rounded-full font-black flex-shrink-0">
                    {isTakeaway ? 'Takeaway' : `Table ${selectedTable}`}
                  </span>
                </div>
                <div className="text-sm font-black text-emerald-700">
                  {total.toFixed(2)} ETB <span className="text-[10px] text-stone-500 font-normal">(incl. VAT)</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileCartOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition flex-shrink-0"
            >
              <span>View Slip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION DOCK (<lg) */}
      <div className="lg:hidden fixed bottom-2 left-3 right-3 z-30 bg-white/95 backdrop-blur-2xl border border-stone-200/90 rounded-3xl p-1.5 px-4 shadow-xl flex items-center justify-around text-stone-900">
        {/* Orders & Bills (Main Cashier function) */}
        <button
          onClick={() => setPosTab('orders')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition cursor-pointer ${
            posTab === 'orders' ? 'text-emerald-600 font-black' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Receipt className="w-5 h-5" />
          {(incomingSlips.length > 0 || unpaidOrders.length > 0) && (
            <span className="absolute top-0 right-2 bg-[#C11221] text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-lg border border-white/20">
              {incomingSlips.length + unpaidOrders.length}
            </span>
          )}
          <span className="text-[10px] font-bold">Orders & Bills</span>
        </button>

        {/* New Order / Menu */}
        <button
          onClick={() => {
            setAppendOrderTarget(null);
            setPosTab('menu');
          }}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition cursor-pointer ${
            posTab === 'menu' ? 'text-emerald-600 font-black' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <div className="relative">
            <Utensils className="w-5 h-5" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-lg border border-white/20">
                {totalCartItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">New Order</span>
        </button>

        {/* Floor Plan Tables */}
        <button
          onClick={() => setTableModalOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition cursor-pointer ${
            selectedTable ? 'text-emerald-700 font-black' : 'text-stone-500 hover:text-emerald-600'
          }`}
          title="Open Dining Tables & Floor Plan"
        >
          <div className="relative">
            <LayoutGrid className="w-5 h-5" />
            {selectedTable && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 absolute -top-0.5 -right-0.5" />
            )}
          </div>
          <span className="text-[10px] font-bold">
            {selectedTable ? `Table ${selectedTable}` : 'Tables'}
          </span>
        </button>
      </div>

      {/* MOBILE CART / BILL DRAWER (<lg) */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="relative bg-white dark:bg-[#12100E] border-t border-stone-200 dark:border-white/15 rounded-t-[32px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 z-10">
            {renderCartPanel(true)}
          </div>
        </div>
      )}

      {/* Modals */}
      <TablePlanModal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={handleSelectTable}
        onTablesUpdated={setTables}
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
