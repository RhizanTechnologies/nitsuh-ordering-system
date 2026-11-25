'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore, CartItem } from '@/lib/store';
import { fetchApi, getSocket } from '@/lib/api';
import { calculatePrepTime } from '@/lib/timer-utils';
import { playReadyChime } from '@/lib/audio';
import { MenuImage } from '@/components/MenuImage';
import { MenuItemCard } from '@/components/MenuItemCard';
import {
  Send,
  AlertCircle,
  Plus,
  Minus,
  CheckCircle2,
  Search,
  MessageSquare,
  X,
  LayoutGrid,
  ShoppingBag,
  Clock,
  BellRing,
  Check,
  Coffee,
  Sandwich,
  Cake,
  Leaf,
  ChevronDown,
  Sparkles,
  Pizza,
  CupSoda,
  Drumstick,
  MapPin,
  Utensils,
  Edit3,
  Loader2,
  Layers,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { TablePlanModal } from '@/components/TablePlanModal';
import { Button, Badge } from '@/components/ui';

export function WaiterPadView() {
  const {
    currentUser,
    waiterCart,
    addToWaiterCart,
    updateWaiterQuantity,
    setWaiterItemTip,
    waiterTable,
    setWaiterTable,
    waiterCustomerName,
    setWaiterCustomerName,
    waiterSpecialNotes,
    setWaiterSpecialNotes,
    setWaiterCart,
    clearWaiterCart,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'menu' | 'tracker'>('menu');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [takeawayCustomer, setTakeawayCustomer] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [tables, setTables] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOrderNumber, setSentOrderNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editing existing draft or appending to active order
  const [editingDraftOrder, setEditingDraftOrder] = useState<{
    id: string;
    orderNumber: string;
    tableNumber: string;
  } | null>(null);

  const [appendingOrder, setAppendingOrder] = useState<{
    id: string;
    orderNumber: string;
    tableNumber: string;
  } | null>(null);

  const editingDraftOrderRef = useRef(editingDraftOrder);
  editingDraftOrderRef.current = editingDraftOrder;
  const appendingOrderRef = useRef(appendingOrder);
  appendingOrderRef.current = appendingOrder;

  // In-App Tip Modal
  const [tipModal, setTipModal] = useState<{ itemId: string; name: string } | null>(null);
  const [customTipValue, setCustomTipValue] = useState('15');

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [readyToast, setReadyToast] = useState<any | null>(null);
  const [, setTick] = useState(0);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);

  const loadTables = () => {
    fetchApi('/menu/tables')
      .then((data) => {
        setTables(data);
        if (!editingDraftOrderRef.current && !appendingOrderRef.current) {
          const current = data.find((t: any) => t.tableNumber === waiterTable);
          if (!current || current.status !== 'AVAILABLE') {
            const firstAvail = data.find((t: any) => t.status === 'AVAILABLE');
            if (firstAvail) setWaiterTable(firstAvail.tableNumber);
          }
        }
      })
      .catch(() => {});
  };

  const loadActiveOrders = () => {
    fetchApi('/orders?statuses=CONFIRMED,IN_PREPARATION,READY,SERVED,DRAFT_NOTE')
      .then((data) => setActiveOrders(data))
      .catch(() => {});
  };

  const loadMenu = (retryCount = 0) => {
    setLoadingMenu(true);
    setMenuLoadError(null);
    Promise.all([
      fetchApi('/menu/categories').then((cats) => {
        setCategories(cats || []);
      }),
      fetchApi('/menu/items').then((items) => {
        setAllItems(items || []);
        // If items are empty and haven't retried yet, trigger one automatic retry for cold starts
        if ((!items || items.length === 0) && retryCount === 0) {
          setTimeout(() => loadMenu(retryCount + 1), 1500);
        }
      }),
    ])
      .catch((err: any) => {
        console.error('Failed to load menu data:', err);
        setMenuLoadError(err?.message || 'Unable to connect to menu server');
        if (retryCount === 0) {
          setTimeout(() => loadMenu(retryCount + 1), 1500);
        }
      })
      .finally(() => {
        setLoadingMenu(false);
      });
  };

  useEffect(() => {
    loadMenu();

    loadTables();
    loadActiveOrders();

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    const socket = getSocket();

    socket.on('tables:updated', (updated: any[]) => {
      setTables(updated);
      if (!editingDraftOrderRef.current && !appendingOrderRef.current) {
        const current = updated.find((t: any) => t.tableNumber === waiterTable);
        if (!current || current.status === 'OCCUPIED') {
          const firstAvail = updated.find((t: any) => t.status === 'AVAILABLE');
          if (firstAvail) setWaiterTable(firstAvail.tableNumber);
        }
      }
    });

    socket.on('waiter:new_order_note', (newOrder) => {
      setActiveOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    });

    socket.on('order:confirmed', (confirmedOrder) => {
      setActiveOrders((prev) => [confirmedOrder, ...prev.filter((o) => o.id !== confirmedOrder.id)]);
      loadTables();
    });

    socket.on('kitchen:order_status', (updatedOrder) => {
      setActiveOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      if (updatedOrder.status === 'READY') {
        if (updatedOrder.waiterId === currentUser?.id) {
          playReadyChime();
          setReadyToast(updatedOrder);
        }
      }
    });

    socket.on('kitchen:order_ready', (readyOrder) => {
      if (readyOrder.waiterId === currentUser?.id) {
        playReadyChime();
        setReadyToast(readyOrder);
      }
    });

    socket.on('order:updated', (updatedOrder) => {
      setActiveOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      loadTables();
    });

    return () => {
      clearInterval(interval);
      socket.off('tables:updated');
      socket.off('waiter:new_order_note');
      socket.off('order:confirmed');
      socket.off('kitchen:order_status');
      socket.off('kitchen:order_ready');
      socket.off('order:updated');
    };
  }, []);

  // Category helpers for grouping
  const isBurger = (catName: string, itemName: string = '') => {
    const c = (catName + ' ' + itemName).toLowerCase();
    return c.includes('burger') || c.includes('sandwich') || c.includes('wrap');
  };

  const isPizza = (catName: string, itemName: string = '') => {
    const c = (catName + ' ' + itemName).toLowerCase();
    return c.includes('pizza') || c.includes('calzone');
  };

  const isChicken = (catName: string, itemName: string = '') => {
    const c = (catName + ' ' + itemName).toLowerCase();
    return c.includes('chicken') || c.includes('meat') || c.includes('steak') || c.includes('beef') || c.includes('pasta');
  };

  const isFries = (catName: string, itemName: string = '') => {
    const c = (catName + ' ' + itemName).toLowerCase();
    return c.includes('fries') || c.includes('snack') || c.includes('potato') || c.includes('side') || c.includes('salad');
  };

  const isCoffee = (catName: string, itemName: string = '') => {
    const c = (catName + ' ' + itemName).toLowerCase();
    return c.includes('coffee') || c.includes('macchiato') || c.includes('tea') || c.includes('espresso') || c.includes('latte') || c.includes('cappuccino') || c.includes('hot drink');
  };

  const isDrinks = (catName: string) => {
    const c = catName.toLowerCase();
    return (
      c.includes('mojito') ||
      c.includes('soft') ||
      c.includes('water') ||
      c.includes('juice') ||
      c.includes('shake') ||
      c.includes('iced')
    );
  };

  const isBakery = (catName: string) => {
    const c = catName.toLowerCase();
    return c.includes('dessert') || c.includes('cake') || c.includes('torta') || c.includes('pastr');
  };

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
    const query = search.trim().toLowerCase();

    return allItems.filter((item) => {
      const catName = item.category?.name || '';

      if (groupFilter !== 'ALL') {
        const isCatMatch = item.categoryId === groupFilter || item.category?.id === groupFilter || catName.toLowerCase() === groupFilter.toLowerCase();
        if (categories.some((c) => c.id === groupFilter)) {
          if (!isCatMatch) return false;
        } else {
          if (groupFilter === 'FASTING' && !isFastingItem(item)) return false;
          if (groupFilter === 'BURGER' && !isBurger(catName, item.name)) return false;
          if (groupFilter === 'PIZZA' && !isPizza(catName, item.name)) return false;
          if (groupFilter === 'CHICKEN' && !isChicken(catName, item.name)) return false;
          if (groupFilter === 'FRIES' && !isFries(catName, item.name)) return false;
          if (groupFilter === 'COFFEE' && !isCoffee(catName, item.name)) return false;
          if (groupFilter === 'DRINKS' && !isDrinks(catName)) return false;
          if (groupFilter === 'BAKERY' && !isBakery(catName)) return false;
        }
      }

      if (selectedCategory && !query && item.categoryId !== selectedCategory) {
        return false;
      }

      if (query) {
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        const matchCat = catName.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [allItems, groupFilter, selectedCategory, search, categories]);

  const totalWaiterItems = waiterCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalWaiterBase = waiterCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalWaiterTip = waiterCart.reduce((sum, item) => sum + (item.tip || 0) * item.quantity, 0);
  // All menu prices are VAT-inclusive (15% included in base price)
  const totalWaiterTax = totalWaiterBase > 0 ? (totalWaiterBase * 0.15) / 1.15 : 0;
  const totalWaiterSum = totalWaiterBase + totalWaiterTip;

  const handleLoadDraftForEditing = (order: any, tableNumber?: string) => {
    const tblNum = tableNumber || order.table?.tableNumber || waiterTable;
    setWaiterTable(tblNum);
    setOrderType('DINE_IN');
    setEditingDraftOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: tblNum,
    });
    setAppendingOrder(null);

    const cartItems: CartItem[] = (order.items || []).map((it: any) => ({
      menuItemId: it.menuItemId || it.id,
      name: it.menuItem?.name || it.name || 'Item',
      price: Number(it.unitPrice || it.price || it.menuItem?.price || 0),
      imageUrl: it.menuItem?.imageUrl,
      quantity: it.quantity,
      tip: Number(it.tip || 0),
      specialInstructions: it.specialInstructions,
      selectedAddonIds: it.selectedAddonIds || [],
      selectedAddons: it.selectedAddons || [],
    }));
    setWaiterCart(cartItems);
    setWaiterSpecialNotes(order.notes || order.specialInstructions || '');
    setActiveTab('menu');
  };

  const handleStartAppendToOrder = (order: any, tableNumber?: string) => {
    const tblNum = tableNumber || order.table?.tableNumber || waiterTable;
    setWaiterTable(tblNum);
    setOrderType('DINE_IN');
    setAppendingOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: tblNum,
    });
    setEditingDraftOrder(null);
    clearWaiterCart();
    setActiveTab('menu');
  };

  const handleCancelEditOrAppend = () => {
    setEditingDraftOrder(null);
    setAppendingOrder(null);
    clearWaiterCart();
  };

  const handleSelectTable = (tableNumber: string, tableObj?: any) => {
    const tObj = tableObj || tables.find((t: any) => t.tableNumber === tableNumber);
    setTableModalOpen(false);

    if (tObj && tObj.status === 'OCCUPIED') {
      let activeOrder = activeOrders.find(
        (o: any) =>
          (o.tableId === tObj.id || o.table?.tableNumber === tableNumber) &&
          ['DRAFT_NOTE', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'SERVED'].includes(o.status) &&
          o.paymentStatus !== 'PAID'
      );
      if (!activeOrder && tObj.orders && tObj.orders.length > 0) {
        activeOrder = tObj.orders[0];
      }

      if (activeOrder) {
        if (activeOrder.status === 'DRAFT_NOTE') {
          // If not fired to kitchen yet: edit the order (add or remove items)
          handleLoadDraftForEditing(activeOrder, tableNumber);
          return;
        } else {
          // Already fired to kitchen: allow adding more items to the seated table
          handleStartAppendToOrder(activeOrder, tableNumber);
          return;
        }
      }
    }

    // Normal available table selection
    setEditingDraftOrder(null);
    setAppendingOrder(null);
    setWaiterTable(tableNumber);
    setOrderType('DINE_IN');
  };

  const handleSendToCashier = async () => {
    if (waiterCart.length === 0) return;

    const isTakeaway = orderType === 'TAKEAWAY';
    const selectedTableObj = isTakeaway ? null : tables.find((t) => t.tableNumber === waiterTable);

    if (!isTakeaway && (!waiterTable || !selectedTableObj)) {
      showError('Please select a valid dining table for Dine-In orders before sending.');
      return;
    }

    if (!isTakeaway && !editingDraftOrder && !appendingOrder && selectedTableObj.status !== 'AVAILABLE') {
      showError(`Table "${waiterTable}" is currently seated. Please select an open table, or tap it to edit or append items.`);
      return;
    }

    setSending(true);

    try {
      if (editingDraftOrder) {
        // Edit existing draft note: replace items and update notes
        const res = await fetchApi(`/orders/${editingDraftOrder.id}/draft-note`, {
          method: 'PUT',
          body: JSON.stringify({
            notes: waiterSpecialNotes.trim() || undefined,
            items: waiterCart.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              tip: i.tip || 0,
              specialInstructions: i.specialInstructions || undefined,
              selectedAddonIds: i.selectedAddonIds || [],
              selectedAddons: i.selectedAddons || [],
            })),
          }),
        });

        setSentOrderNumber(res?.orderNumber || editingDraftOrder.orderNumber);
        setEditingDraftOrder(null);
        clearWaiterCart();
        setShowMobileDrawer(false);
        loadActiveOrders();
        loadTables();
        setTimeout(() => setSentOrderNumber(null), 6000);
      } else if (appendingOrder) {
        // Append extra items to active kitchen ticket
        const res = await fetchApi(`/orders/${appendingOrder.id}/append-items`, {
          method: 'POST',
          body: JSON.stringify({
            actorUserId: currentUser?.id,
            items: waiterCart.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              tip: i.tip || 0,
              specialInstructions: i.specialInstructions || undefined,
              selectedAddonIds: i.selectedAddonIds || [],
              selectedAddons: i.selectedAddons || [],
            })),
          }),
        });

        setSentOrderNumber(res?.orderNumber || appendingOrder.orderNumber);
        setAppendingOrder(null);
        clearWaiterCart();
        setShowMobileDrawer(false);
        loadActiveOrders();
        loadTables();
        setTimeout(() => setSentOrderNumber(null), 6000);
      } else {
        // New waiter order note
        const res = await fetchApi('/orders/waiter-note', {
          method: 'POST',
          body: JSON.stringify({
            waiterId: currentUser?.id || 'w01-waiter',
            orderType,
            tableId: selectedTableObj ? selectedTableObj.id : null,
            customerName: isTakeaway
              ? (takeawayCustomer.trim() || 'Takeaway Customer')
              : (waiterCustomerName.trim() || 'Table Guest'),
            notes: waiterSpecialNotes.trim() || undefined,
            items: waiterCart.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              tip: i.tip || 0,
              specialInstructions: i.specialInstructions || undefined,
              selectedAddonIds: i.selectedAddonIds || [],
              selectedAddons: i.selectedAddons || [],
            })),
          }),
        });

        setSentOrderNumber(res.orderNumber);
        clearWaiterCart();
        setShowMobileDrawer(false);
        loadActiveOrders();
        loadTables();
        setTimeout(() => setSentOrderNumber(null), 6000);
      }
    } catch (err: any) {
      showError(`Error sending order note: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleMarkServed = async (orderId: string) => {
    try {
      const updated = await fetchApi(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'SERVED',
          actorUserId: currentUser?.id || 'w01-waiter',
        }),
      });
      setActiveOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
    } catch (err: any) {
      showError(`Error marking served: ${err.message}`);
    }
  };

  const destinationLabel =
    orderType === 'TAKEAWAY'
      ? `🛍️ Takeaway (${takeawayCustomer.trim() || 'Customer'})`
      : `🍽️ Table ${waiterTable || '—'}`;

  const isManagerOrOwner = currentUser?.role === 'MANAGER' || currentUser?.role === 'OWNER';
  const inFlightOrders = activeOrders.filter(
    (o) =>
      ['DRAFT_NOTE', 'CONFIRMED', 'IN_PREPARATION', 'READY'].includes(o.status) &&
      (isManagerOrOwner || !currentUser?.id || o.waiterId === currentUser.id)
  );

  const delayedOrders = inFlightOrders.filter((o) => {
    const prep = calculatePrepTime(o.createdAt);
    return prep.delayStatus === 'DELAYED';
  });

  const selectedTableObj = tables.find((t) => t.tableNumber === waiterTable);
  const isCurrentTableOccupied = orderType === 'DINE_IN' && selectedTableObj?.status === 'OCCUPIED';

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('burger')) return Sandwich;
    if (n.includes('chicken') || n.includes('meat') || n.includes('beef')) return Drumstick;
    if (n.includes('pizza')) return Pizza;
    if (n.includes('fries') || n.includes('snack') || n.includes('side')) return Sparkles;
    if (n.includes('drink') || n.includes('beverage') || n.includes('soda') || n.includes('juice') || n.includes('water')) return CupSoda;
    if (n.includes('coffee') || n.includes('tea') || n.includes('latte')) return Coffee;
    if (n.includes('dessert') || n.includes('cake') || n.includes('bakery')) return Cake;
    if (n.includes('fasting') || n.includes('salad') || n.includes('vegan')) return Leaf;
    if (n.includes('addon') || n.includes('add-on') || n.includes('extra') || n.includes('modifier')) return Layers;
    return Utensils;
  };

  const dynamicCategoryCards = useMemo(() => {
    const cards: Array<{ id: string; label: string; icon: any }> = [
      { id: 'ALL', label: 'All Menu', icon: LayoutGrid },
    ];
    if (categories && categories.length > 0) {
      for (const c of categories) {
        cards.push({
          id: c.id,
          label: c.name,
          icon: getCategoryIcon(c.name),
        });
      }
    } else {
      // Fallback default set if categories API hasn't loaded yet
      cards.push(
        { id: 'BURGER', label: 'Burger', icon: Sandwich },
        { id: 'CHICKEN', label: 'Chicken', icon: Drumstick },
        { id: 'PIZZA', label: 'Pizza', icon: Pizza },
        { id: 'FRIES', label: 'Fries', icon: Sparkles },
        { id: 'DRINKS', label: 'Drink', icon: CupSoda },
        { id: 'COFFEE', label: 'Coffee', icon: Coffee },
        { id: 'BAKERY', label: 'Dessert', icon: Cake },
        { id: 'FASTING', label: 'Fasting', icon: Leaf },
      );
    }
    return cards;
  }, [categories]);

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-[#F8F9FA] text-stone-900">
      {/* Real-time Ready Alert Toast */}
      {readyToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#C11221] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-amber-400">
          <BellRing className="w-5 h-5 text-amber-300 animate-pulse" />
          <div className="text-xs">
            <div className="font-extrabold text-sm flex items-center gap-1.5">
              <span>Order {readyToast.orderNumber} is READY!</span>
            </div>
            <div className="text-white/90">
              {readyToast.orderType === 'TAKEAWAY'
                ? `Takeaway (${readyToast.customerName})`
                : `Table ${readyToast.table?.tableNumber || 'Guest'}`} • Ready for serving at kitchen counter!
            </div>
          </div>
          <button
            onClick={() => setReadyToast(null)}
            className="p-1 hover:bg-black/30 rounded-lg text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}



      {/* Active Edit/Append Banner */}
      {editingDraftOrder && (
        <div className="bg-amber-400 text-amber-950 px-4 py-2 flex items-center justify-between text-xs font-bold shadow-xs z-20 flex-shrink-0 border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-950" />
            <span>Editing Draft Note #{editingDraftOrder.orderNumber} for Table {editingDraftOrder.tableNumber} — Add, remove, or adjust quantities</span>
          </div>
          <button
            type="button"
            onClick={handleCancelEditOrAppend}
            className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-950 rounded-lg text-xs font-black shadow-xs cursor-pointer"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {appendingOrder && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold shadow-xs z-20 flex-shrink-0 border-b border-emerald-700/30">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-white" />
            <span>Adding Items to Table {appendingOrder.tableNumber} (Order #{appendingOrder.orderNumber}) — Active Kitchen Ticket</span>
          </div>
          <button
            type="button"
            onClick={handleCancelEditOrAppend}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
        {/* COLUMN 1: LEFT VERTICAL CATEGORY SIDEBAR (Seamlessly merged with unified background) */}
        {activeTab === 'menu' && (
          <aside className="w-16 sm:w-20 md:w-24 bg-[#F8F9FA] border-r border-stone-200/70 py-2 sm:py-3 px-1 sm:px-1.5 space-y-1.5 overflow-y-auto no-scrollbar flex-shrink-0 z-10 flex flex-col pb-24 lg:pb-4">
            {dynamicCategoryCards.map((cat) => {
              const isActive = groupFilter === cat.id;
              const Icon = cat.icon;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setGroupFilter(cat.id as any);
                    setSelectedCategory('');
                  }}
                  className={`w-full flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl transition text-center gap-1 group cursor-pointer ${
                    isActive
                      ? 'bg-white shadow-xs border border-emerald-500/40 text-emerald-800 font-black'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-stone-600 shadow-2xs border border-stone-200/70 group-hover:border-stone-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-tight leading-tight truncate max-w-full px-0.5">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* COLUMN 2: CENTER PRODUCT FOOD CARDS GRID OR LIVE TRACKER */}
        <main className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 overflow-y-auto pb-24 lg:pb-6 no-scrollbar">
          {/* Top Control Bar:
              - On Menu tab: Search Bar + Live Status Toggle
              - On Tracker tab: Back to Food Menu Button + Active counter
          */}
          {activeTab === 'menu' ? (
            <div className="space-y-2.5 mb-3.5 flex-shrink-0">
              {/* Row 1: Search Input + Live Status Toggle */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex-1 relative flex items-center">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search food, drinks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white hover:border-stone-300 focus:border-emerald-500 border border-stone-200/90 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none transition shadow-2xs font-sans"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 p-0.5 text-stone-400 hover:text-stone-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Live Kitchen Preparation Status Toggle Button */}
                <button
                  onClick={() => setActiveTab('tracker')}
                  className="px-3 sm:px-3.5 py-2.5 rounded-2xl border transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer text-xs font-bold font-sans flex-shrink-0 bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs active:scale-95"
                  title="Open Live Kitchen Preparation Monitor"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="whitespace-nowrap">Live Status</span>
                  {inFlightOrders.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        delayedOrders.length > 0
                          ? 'bg-[#C11221] text-white animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {inFlightOrders.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-3.5 flex-shrink-0">
              <button
                onClick={() => setActiveTab('menu')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
              >
                <Utensils className="w-4 h-4" />
                <span>Back to Food Menu</span>
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-stone-600 bg-white border border-stone-200 px-3 py-2 rounded-2xl shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{inFlightOrders.length} Active Ticket{inFlightOrders.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          )}

          {/* Error Notification Alert */}
          {errorMessage && (
            <div className="mb-3 bg-[#C11221] text-white px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold truncate">
                  {errorMessage}
                </span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white flex-shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Notification Alert */}
          {sentOrderNumber && (
            <div className="mb-3 bg-emerald-600 text-white px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-xs sm:text-sm font-black">
                  Order {sentOrderNumber} Sent to Cashier!
                </span>
              </div>
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                Paperless
              </span>
            </div>
          )}

          {/* TAB 1: MENU PRODUCT GRID */}
          {activeTab === 'menu' && (
            <>
              {/* Active Category Title & Count */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
                    {dynamicCategoryCards.find((c) => c.id === groupFilter)?.label || 'All Menu'}
                  </h2>
                  <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-bold">
                    {filteredItems.length} items
                  </span>
                </div>
              </div>

              {/* Loading State Spinner */}
              {loadingMenu && (
                <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center my-4 shadow-xs flex flex-col items-center justify-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">Loading menu items...</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Fetching latest cafe menu & categories</p>
                </div>
              )}

              {/* Error State Banner */}
              {!loadingMenu && menuLoadError && (
                <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center my-4 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-3 text-rose-500">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">Unable to load menu</h4>
                  <p className="text-xs text-stone-500 mt-1 mb-4">{menuLoadError}</p>
                  <button
                    onClick={() => loadMenu()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Loading Menu</span>
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loadingMenu && !menuLoadError && filteredItems.length === 0 && (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 text-center my-4 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">No menu items found</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Try different search keywords or select another category.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSearch('');
                        setSelectedCategory('');
                        setGroupFilter('ALL');
                        if (allItems.length === 0) loadMenu();
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Reset Filters
                    </button>
                    {allItems.length === 0 && (
                      <button
                        onClick={() => loadMenu()}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reload Menu</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* RESPONSIVE FOOD GRID (Shadcn-Style Food Cards):
                  - Smaller phone (< 640px): 1 card per row (grid-cols-1)
                  - Tablet / iPad: 3 cards per row (sm:grid-cols-2 md:grid-cols-3)
                  - Desktop: 3 to 4 cards per row (lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5)
              */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                {filteredItems.map((item) => {
                  const inCart = waiterCart.find((c) => c.menuItemId === item.id);
                  const qty = inCart ? inCart.quantity : 0;

                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={qty}
                      onAdd={(it) => {
                        addToWaiterCart({
                          id: it.id,
                          name: it.name,
                          price: Number(it.price),
                          imageUrl: it.imageUrl,
                        });
                      }}
                      onUpdateQuantity={(it, delta) => updateWaiterQuantity(it.id, delta)}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: LIVE KITCHEN PREPARATION MONITOR */}
          {activeTab === 'tracker' && (
            <div className="space-y-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-stone-200">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                      <span>Live Kitchen Preparation Tracker</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Real-time status for tickets served by <span className="text-stone-900 font-bold">{currentUser?.name}</span>.
                    </p>
                  </div>

                  {/* Clean, Non-Breaking Responsive Status Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs font-bold pt-1 sm:pt-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 whitespace-nowrap shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span>Normal (&lt;15m)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 whitespace-nowrap shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span>Warning (15–20m)</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200/90 whitespace-nowrap shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                      <span>Delayed (&gt;20m)</span>
                    </span>
                  </div>
                </div>

                {inFlightOrders.length === 0 ? (
                  <div className="py-12 text-center text-stone-500">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-600" />
                    <p className="text-sm font-bold text-stone-800">No active tables being prepared right now.</p>
                    <p className="text-xs text-stone-500 mt-1">Take an order to start tracking prep time!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {inFlightOrders.map((order) => {
                      const prep = calculatePrepTime(order.createdAt);
                      const isDraft = order.status === 'DRAFT_NOTE';
                      const isDelayed = !isDraft && prep.delayStatus === 'DELAYED';
                      const isWarning = !isDraft && prep.delayStatus === 'WARNING';
                      const isReady = order.status === 'READY';
                      const statusLabel = isDraft
                        ? '⏳ Awaiting Cashier Firing'
                        : order.status === 'CONFIRMED'
                        ? 'In Kitchen'
                        : order.status === 'IN_PREPARATION'
                        ? 'Cooking'
                        : order.status === 'READY'
                        ? 'Ready to Serve'
                        : order.status;
                      const orderNote = order.notes || order.specialInstructions || order.items?.find((i: any) => i.specialInstructions)?.specialInstructions;

                      return (
                        <div
                          key={order.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isReady
                              ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                              : isDelayed
                              ? 'bg-rose-50 border-rose-300 shadow-xs'
                              : isWarning
                              ? 'bg-amber-50 border-amber-300'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          {/* Card Header: Separated into clean non-colliding rows */}
                          <div className="pb-3 border-b border-stone-200/70 space-y-2">
                            {/* Row 1: Order Number + Table and Live Timer */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base font-black text-stone-900 tracking-tight flex-shrink-0">
                                  {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                                </span>
                                <span className="text-xs font-bold text-stone-700 truncate">
                                  {order.orderType === 'TAKEAWAY'
                                    ? `🛍️ Takeaway (${order.customerName || 'Guest'})`
                                    : `🍽️ Table ${order.table?.tableNumber || 'Guest'}`}
                                </span>
                              </div>

                              {/* Live Timer Pill */}
                              <div
                                className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border flex-shrink-0 whitespace-nowrap ${
                                  isReady
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : isDelayed
                                    ? 'bg-rose-100 text-rose-900 border-rose-400 animate-pulse'
                                    : isWarning
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : isDraft
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-stone-100 text-stone-800 border-stone-200'
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{isDraft ? `Sent ${prep.formattedTime} ago` : `${prep.formattedTime} prep`}</span>
                              </div>
                            </div>

                            {/* Row 2: Status Badge with ample room */}
                            <div className="flex items-center">
                              <Badge
                                variant={
                                  isReady
                                    ? 'success'
                                    : isDelayed
                                    ? 'destructive'
                                    : isDraft
                                    ? 'amber'
                                    : 'default'
                                }
                              >
                                {statusLabel}
                              </Badge>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="mt-3 text-xs text-stone-600 space-y-1.5">
                            {order.items?.map((it: any) => (
                              <div key={it.id} className="flex items-center justify-between">
                                <span className="truncate pr-2">
                                  <strong className="text-stone-900 mr-1.5">{it.quantity}x</strong>
                                  <span className="text-stone-800">{it.menuItem?.name || it.name || 'Item'}</span>
                                  {it.specialInstructions && it.specialInstructions !== orderNote && (
                                    <span className="text-[10px] text-emerald-700 italic ml-1">
                                      &quot;{it.specialInstructions}&quot;
                                    </span>
                                  )}
                                </span>
                                <span className="text-stone-500 font-mono text-[11px] whitespace-nowrap">
                                  {Number(it.subtotal || (it.unitPrice || it.price || it.menuItem?.price || 0) * it.quantity).toFixed(2)} ETB
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Order Note (shown once for the entire ticket) */}
                          {orderNote && (
                            <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span>Note: <strong>{orderNote}</strong></span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-stone-900">
                              {Number(order.totalAmount || 0).toFixed(2)} ETB
                            </span>

                            <div className="flex items-center gap-2">
                              {isDraft && (
                                <button
                                  type="button"
                                  onClick={() => handleLoadDraftForEditing(order)}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1.5 transition cursor-pointer"
                                  title="Edit note items before cashier fires to kitchen"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Edit Note</span>
                                </button>
                              )}

                              {!isDraft && (
                                <button
                                  type="button"
                                  onClick={() => handleStartAppendToOrder(order)}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition cursor-pointer"
                                  title="Add more items to this active kitchen ticket"
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>+ Add Items</span>
                                </button>
                              )}

                              {isReady && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleMarkServed(order.id)}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Mark Served</span>
                                </Button>
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
        </main>

        {/* COLUMN 3: RIGHT ORDER DETAILS / SLIP SIDEBAR (Desktop 1024px+; on tablet/mobile accessible via Floating Dock) */}
        <aside className="hidden lg:flex w-80 xl:w-96 bg-white border-l border-stone-200/90 flex-col h-full shadow-xs flex-shrink-0 z-10 text-stone-900">
          {/* Top Controls: Dine-In vs Takeaway Toggle & Table Selection */}
          <div className="p-4 border-b border-stone-200/90 space-y-3">
            <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200/80">
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  orderType === 'DINE_IN'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine In</span>
              </button>
              <button
                onClick={() => setOrderType('TAKEAWAY')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Take Away</span>
              </button>
            </div>

            {/* Dining Table Selection (Opens Floor Plan Modal) */}
            {orderType === 'DINE_IN' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase">
                  <span>Dining Table</span>
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3" />
                    <span>Floor Plan</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTableModalOpen(true)}
                  className="w-full text-left bg-stone-50 hover:bg-emerald-50/60 border border-stone-300 hover:border-emerald-500 rounded-xl p-2.5 transition shadow-2xs group cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99]"
                  title="Choose table from visual Floor Plan"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black text-stone-900 truncate">
                        {waiterTable ? `Table ${waiterTable}` : 'Select Dining Table'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-semibold truncate">
                        {selectedTableObj
                          ? `${selectedTableObj.capacity} seats • ${isCurrentTableOccupied ? 'Active Bill (Seated)' : 'Available (Open)'}`
                          : 'Tap to choose from floor plan'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 group-hover:border-emerald-500 group-hover:text-emerald-700 transition flex-shrink-0 shadow-2xs">
                    Change
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-600 uppercase">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abebe, Sara..."
                  value={takeawayCustomer}
                  onChange={(e) => setTakeawayCustomer(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Order Details Header */}
          <div className="px-4 py-2.5 bg-stone-50/70 border-b border-stone-200/90 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
              Order Details
            </h3>
            {waiterCart.length > 0 && (
              <button
                onClick={clearWaiterCart}
                className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Clear All Order
              </button>
            )}
          </div>

          {/* Mode Banner for Editing Draft or Appending to Table */}
          {editingDraftOrder && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0">
                  <Edit3 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-950 truncate">
                    Editing Draft #{editingDraftOrder.orderNumber}
                  </div>
                  <div className="text-[10px] text-amber-800 font-semibold truncate">
                    Table {editingDraftOrder.tableNumber} • Add/remove items
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEditOrAppend}
                className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition flex-shrink-0 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {appendingOrder && (
            <div className="p-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-200 text-emerald-900 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-emerald-950 truncate">
                    Adding to #{appendingOrder.orderNumber}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-semibold truncate">
                    Table {appendingOrder.tableNumber} • Select items to add
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEditOrAppend}
                className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 transition flex-shrink-0 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
            {waiterCart.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center text-stone-400">
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2.5">
                  <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-xs font-bold text-stone-700">No Order</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Select items to add to order
                </p>
              </div>
            ) : (
              waiterCart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col gap-2 hover:border-emerald-500/30 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-900 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                        <span>x{item.quantity}</span>
                        <span>•</span>
                        <span>{item.price.toFixed(2)} ETB each</span>
                      </div>
                    </div>
                    <div className="text-xs font-black text-stone-900 text-right">
                      {((item.price + (item.tip || 0)) * item.quantity).toFixed(2)} ETB
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                    {/* Server Tip Button */}
                    {item.tip && item.tip > 0 ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-bold text-[9px] flex items-center gap-1">
                        <span>Tip: +{item.tip.toFixed(2)} ETB</span>
                        <button
                          onClick={() => setWaiterItemTip(item.menuItemId, 0)}
                          className="hover:text-rose-600 font-black ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setCustomTipValue('15');
                          setTipModal({ itemId: item.menuItemId, name: item.name });
                        }}
                        className="text-[9px] font-bold text-emerald-800 hover:bg-emerald-100 border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 rounded transition cursor-pointer"
                      >
                        + Tip
                      </button>
                    )}

                    {/* Stepper Controls */}
                    <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-lg px-1.5 py-0.5">
                      <button
                        onClick={() => updateWaiterQuantity(item.menuItemId, -1)}
                        className="text-stone-600 hover:text-stone-900 p-0.5 cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-black px-1 min-w-[14px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateWaiterQuantity(item.menuItemId, 1)}
                        className="text-stone-600 hover:text-stone-900 p-0.5 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Kitchen / Cashier Special Notes */}
          <div className="px-4 py-2 border-t border-stone-200/90 bg-stone-50/50">
            <input
              type="text"
              placeholder="Special instructions (e.g. Less spicy, extra sauce)..."
              value={waiterSpecialNotes}
              onChange={(e) => setWaiterSpecialNotes(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Bill Totals & Send Button */}
          <div className="p-4 border-t border-stone-200/90 bg-white space-y-3">
            <div className="space-y-1.5 text-xs text-stone-500">
              <div className="flex justify-between items-center">
                <span>Subtotal ({totalWaiterItems} items)</span>
                <span className="font-bold text-stone-900">{totalWaiterBase.toFixed(2)} ETB</span>
              </div>
              {totalWaiterTip > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>Server Tip (No VAT)</span>
                  <span>+{totalWaiterTip.toFixed(2)} ETB</span>
                </div>
              )}
              <div className="flex justify-between items-center text-stone-400 text-[11px]">
                <span>VAT (15% Included)</span>
                <span>{totalWaiterTax.toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200 font-black text-sm text-stone-900">
                <span>Total</span>
                <span className="text-base text-stone-900">{totalWaiterSum.toFixed(2)} ETB</span>
              </div>
            </div>

            <button
              disabled={waiterCart.length === 0 || sending}
              onClick={handleSendToCashier}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {sending
                  ? 'Processing...'
                  : editingDraftOrder
                  ? `Update Order Note #${editingDraftOrder.orderNumber}`
                  : appendingOrder
                  ? `Send Additional Items (Table ${appendingOrder.tableNumber})`
                  : isCurrentTableOccupied
                  ? `Append to Table ${waiterTable || ''} (Active Bill)`
                  : 'Send Note to Cashier (Paperless)'}
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* MOBILE / TABLET FLOATING DOCK (Visible on < lg screens) */}
      <div
        className={`lg:hidden fixed bottom-3 right-3 sm:right-6 z-40 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-1.5 sm:p-2 px-2 sm:px-6 shadow-xl flex items-center justify-around transition-all duration-200 ${
          activeTab === 'menu'
            ? 'left-[4.75rem] sm:left-[6.5rem] md:left-[7.5rem]'
            : 'left-3 sm:left-6'
        }`}
      >
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center gap-0.5 sm:gap-1 py-1 px-1.5 sm:px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'menu' ? 'text-emerald-600 font-black' : 'text-stone-500'
          }`}
        >
          <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>

        {/* Quick Table / Floor Plan Selector in Mobile Dock */}
        <button
          onClick={() => setTableModalOpen(true)}
          className="flex flex-col items-center gap-0.5 sm:gap-1 py-1 px-1.5 sm:px-3 rounded-xl text-stone-600 hover:text-emerald-600 transition cursor-pointer"
          title="Change Table or View Floor Plan"
        >
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          <span className="text-[10px] font-black text-stone-900 truncate max-w-[65px] sm:max-w-none">
            {orderType === 'DINE_IN' ? `Table ${waiterTable || '—'}` : 'Takeaway'}
          </span>
        </button>

        <button
          onClick={() => setShowMobileDrawer(true)}
          className="relative flex flex-col items-center gap-0.5 sm:gap-1 py-1 px-1.5 sm:px-3 rounded-xl text-stone-500 hover:text-emerald-600 transition cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-stone-600" />
            {totalWaiterItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-xs">
                {totalWaiterItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold whitespace-nowrap">Review Slip</span>
        </button>

        <button
          onClick={() => setActiveTab('tracker')}
          className={`relative flex flex-col items-center gap-0.5 sm:gap-1 py-1 px-1.5 sm:px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'tracker' ? 'text-emerald-600 font-black' : 'text-stone-500'
          }`}
        >
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          {inFlightOrders.length > 0 && (
            <span
              className={`absolute top-0 right-3 w-2 h-2 rounded-full ${
                delayedOrders.length > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
          )}
          <span className="text-[10px] font-bold whitespace-nowrap">Kitchen Status</span>
        </button>
      </div>

      {/* MOBILE / TABLET REVIEW SLIP DRAWER */}
      {showMobileDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
          <div className="bg-white border-t border-stone-200 rounded-t-[28px] max-h-[85vh] flex flex-col p-4 shadow-2xl text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs text-stone-500 font-medium">Review Order Note</span>
                <h3 className="text-sm font-black text-stone-900">{destinationLabel}</h3>
              </div>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Table Selection inside Review Drawer */}
            <div className="py-2.5 border-b border-stone-200 space-y-2">
              <div className="flex p-0.5 bg-stone-100 rounded-xl border border-stone-200/80">
                <button
                  onClick={() => setOrderType('DINE_IN')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    orderType === 'DINE_IN'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Dine In</span>
                </button>
                <button
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Take Away</span>
                </button>
              </div>

              {orderType === 'DINE_IN' ? (
                <button
                  type="button"
                  onClick={() => setTableModalOpen(true)}
                  className="w-full text-left bg-stone-50 hover:bg-emerald-50/60 border border-stone-300 hover:border-emerald-500 rounded-xl p-3 transition shadow-2xs group cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99]"
                  title="Choose table from visual Floor Plan"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black text-stone-900 truncate">
                        {waiterTable ? `Table ${waiterTable}` : 'Select Dining Table'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-semibold truncate">
                        {selectedTableObj
                          ? `${selectedTableObj.capacity} seats • ${isCurrentTableOccupied ? 'Active Bill (Seated)' : 'Available (Open)'}`
                          : 'Tap to choose from floor plan'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-600 text-white transition flex-shrink-0 shadow-2xs">
                    Change Table
                  </span>
                </button>
              ) : (
                <input
                  type="text"
                  placeholder="Takeaway customer name..."
                  value={takeawayCustomer}
                  onChange={(e) => setTakeawayCustomer(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              )}
            </div>

            <div className="py-2.5">
              <input
                type="text"
                placeholder="Special notes (e.g. Less sugar, extra hot)..."
                value={waiterSpecialNotes}
                onChange={(e) => setWaiterSpecialNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none"
              />
            </div>

            {/* Mode Banner in Mobile Drawer */}
            {editingDraftOrder && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Edit3 className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <div className="text-xs font-black text-amber-950 truncate">
                    Editing Draft #{editingDraftOrder.orderNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEditOrAppend}
                  className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {appendingOrder && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Plus className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <div className="text-xs font-black text-emerald-950 truncate">
                    Adding to #{appendingOrder.orderNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEditOrAppend}
                  className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-2 space-y-2 max-h-64 no-scrollbar">
              {waiterCart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="bg-stone-50 border border-stone-200 p-2.5 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-stone-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-stone-500 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span>{item.price.toFixed(2)} ETB × {item.quantity}</span>
                      {item.tip && item.tip > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold text-[9px]">
                          Tip: +{item.tip.toFixed(2)} ETB
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-black text-stone-900">
                      {((item.price + (item.tip || 0)) * item.quantity).toFixed(2)} ETB
                    </span>
                    <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-1.5 py-0.5">
                      <button
                        onClick={() => updateWaiterQuantity(item.menuItemId, -1)}
                        className="text-stone-500 hover:text-stone-900 cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-black px-1 text-stone-900">{item.quantity}</span>
                      <button
                        onClick={() => updateWaiterQuantity(item.menuItemId, 1)}
                        className="text-stone-500 hover:text-stone-900 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 mt-2 space-y-3">
              <div className="space-y-1 text-xs text-stone-500">
                <div className="flex justify-between items-center">
                  <span>Subtotal ({totalWaiterItems} items)</span>
                  <span className="font-bold text-stone-900">{totalWaiterBase.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-stone-200 font-black text-sm text-stone-900">
                  <span>Total</span>
                  <span className="text-base text-stone-900">{totalWaiterSum.toFixed(2)} ETB</span>
                </div>
              </div>

              <button
                disabled={waiterCart.length === 0 || sending || (orderType === 'DINE_IN' && !waiterTable)}
                onClick={handleSendToCashier}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4 text-white" />
                <span>
                  {sending
                    ? 'Processing...'
                    : editingDraftOrder
                    ? `Update Order Note #${editingDraftOrder.orderNumber}`
                    : appendingOrder
                    ? `Send Additional Items (Table ${appendingOrder.tableNumber})`
                    : isCurrentTableOccupied
                    ? `Append Round to Table ${waiterTable} (Active Bill)`
                    : 'Confirm & Send to Cashier'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Plan Modal */}
      <TablePlanModal
        isOpen={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        tables={tables}
        selectedTable={waiterTable}
        onSelectTable={(tableNumber, tableObj) => {
          handleSelectTable(tableNumber, tableObj);
        }}
        onTablesUpdated={setTables}
      />

      {/* In-App Tip Modal */}
      {tipModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 w-full max-w-xs shadow-2xl text-stone-900 space-y-4 animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-black text-stone-900">Add Server Tip</h3>
              <p className="text-xs text-stone-500 mt-0.5 truncate">{tipModal.name}</p>
            </div>
            <div className="flex gap-1.5">
              {['10', '15', '20', '30'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCustomTipValue(preset)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    customTipValue === preset
                      ? 'bg-emerald-600 text-white border-emerald-600 font-black'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={customTipValue}
                onChange={(e) => setCustomTipValue(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-600"
                placeholder="Custom tip amount (ETB)"
              />
              <span className="absolute right-3.5 top-2 text-xs font-bold text-stone-400">ETB</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setTipModal(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseFloat(customTipValue);
                  if (!isNaN(parsed) && parsed >= 0) {
                    setWaiterItemTip(tipModal.itemId, parsed);
                  }
                  setTipModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                Apply Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
