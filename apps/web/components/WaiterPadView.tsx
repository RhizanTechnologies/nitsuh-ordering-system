'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi, getSocket } from '@/lib/api';
import { calculatePrepTime } from '@/lib/timer-utils';
import { playReadyChime } from '@/lib/audio';
import { MenuImage } from '@/components/MenuImage';
import {
  Smartphone,
  Send,
  Plus,
  Minus,
  CheckCircle2,
  Table as TableIcon,
  Search,
  MessageSquare,
  ShoppingCart,
  X,
  LayoutGrid,
  ShoppingBag,
  Utensils,
  Clock,
  Flame,
  BellRing,
  AlertTriangle,
  RotateCcw,
  Check,
  Coffee,
  Sandwich,
  Cake,
  Leaf,
  Heart,
  ChevronLeft,
  SlidersHorizontal,
  Star,
  Sparkles,
  User,
} from 'lucide-react';
import { TablePlanModal } from '@/components/TablePlanModal';

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
    clearWaiterCart,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'menu' | 'tables'>('menu');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [takeawayCustomer, setTakeawayCustomer] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allItems, setAllItems] = useState<any[]>([]);
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'BURGER' | 'PIZZA' | 'CHICKEN' | 'FRIES' | 'DRINKS' | 'COFFEE' | 'BAKERY' | 'FASTING'>('ALL');
  const [tables, setTables] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOrderNumber, setSentOrderNumber] = useState<string | null>(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [readyToast, setReadyToast] = useState<any | null>(null);
  const [, setTick] = useState(0);

  // Reference Image Design: Product Customizer Drawer & Favorites
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [customSize, setCustomSize] = useState<'Regular' | 'Large' | 'X Large'>('Regular');
  const [customQty, setCustomQty] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [customItemNote, setCustomItemNote] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const loadTables = () => {
    fetchApi('/menu/tables')
      .then((data) => {
        setTables(data);
        const current = data.find((t: any) => t.tableNumber === waiterTable);
        if (!current || current.status === 'OCCUPIED') {
          const firstAvail = data.find((t: any) => t.status === 'AVAILABLE');
          if (firstAvail) setWaiterTable(firstAvail.tableNumber);
        }
      })
      .catch(() => {});
  };

  const loadActiveOrders = () => {
    fetchApi('/orders?statuses=CONFIRMED,IN_PREPARATION,READY,SERVED,DRAFT_NOTE')
      .then((data) => setActiveOrders(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchApi('/menu/categories').then((cats) => {
      setCategories(cats);
    });

    fetchApi('/menu/items').then((items) => {
      setAllItems(items);
    });

    loadTables();
    loadActiveOrders();

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    const socket = getSocket();

    socket.on('tables:updated', (updated: any[]) => {
      setTables(updated);
      const current = updated.find((t: any) => t.tableNumber === waiterTable);
      if (!current || current.status === 'OCCUPIED') {
        const firstAvail = updated.find((t: any) => t.status === 'AVAILABLE');
        if (firstAvail) setWaiterTable(firstAvail.tableNumber);
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

  // Category helpers for grouping matching reference image
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

      // Fasting Filter
      if (groupFilter === 'FASTING' && !isFastingItem(item)) {
        return false;
      }

      // Group Filter matching reference image categories
      if (groupFilter === 'BURGER' && !isBurger(catName, item.name)) return false;
      if (groupFilter === 'PIZZA' && !isPizza(catName, item.name)) return false;
      if (groupFilter === 'CHICKEN' && !isChicken(catName, item.name)) return false;
      if (groupFilter === 'FRIES' && !isFries(catName, item.name)) return false;
      if (groupFilter === 'COFFEE' && !isCoffee(catName, item.name)) return false;
      if (groupFilter === 'DRINKS' && !isDrinks(catName)) return false;
      if (groupFilter === 'BAKERY' && !isBakery(catName)) return false;

      // Specific Category Selection
      if (selectedCategory && !query && item.categoryId !== selectedCategory) {
        return false;
      }

      // Search matching: name, description, category
      if (query) {
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        const matchCat = catName.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, groupFilter, selectedCategory, search]);

  const totalWaiterItems = waiterCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalWaiterBase = waiterCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalWaiterTip = waiterCart.reduce((sum, item) => sum + (item.tip || 0) * item.quantity, 0);
  const totalWaiterTax = totalWaiterBase * 0.15;
  const totalWaiterSum = totalWaiterBase + totalWaiterTip + totalWaiterTax;

  // Customizer calculations
  const getCustomUnitPrice = (item: any) => {
    if (!item) return 0;
    const basePrice = Number(item.price || 0);
    const sizeAddon = customSize === 'Large' ? 30 : customSize === 'X Large' ? 50 : 0;
    const addons = (item.applicableAddons || []).filter((a: any) => selectedAddonIds.includes(a.id));
    const addonsTotal = addons.reduce((sum: number, a: any) => sum + Number(a.price || 0), 0);
    return basePrice + sizeAddon + addonsTotal;
  };

  const openItemCustomizer = (item: any) => {
    setSelectedDetailItem(item);
    setCustomSize('Regular');
    setCustomQty(1);
    setSelectedAddonIds([]);
    setCustomItemNote('');
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleAddCustomizedToCart = () => {
    if (!selectedDetailItem) return;
    const unitPrice = getCustomUnitPrice(selectedDetailItem);
    const chosenAddons = (selectedDetailItem.applicableAddons || []).filter((a: any) =>
      selectedAddonIds.includes(a.id)
    );
    const addonLabels = chosenAddons.map((a: any) => `+${a.name}`);
    const specs = [
      customSize !== 'Regular' ? `Size: ${customSize}` : '',
      ...addonLabels,
      customItemNote ? `Note: ${customItemNote}` : '',
    ].filter(Boolean).join(', ');

    addToWaiterCart({
      id: selectedDetailItem.id,
      name: specs ? `${selectedDetailItem.name} (${specs})` : selectedDetailItem.name,
      price: unitPrice,
      imageUrl: selectedDetailItem.imageUrl,
      quantity: customQty,
      specialInstructions: specs || undefined,
      selectedAddonIds: selectedAddonIds,
      selectedAddons: chosenAddons,
    });

    setSelectedDetailItem(null);
  };

  // Send digital note directly to Cashier POS terminal
  const handleSendToCashier = async () => {
    if (waiterCart.length === 0) return;
    setSending(true);

    try {
      const isTakeaway = orderType === 'TAKEAWAY';
      const selectedTableObj = isTakeaway ? null : tables.find((t) => t.tableNumber === waiterTable);
      const res = await fetchApi('/orders/waiter-note', {
        method: 'POST',
        body: JSON.stringify({
          waiterId: currentUser?.id || 'w01-waiter',
          orderType,
          tableId: selectedTableObj ? selectedTableObj.id : null,
          customerName: isTakeaway
            ? (takeawayCustomer.trim() || 'Takeaway Customer')
            : (waiterCustomerName.trim() || 'Table Guest'),
          items: waiterCart.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            tip: i.tip || 0,
            specialInstructions: i.specialInstructions || waiterSpecialNotes,
            selectedAddonIds: i.selectedAddonIds || [],
            selectedAddons: i.selectedAddons || [],
          })),
        }),
      });

      setSentOrderNumber(res.orderNumber);
      clearWaiterCart();
      setShowMobileDrawer(false);
      loadActiveOrders();
      setTimeout(() => setSentOrderNumber(null), 6000);
    } catch (err: any) {
      alert(`Error sending order note: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Mark an order as served to guests
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
      alert(`Error marking served: ${err.message}`);
    }
  };

  const destinationLabel =
    orderType === 'TAKEAWAY'
      ? `🛍️ Takeaway (${takeawayCustomer.trim() || 'Customer'})`
      : `🍽️ Table ${waiterTable}`;

  // Filter in-flight orders: Manager/Owner sees whole floor; individual waiter sees their own
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

  // Category navigation pills matching reference image
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

  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row h-full overflow-hidden bg-[#0D0B0A] text-white relative">
      {/* Background ambient lighting glows matching dark luxury look */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C11221]/10 rounded-full blur-3xl pointer-events-none" />

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

      {/* Main Left Column: Handheld Order Selector OR Live Table Orders */}
      <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 overflow-y-auto pb-28 md:pb-6 relative z-10 no-scrollbar">
        {/* Top Header matching reference image: Greeting, Hero Title, Avatar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 text-xs font-semibold mb-1">
              <span>Hi, {currentUser?.name?.split(' ')[0] || 'Alex'}</span>
              <span>👋</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-white leading-tight font-heading">
              Good Food <br />
              <span className="text-amber-600 dark:text-amber-400">
                Good Mood!
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tab Toggle for Active Tables */}
            <button
              onClick={() => setActiveTab(activeTab === 'menu' ? 'tables' : 'menu')}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tables'
                  ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
                  : 'bg-white/[0.05] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Toggle Live Table Preparation Monitor"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">
                {activeTab === 'tables' ? 'Back to Food' : 'Live Status'}
              </span>
              {inFlightOrders.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    delayedOrders.length > 0 ? 'bg-[#C11221] text-white animate-pulse' : 'bg-amber-400 text-black'
                  }`}
                >
                  {inFlightOrders.length}
                </span>
              )}
            </button>

            {/* Staff Avatar with status dot */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-[#C11221] p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-[#161311] flex items-center justify-center font-bold text-xs text-amber-400">
                  {currentUser?.name?.charAt(0) || 'W'}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#C11221] border-2 border-[#0D0B0A]" />
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {sentOrderNumber && (
          <div className="mb-4 bg-emerald-950/80 border border-emerald-500/50 p-3.5 rounded-2xl flex items-center gap-3 text-white shadow-xl animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                <span>Order {sentOrderNumber} Sent to Cashier!</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Paperless
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                The Cashier counter now has this note on screen ready to confirm and fire to the kitchen.
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MENU & ORDER CREATION */}
        {activeTab === 'menu' && (
          <>
            {/* Search Pill with Equalizer Filter Icon matching reference */}
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search your favorite food..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 hover:border-white/20 focus:border-amber-500/50 rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition shadow-inner backdrop-blur-xl"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Equalizer / Filter button opening Table Plan */}
              <button
                onClick={() => setTableModalOpen(true)}
                className="p-3 bg-white/[0.05] hover:bg-white/[0.09] active:scale-95 border border-white/10 rounded-2xl text-zinc-300 hover:text-amber-400 transition shadow-inner cursor-pointer"
                title="Table Floor Plan"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Dine-In / Takeaway & Table Strip */}
            <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl flex-1 sm:flex-none">
                <button
                  onClick={() => setOrderType('DINE_IN')}
                  className={`flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    orderType === 'DINE_IN'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Dine-In Table</span>
                </button>
                <button
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`flex-1 sm:flex-none min-w-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Takeaway</span>
                </button>
              </div>

              {orderType === 'DINE_IN' ? (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase mr-1 flex-shrink-0">Table:</span>
                  {tables.slice(0, 8).map((t) => {
                    const isOccupied = t.status === 'OCCUPIED';
                    const isSelected = waiterTable === t.tableNumber;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setWaiterTable(t.tableNumber)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer flex-shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                            : isOccupied
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                            : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                        }`}
                        title={isOccupied ? `${t.tableNumber} is occupied (tap to add items to active bill)` : t.tableNumber}
                      >
                        <span>{t.tableNumber}</span>
                        {isOccupied && <span className="ml-1 text-[9px] opacity-75">•</span>}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setTableModalOpen(true)}
                    className="px-2 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition flex-shrink-0"
                  >
                    All...
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Customer name for takeaway..."
                  value={takeawayCustomer}
                  onChange={(e) => setTakeawayCustomer(e.target.value)}
                  className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 w-full sm:w-auto"
                />
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

            {/* Section Header: "Popular Now" & "View All" */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">Popular Now</h2>
              <button
                onClick={() => {
                  setGroupFilter('ALL');
                  setSearch('');
                  setSelectedCategory('');
                }}
                className="text-xs font-semibold text-zinc-400 hover:text-amber-400 transition"
              >
                View All ({allItems.length})
              </button>
            </div>

            {/* Empty State when no items match */}
            {filteredItems.length === 0 && (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 text-center my-4">
                <Utensils className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">No menu items found</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Try different search keywords or clear current filters.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                    setGroupFilter('ALL');
                  }}
                  className="mt-3 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Food Grid matching Reference Image (2 columns on mobile/small screens) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
              {filteredItems.map((item) => {
                const inCart = waiterCart.find((c) => c.menuItemId === item.id);
                const qty = inCart ? inCart.quantity : 0;
                const isSelected = qty > 0;
                const isFav = favorites.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => openItemCustomizer(item)}
                    className={`group relative bg-white dark:bg-[#161311] rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/15'
                        : 'border-stone-200/90 dark:border-white/10 hover:border-amber-500/50'
                    }`}
                  >
                    {/* Generous High-Impact Culinary Image (Tashkent Cafe Style) */}
                    <div className="relative w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-3 bg-stone-100 dark:bg-black/40 border border-stone-200/60 dark:border-white/10 flex-shrink-0">
                      <MenuImage
                        src={item.imageUrl}
                        alt={item.name}
                        categoryName={item.category?.name}
                        prepSection={item.prepSection}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                      />

                      {/* Floating Category / Dietary Badge (Top-Left) */}
                      <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10">
                        {isBurger(item.category?.name || '', item.name) || item.name.toLowerCase().includes('spicy') ? (
                          <span className="bg-[#C11221] text-white text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md flex items-center gap-0.5 sm:gap-1 backdrop-blur-md">
                            <Flame className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-white" />
                            <span>Spicy</span>
                          </span>
                        ) : isFastingItem(item) ? (
                          <span className="bg-emerald-600 text-white text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md flex items-center gap-0.5 sm:gap-1 backdrop-blur-md">
                            🌱 Fasting
                          </span>
                        ) : (
                          <span className="bg-black/55 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
                            {item.category?.name || 'Dish'}
                          </span>
                        )}
                      </div>

                      {/* Favorite Heart (Top-Right) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`w-3 sm:w-4 h-3 sm:h-4 ${
                            isFav ? 'text-[#C11221] fill-[#C11221]' : 'text-white/80 group-hover:text-white'
                          }`}
                        />
                      </button>

                      {/* Selected Overlay Badge if in cart */}
                      {isSelected && (
                        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[9px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl shadow-lg border border-amber-300/40 flex items-center gap-1 animate-in zoom-in-75">
                          <span>x{qty} in order</span>
                        </div>
                      )}
                    </div>

                    {/* Dish Name, Description & Action */}
                    <div className="flex flex-col flex-1 justify-between">
                      <div>
                        <h4
                          className="text-xs sm:text-base font-black text-stone-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition"
                          title={item.name}
                        >
                          {item.name}
                        </h4>

                        {item.description && (
                          <p
                            className="text-[10px] sm:text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-1 mt-0.5 leading-tight hidden xs:block sm:block"
                            title={item.description}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Add Action Pill */}
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-stone-100 dark:border-white/5">
                        <div className="text-xs sm:text-base font-black text-amber-700 dark:text-amber-400 tracking-tight">
                          {Number(item.price).toFixed(2)} <span className="text-[9px] sm:text-[10px] text-stone-500 dark:text-zinc-400 font-bold">ETB</span>
                        </div>

                        {/* Tashkent-style Action Pill */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToWaiterCart({
                              id: item.id,
                              name: item.name,
                              price: Number(item.price),
                              imageUrl: item.imageUrl,
                            });
                          }}
                          className="px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-stone-950 font-black text-[10px] sm:text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                          title="Add to table order"
                        >
                          <Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5 stroke-[3]" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: LIVE TABLE ORDERS & PREPARATION MONITOR */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>Live Kitchen Preparation Tracker</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Real-time timer for tables served by <span className="text-amber-400 font-bold">{currentUser?.name}</span>.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal (&lt;15m)
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning (15-20m)
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Delayed (&gt;20m)
                  </span>
                </div>
              </div>

              {inFlightOrders.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-400" />
                  <p className="text-sm font-bold text-zinc-300">No active tables being prepared right now.</p>
                  <p className="text-xs text-zinc-500 mt-1">Take an order to start tracking prep time!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inFlightOrders.map((order) => {
                    const prep = calculatePrepTime(order.createdAt);
                    const isDelayed = prep.delayStatus === 'DELAYED';
                    const isWarning = prep.delayStatus === 'WARNING';
                    const isReady = order.status === 'READY';

                    return (
                      <div
                        key={order.id}
                        className={`p-4 rounded-2xl border backdrop-blur-xl transition-all ${
                          isReady
                            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                            : isDelayed
                            ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-500/10'
                            : isWarning
                            ? 'bg-amber-950/30 border-amber-500/50'
                            : 'bg-white/[0.04] border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">#{order.orderNumber}</span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                  isReady
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : isDelayed
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-zinc-300 mt-0.5">
                              {order.orderType === 'TAKEAWAY'
                                ? `🛍️ Takeaway (${order.customerName})`
                                : `🍽️ Table ${order.table?.tableNumber || 'Guest'}`}
                            </div>
                          </div>

                          {/* Live Timer Pill */}
                          <div
                            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                              isReady
                                ? 'bg-emerald-500 text-black border-emerald-400'
                                : isDelayed
                                ? 'bg-[#C11221] text-white border-rose-400 animate-pulse'
                                : isWarning
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-white/[0.08] text-white border-white/15'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{prep.formattedTime} elapsed</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="mt-3 text-xs text-zinc-400 space-y-1">
                          {order.items?.map((it: any) => (
                            <div key={it.id} className="flex justify-between">
                              <span>
                                {it.quantity}x {it.menuItem?.name || 'Item'}
                              </span>
                              <span className="text-zinc-500">
                                {it.itemStatus || order.status}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400">
                            {Number(order.totalAmount || 0).toFixed(2)} ETB
                          </span>

                          {isReady && (
                            <button
                              onClick={() => handleMarkServed(order.id)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Mark Served</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP/TABLET Right Column: Waiter Digital Slip Drawer - Luxury Frosted Dark Glass */}
      <div className="hidden md:flex w-80 lg:w-96 bg-[#12100E]/95 backdrop-blur-2xl border-l border-white/10 flex-col h-full shadow-2xl flex-shrink-0 relative z-20">
        <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {orderType === 'TAKEAWAY' ? 'Takeaway Order' : 'Dining Table Note'}
            </div>
            <div className="text-sm font-black text-white">{destinationLabel}</div>
          </div>
          <button
            onClick={clearWaiterCart}
            className="text-xs font-semibold text-zinc-500 hover:text-[#C11221] cursor-pointer transition"
          >
            Clear All
          </button>
        </div>

        {/* Special Instructions Note Input */}
        <div className="p-3 border-b border-white/10">
          <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            Special Note for Cashier & Kitchen
          </label>
          <input
            type="text"
            placeholder="e.g. Less spicy, extra hot, pack tightly"
            value={waiterSpecialNotes}
            onChange={(e) => setWaiterSpecialNotes(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Selected Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 no-scrollbar">
          {waiterCart.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-zinc-500">
              <ShoppingBag className="w-8 h-8 mb-2 stroke-1 text-zinc-600" />
              <p className="text-xs font-medium">No items picked for {destinationLabel} yet.</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Click any food card or + to add.</p>
            </div>
          ) : (
            waiterCart.map((item) => (
              <div
                key={item.menuItemId}
                className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2 hover:border-amber-500/30 transition"
              >
                <div className="pr-2 min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span>{item.price.toFixed(2)} ETB × {item.quantity}</span>
                    {item.tip && item.tip > 0 ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold text-[9px] flex items-center gap-1">
                        <span>Tip: +{item.tip.toFixed(2)} ETB</span>
                        <button
                          onClick={() => setWaiterItemTip(item.menuItemId, 0)}
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
                              setWaiterItemTip(item.menuItemId, parsed);
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

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-black text-amber-400">
                    {((item.price + (item.tip || 0)) * item.quantity).toFixed(2)} ETB
                  </span>
                  <div className="flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-xl px-1.5 py-0.5">
                    <button
                      onClick={() => updateWaiterQuantity(item.menuItemId, -1)}
                      className="text-zinc-400 hover:text-white p-0.5"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-xs font-black px-1 text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateWaiterQuantity(item.menuItemId, 1)}
                      className="text-zinc-400 hover:text-white p-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Send to Cashier Summary & Button */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] space-y-3">
          <div className="space-y-1.5 text-xs text-zinc-400">
            <div className="flex justify-between items-center">
              <span>Subtotal ({totalWaiterItems} items)</span>
              <span className="font-bold text-white">{totalWaiterBase.toFixed(2)} ETB</span>
            </div>
            {totalWaiterTip > 0 && (
              <div className="flex justify-between items-center text-amber-400 font-bold">
                <span>Server Tip (No VAT)</span>
                <span>+{totalWaiterTip.toFixed(2)} ETB</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>15% VAT</span>
              <span className="font-bold text-white">{totalWaiterTax.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10 font-black text-sm text-white">
              <span>Total Bill</span>
              <span className="text-lg text-amber-400">{totalWaiterSum.toFixed(2)} ETB</span>
            </div>
          </div>

          <button
            disabled={waiterCart.length === 0 || sending}
            onClick={handleSendToCashier}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              waiterCart.length === 0 || sending
                ? 'bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 border border-black/10 dark:border-white/10 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-[#C11221] hover:brightness-110 !text-black active:scale-98 shadow-amber-500/25'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {sending
                ? 'Sending Order Note...'
                : isCurrentTableOccupied
                ? `Append to Table ${waiterTable || ''} (Active Bill)`
                : 'Send Note to Cashier (Paperless)'}
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE FLOATING DOCK (matching reference image) */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-[#161311]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-2 px-5 shadow-2xl flex items-center justify-between">
        {/* Home */}
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition cursor-pointer ${
            activeTab === 'menu' ? 'text-amber-400 font-black' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Tables */}
        <button
          onClick={() => setTableModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold">Tables</span>
        </button>

        {/* Orders / Cart Button */}
        <button
          onClick={() => setShowMobileDrawer(true)}
          className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-zinc-500 hover:text-amber-400 transition cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-zinc-300" />
            {totalWaiterItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#C11221] text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-lg border border-white/20">
                {totalWaiterItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Orders</span>
        </button>

        {/* Live Status */}
        <button
          onClick={() => setActiveTab('tables')}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition cursor-pointer ${
            activeTab === 'tables' ? 'text-amber-400 font-black' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Clock className="w-5 h-5" />
          {inFlightOrders.length > 0 && (
            <span
              className={`absolute top-0 right-2 w-2 h-2 rounded-full ${
                delayedOrders.length > 0 ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
              }`}
            />
          )}
          <span className="text-[10px] font-bold">Status</span>
        </button>
      </div>

      {/* MOBILE FULL-SCREEN SLIP REVIEW DRAWER */}
      {showMobileDrawer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end md:hidden animate-in fade-in duration-200">
          <div className="bg-[#161311] border-t border-white/15 rounded-t-[32px] max-h-[85vh] flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-xs text-zinc-400 font-medium">Review Order Note</span>
                <h3 className="text-sm font-black text-white">{destinationLabel}</h3>
              </div>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-1.5 bg-white/[0.08] rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Note input in mobile sheet */}
            <div className="py-2.5">
              <input
                type="text"
                placeholder="Special notes (e.g. Less sugar, extra hot)..."
                value={waiterSpecialNotes}
                onChange={(e) => setWaiterSpecialNotes(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2 max-h-64 no-scrollbar">
              {waiterCart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="bg-white/[0.04] border border-white/10 p-2.5 rounded-2xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-white truncate">{item.name}</div>
                    <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span>{item.price.toFixed(2)} ETB × {item.quantity}</span>
                      {item.tip && item.tip > 0 && (
                        <span className="bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold text-[9px]">
                          Tip: +{item.tip.toFixed(2)} ETB
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-black text-amber-400">
                      {((item.price + (item.tip || 0)) * item.quantity).toFixed(2)} ETB
                    </span>
                    <div className="flex items-center gap-1 bg-white/[0.08] border border-white/10 rounded-xl px-1.5 py-0.5">
                      <button
                        onClick={() => updateWaiterQuantity(item.menuItemId, -1)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-black px-1 text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateWaiterQuantity(item.menuItemId, 1)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Action */}
            <div className="pt-3 border-t border-white/10 mt-2 space-y-3">
              <div className="space-y-1 text-xs text-zinc-400">
                <div className="flex justify-between items-center">
                  <span>Subtotal ({totalWaiterItems} items)</span>
                  <span className="font-bold text-white">{totalWaiterBase.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-white/10 font-black text-sm text-white">
                  <span>Total Bill</span>
                  <span className="text-base text-amber-400">{totalWaiterSum.toFixed(2)} ETB</span>
                </div>
              </div>

              <button
                disabled={waiterCart.length === 0 || sending || isCurrentTableOccupied}
                onClick={handleSendToCashier}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-[#C11221] text-black rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isCurrentTableOccupied
                    ? 'Table Occupied (Settle Bill First)'
                    : sending
                    ? 'Sending...'
                    : 'Confirm & Send to Cashier'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT CUSTOMIZER MODAL (Phone 2 replica matching reference image) */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#161311] border border-white/15 rounded-[36px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Top Hero Image Area with Glow */}
            <div className="relative h-60 sm:h-64 w-full overflow-hidden bg-gradient-to-b from-amber-950/20 to-black/60 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent blur-xl" />

              {/* Top Navigation Bar: Back & Favorite Buttons */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleFavorite(selectedDetailItem.id)}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.includes(selectedDetailItem.id)
                        ? 'text-[#C11221] fill-[#C11221]'
                        : 'text-zinc-400'
                    }`}
                  />
                </button>
              </div>

              {/* Hero Image */}
              <div className="w-44 h-44 sm:w-52 sm:h-52 relative z-10 drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] flex items-center justify-center">
                <MenuImage
                  src={selectedDetailItem.imageUrl}
                  alt={selectedDetailItem.name}
                  categoryName={selectedDetailItem.category?.name}
                  prepSection={selectedDetailItem.prepSection}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Sheet Content Card */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-[#161311]/95 backdrop-blur-2xl rounded-t-[32px] -mt-5 relative z-10 border-t border-white/10 space-y-4 no-scrollbar">
              {/* Badges & Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-[#C11221] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-white" />
                    <span>Spicy</span>
                  </span>
                  {isFastingItem(selectedDetailItem) && (
                    <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                      🌱 Fasting
                    </span>
                  )}
                  <span className="text-zinc-500 text-xs font-semibold">
                    {selectedDetailItem.category?.name || 'Chef Special'}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 text-xs">
                  #
                </div>
              </div>

              {/* Title & Price */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {selectedDetailItem.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 text-zinc-400 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-white font-bold">4.8</span>
                    <span>(120 reviews)</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                    {getCustomUnitPrice(selectedDetailItem).toFixed(2)} ETB
                  </div>
                  <div className="text-[10px] text-zinc-500">per item</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-zinc-400 text-xs leading-relaxed">
                {selectedDetailItem.description ||
                  'Crispy fresh patty with rich seasoning, crisp lettuce, tomato, onion and our chef signature sauce.'}
              </p>

              {/* Customize Section */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="text-sm font-extrabold text-white">Customize</div>

                {/* Size Pills */}
                <div>
                  <div className="text-xs font-bold text-zinc-400 mb-2">Size</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Regular', label: 'Regular', add: 0 },
                      { id: 'Large', label: 'Large', add: 30 },
                      { id: 'X Large', label: 'X Large', add: 50 },
                    ].map((sz) => {
                      const isActive = customSize === sz.id;
                      return (
                        <button
                          key={sz.id}
                          onClick={() => setCustomSize(sz.id as any)}
                          className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all text-center border cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-400 shadow-lg shadow-amber-500/20 font-black'
                              : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08]'
                          }`}
                        >
                          <div>{sz.label}</div>
                          {sz.add > 0 && (
                            <div className={`text-[10px] ${isActive ? 'text-black/80 font-bold' : 'text-zinc-500'}`}>
                              +{sz.add} ETB
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Real Add-ons with animated toggle switches */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <span>Add-ons & Extras</span>
                    <span className="text-[10px] text-amber-500 font-semibold">Kitchen Inventory Tracked</span>
                  </div>

                  {(!selectedDetailItem.applicableAddons || selectedDetailItem.applicableAddons.length === 0) ? (
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-500 text-center">
                      Standard portion recipe (no extra add-on modifiers configured for this dish).
                    </div>
                  ) : (
                    selectedDetailItem.applicableAddons.map((addon: any) => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-sm shadow-amber-500/10'
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-zinc-200'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{addon.name}</span>
                              {addon.quantity > 0 && addon.ingredient && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-zinc-300 font-mono">
                                  {addon.quantity} {addon.ingredient.baseUnit?.symbol || addon.unit?.symbol || 'g'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-amber-400 font-bold mt-0.5">
                              +{Number(addon.price).toFixed(2)} ETB
                            </div>
                          </div>
                          <div
                            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                              isSelected ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-zinc-700'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                                isSelected ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Special Instructions Note Input */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Special instructions (e.g. Well done, no onions)..."
                    value={customItemNote}
                    onChange={(e) => setCustomItemNote(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 bg-[#12100E] border-t border-white/10 flex items-center justify-between gap-3 relative z-20">
              {/* Frosted Stepper [- 1 +] */}
              <div className="flex items-center gap-2 bg-white/[0.06] border border-white/15 rounded-2xl px-3 py-2 text-white">
                <button
                  disabled={customQty <= 1}
                  onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 active:scale-95 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-black text-white">{customQty}</span>
                <button
                  onClick={() => setCustomQty((q) => q + 1)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Glowing Amber/Orange CTA Button */}
              <button
                onClick={handleAddCustomizedToCart}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-[#C11221] hover:brightness-110 text-black font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 flex items-center justify-between active:scale-98 transition-all cursor-pointer"
              >
                <span>Add to Order</span>
                <span className="font-extrabold">
                  {(getCustomUnitPrice(selectedDetailItem) * customQty).toFixed(2)} ETB
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
        onSelectTable={(tableNumber) => {
          setWaiterTable(tableNumber);
          setOrderType('DINE_IN');
          setTableModalOpen(false);
        }}
        onTablesUpdated={setTables}
      />
    </div>
  );
}
