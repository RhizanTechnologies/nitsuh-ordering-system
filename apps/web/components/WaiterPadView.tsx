'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi, getSocket } from '@/lib/api';
import { calculatePrepTime } from '@/lib/timer-utils';
import { playReadyChime } from '@/lib/audio';
import { MenuImage } from '@/components/MenuImage';
import {
  Send,
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

  // Customizer Modal State
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [customSize, setCustomSize] = useState<'Regular' | 'Large' | 'X Large'>('Regular');
  const [customQty, setCustomQty] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [customItemNote, setCustomItemNote] = useState('');

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

      if (groupFilter === 'FASTING' && !isFastingItem(item)) return false;
      if (groupFilter === 'BURGER' && !isBurger(catName, item.name)) return false;
      if (groupFilter === 'PIZZA' && !isPizza(catName, item.name)) return false;
      if (groupFilter === 'CHICKEN' && !isChicken(catName, item.name)) return false;
      if (groupFilter === 'FRIES' && !isFries(catName, item.name)) return false;
      if (groupFilter === 'COFFEE' && !isCoffee(catName, item.name)) return false;
      if (groupFilter === 'DRINKS' && !isDrinks(catName)) return false;
      if (groupFilter === 'BAKERY' && !isBakery(catName)) return false;

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
  }, [allItems, groupFilter, selectedCategory, search]);

  const totalWaiterItems = waiterCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalWaiterBase = waiterCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalWaiterTip = waiterCart.reduce((sum, item) => sum + (item.tip || 0) * item.quantity, 0);
  const totalWaiterTax = totalWaiterBase * 0.15;
  const totalWaiterSum = totalWaiterBase + totalWaiterTip + totalWaiterTax;

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

  const handleSendToCashier = async () => {
    if (waiterCart.length === 0) return;

    const isTakeaway = orderType === 'TAKEAWAY';
    const selectedTableObj = isTakeaway ? null : tables.find((t) => t.tableNumber === waiterTable);

    if (!isTakeaway && (!waiterTable || !selectedTableObj)) {
      alert('Please select a valid dining table for Dine-In orders before sending.');
      return;
    }

    setSending(true);

    try {
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

  const categoryCards = [
    { id: 'ALL', label: 'All Menu', icon: LayoutGrid },
    { id: 'BURGER', label: 'Burger', icon: Sandwich },
    { id: 'CHICKEN', label: 'Chicken', icon: Drumstick },
    { id: 'PIZZA', label: 'Pizza', icon: Pizza },
    { id: 'FRIES', label: 'Fries', icon: Sparkles },
    { id: 'DRINKS', label: 'Drink', icon: CupSoda },
    { id: 'COFFEE', label: 'Coffee', icon: Coffee },
    { id: 'BAKERY', label: 'Dessert', icon: Cake },
    { id: 'FASTING', label: 'Fasting', icon: Leaf },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-[#F4F5F7] text-stone-900">
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



      {/* MAIN LAYOUT */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
        {/* COLUMN 1: LEFT VERTICAL CATEGORY SIDEBAR (Always on left on all devices) */}
        {activeTab === 'menu' && (
          <aside className="w-16 sm:w-20 md:w-24 bg-white border-r border-stone-200/90 py-2 sm:py-3 space-y-1 overflow-y-auto no-scrollbar flex-shrink-0 z-10 flex flex-col">
            {categoryCards.map((cat) => {
              const isActive = groupFilter === cat.id;
              const Icon = cat.icon;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setGroupFilter(cat.id as any);
                    setSelectedCategory('');
                  }}
                  className={`relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl transition text-center gap-1 group cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50/70 text-emerald-800 font-black'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {/* ClaPos Green Indicator Bar on Left Edge */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r-full" />
                  )}
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] leading-tight truncate max-w-full px-0.5">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* COLUMN 2: CENTER PRODUCT FOOD CARDS GRID */}
        <main className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 overflow-y-auto pb-24 lg:pb-6 no-scrollbar">
          {/* Top Search Bar & Controls directly bounded within the food catalog */}
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3.5 flex-shrink-0">
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

            {/* Live Kitchen Preparation Status Toggle */}
            <button
              onClick={() => setActiveTab(activeTab === 'menu' ? 'tables' : 'menu')}
              className={`px-3 py-2.5 rounded-2xl border transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer text-xs font-bold font-sans flex-shrink-0 ${
                activeTab === 'tables'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-2xs'
              }`}
              title="Toggle Live Kitchen Preparation Monitor"
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === 'tables' ? 'text-white' : 'text-emerald-600'}`} />
              <span className="hidden sm:inline">{activeTab === 'tables' ? 'Back to Food' : 'Live Status'}</span>
              {inFlightOrders.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    delayedOrders.length > 0
                      ? 'bg-[#C11221] text-white animate-pulse'
                      : activeTab === 'tables'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {inFlightOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Success Notification Alert */}
          {sentOrderNumber && (
            <div className="mb-4 bg-emerald-950/90 border border-emerald-500/50 p-3.5 rounded-2xl flex items-center gap-3 text-white shadow-xl animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
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

          {/* TAB 1: MENU PRODUCT GRID */}
          {activeTab === 'menu' && (
            <>
              {/* Active Category Title & Count */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
                    {categoryCards.find((c) => c.id === groupFilter)?.label || 'All Menu'}
                  </h2>
                  <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-bold">
                    {filteredItems.length} items
                  </span>
                </div>
              </div>

              {/* Empty State */}
              {filteredItems.length === 0 && (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 text-center my-4 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">No menu items found</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Try different search keywords or select another category.
                  </p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('');
                      setGroupFilter('ALL');
                    }}
                    className="mt-3.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
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
                  const isSelected = qty > 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.applicableAddons && item.applicableAddons.length > 0) {
                          openItemCustomizer(item);
                        } else {
                          addToWaiterCart({
                            id: item.id,
                            name: item.name,
                            price: Number(item.price),
                            imageUrl: item.imageUrl,
                          });
                        }
                      }}
                      className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden hover:shadow-md ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/25 shadow-sm'
                          : 'border-stone-200/90 hover:border-emerald-500/50'
                      }`}
                    >
                      {/* Full Culinary Image Header (Edge-to-Edge Shadcn Style, No Awkward Cropping) */}
                      <div className="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden flex-shrink-0">
                        <MenuImage
                          src={item.imageUrl}
                          alt={item.name}
                          categoryName={item.category?.name}
                          prepSection={item.prepSection}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Selected Count Badge Overlay */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10 bg-emerald-600 text-white font-black text-xs px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <span>x{qty}</span>
                          </div>
                        )}

                        {/* Station Tag */}
                        {item.prepSection && (
                          <div className="absolute bottom-2 left-2 z-10 bg-black/60 backdrop-blur-xs text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            {item.prepSection}
                          </div>
                        )}
                      </div>

                      {/* Card Content: Category Tag, Dish Title */}
                      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                            {item.category?.name || 'Dish'}
                          </span>
                          <h3
                            className="font-heading font-black text-sm sm:text-base text-stone-900 leading-snug mt-0.5 group-hover:text-emerald-700 transition line-clamp-1"
                            title={item.name}
                          >
                            {item.name}
                          </h3>
                        </div>

                        {/* Card Footer: Price & Add / Stepper */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-stone-100">
                          <div>
                            <div className="text-sm sm:text-base font-black text-stone-900 tracking-tight">
                              {Number(item.price).toFixed(2)}{' '}
                              <span className="text-[10px] font-bold text-stone-500">ETB</span>
                            </div>
                          </div>

                          {/* Stepper or Quick Add Button */}
                          {qty > 0 ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 bg-emerald-600 text-white p-1 rounded-xl shadow-xs"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateWaiterQuantity(item.id, -1);
                                }}
                                className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center cursor-pointer transition active:scale-90"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <span className="text-xs font-black px-1.5 min-w-[18px] text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateWaiterQuantity(item.id, 1);
                                }}
                                className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 flex items-center justify-center cursor-pointer transition active:scale-90"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.applicableAddons && item.applicableAddons.length > 0) {
                                  openItemCustomizer(item);
                                } else {
                                  addToWaiterCart({
                                    id: item.id,
                                    name: item.name,
                                    price: Number(item.price),
                                    imageUrl: item.imageUrl,
                                  });
                                }
                              }}
                              className="h-8 px-3 rounded-xl bg-stone-100 hover:bg-emerald-600 text-stone-700 hover:text-white font-bold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer group-hover:bg-emerald-600 group-hover:text-white active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Active Bottom Green Accent Bar (ClaPos style when in order) */}
                      {isSelected && (
                        <div className="h-1 w-full bg-emerald-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: LIVE KITCHEN PREPARATION MONITOR */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-200">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      <span>Live Kitchen Preparation Tracker</span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      Real-time status for tickets served by <span className="text-stone-900 font-bold">{currentUser?.name}</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal (&lt;15m)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning (15-20m)
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" /> Delayed (&gt;20m)
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
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-stone-900">#{order.orderNumber}</span>
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
                              <div className="text-xs font-bold text-stone-700 mt-0.5">
                                {order.orderType === 'TAKEAWAY'
                                  ? `🛍️ Takeaway (${order.customerName})`
                                  : `🍽️ Table ${order.table?.tableNumber || 'Guest'}`}
                              </div>
                            </div>

                            {/* Live Timer Pill */}
                            <div
                              className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
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
                              <Clock className="w-3.5 h-3.5" />
                              <span>{isDraft ? `Sent ${prep.formattedTime} ago` : `${prep.formattedTime} prep`}</span>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="mt-3 text-xs text-stone-600 space-y-1">
                            {order.items?.map((it: any) => (
                              <div key={it.id} className="flex justify-between">
                                <span>
                                  {it.quantity}x {it.menuItem?.name || 'Item'}
                                </span>
                                <span className="text-stone-500">
                                  {it.itemStatus || order.status}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-900">
                              {Number(order.totalAmount || 0).toFixed(2)} ETB
                            </span>

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

            {orderType === 'DINE_IN' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase">
                  <span>Dining Table</span>
                  <button
                    onClick={() => setTableModalOpen(true)}
                    className="text-emerald-700 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Floor Plan</span>
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={waiterTable}
                    onChange={(e) => setWaiterTable(e.target.value)}
                    className="w-full appearance-none bg-stone-50 border border-stone-300 hover:border-emerald-500 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {tables.map((t) => {
                      const isOccupied = t.status === 'OCCUPIED';
                      return (
                        <option
                          key={t.id}
                          value={t.tableNumber}
                          className="bg-white text-stone-900"
                        >
                          Table {t.tableNumber} ({t.capacity} seats){isOccupied ? ' • Seated' : ' • Open'}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
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
                          const val = window.prompt(`Enter custom server tip for "${item.name}" (ETB):`, '15');
                          if (val !== null && val.trim() !== '') {
                            const parsed = parseFloat(val);
                            if (!isNaN(parsed) && parsed >= 0) {
                              setWaiterItemTip(item.menuItemId, parsed);
                            }
                          }
                        }}
                        className="text-[9px] font-bold text-stone-600 hover:text-emerald-700 transition cursor-pointer"
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
              <div className="flex justify-between items-center">
                <span>15% VAT</span>
                <span className="font-bold text-stone-900">{totalWaiterTax.toFixed(2)} ETB</span>
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
                  ? 'Sending Order Note...'
                  : isCurrentTableOccupied
                  ? `Append to Table ${waiterTable || ''} (Active Bill)`
                  : 'Send Note to Cashier (Paperless)'}
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* MOBILE / TABLET FLOATING DOCK (Visible on < lg screens) */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-40 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-2 px-4 sm:px-8 shadow-xl flex items-center justify-around">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center gap-1 py-1 px-3 sm:px-5 rounded-xl transition cursor-pointer ${
            activeTab === 'menu' ? 'text-emerald-600 font-black' : 'text-stone-500'
          }`}
        >
          <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>

        <button
          onClick={() => setShowMobileDrawer(true)}
          className="relative flex flex-col items-center gap-1 py-1 px-3 sm:px-5 rounded-xl text-stone-500 hover:text-emerald-600 transition cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-stone-600" />
            {totalWaiterItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] w-4 h-4 rounded-full font-black flex items-center justify-center shadow-xs">
                {totalWaiterItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Review Slip</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 sm:px-5 rounded-xl transition cursor-pointer ${
            activeTab === 'tables' ? 'text-emerald-600 font-black' : 'text-stone-500'
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
          <span className="text-[10px] font-bold">Kitchen Status</span>
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

            <div className="py-2.5">
              <input
                type="text"
                placeholder="Special notes (e.g. Less sugar, extra hot)..."
                value={waiterSpecialNotes}
                onChange={(e) => setWaiterSpecialNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none"
              />
            </div>

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
                    ? 'Sending...'
                    : isCurrentTableOccupied
                    ? `Append Round to Table ${waiterTable} (Active Bill)`
                    : 'Confirm & Send to Cashier'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT CUSTOMIZER MODAL */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 pb-4 border-b border-stone-200 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 border border-stone-200/80">
                  <MenuImage
                    src={selectedDetailItem.imageUrl}
                    alt={selectedDetailItem.name}
                    categoryName={selectedDetailItem.category?.name}
                    prepSection={selectedDetailItem.prepSection}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-stone-900 leading-tight">
                    {selectedDetailItem.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {selectedDetailItem.description || 'Delicious freshly prepared recipe with authentic culinary craft.'}
                  </p>
                  <div className="text-xs font-bold text-emerald-600 mt-1">
                    {Number(selectedDetailItem.price).toFixed(2)} ETB
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDetailItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-700">Qty</span>
                <div className="flex items-center gap-2 bg-stone-100 border border-stone-300 rounded-xl px-2 py-1">
                  <button
                    disabled={customQty <= 1}
                    onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                    className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-stone-900">
                    {customQty}
                  </span>
                  <button
                    onClick={() => setCustomQty((q) => q + 1)}
                    className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-stone-700 mb-2">Size</div>
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
                        type="button"
                        onClick={() => setCustomSize(sz.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs transition border flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span>{sz.label}</span>
                        <span className="text-[10px] font-semibold opacity-75">
                          {sz.add > 0 ? `+${sz.add}` : '+0'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDetailItem.applicableAddons && selectedDetailItem.applicableAddons.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-stone-700 mb-2">Add-ons</div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDetailItem.applicableAddons.map((addon: any) => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon.id)}
                          className={`py-2 px-3 rounded-xl text-xs transition border flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <span className="truncate">{addon.name}</span>
                          <span className="text-[10px] font-semibold opacity-75 ml-1">
                            +{Number(addon.price).toFixed(0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Add some notes..."
                  value={customItemNote}
                  onChange={(e) => setCustomItemNote(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs">
                <span className="text-stone-500">Total: </span>
                <span className="text-base font-black text-stone-900">
                  {(getCustomUnitPrice(selectedDetailItem) * customQty).toFixed(2)} ETB
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDetailItem(null)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomizedToCart}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
                >
                  Add
                </button>
              </div>
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
