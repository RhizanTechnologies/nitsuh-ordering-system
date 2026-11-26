'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi, getSocket } from '@/lib/api';
import { ChefHat, Flame, CheckCircle, Clock, Utensils, AlertTriangle, X, Volume2, Undo2, Check, Loader2 } from 'lucide-react';
import { playKitchenChime, playReadyChime } from '@/lib/audio';
import { calculatePrepTime } from '@/lib/timer-utils';
import { Button, Badge } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

// Clean helpers for formatting and high-contrast badges across themes
const formatOrderNumber = (num: any) => {
  const str = String(num || '').trim().replace(/^#+/, '');
  return `#${str}`;
};

const getPrepBadge = (prep: any) => {
  if (prep.delayStatus === 'DELAYED') {
    return {
      dot: 'bg-rose-500 animate-ping',
      badge: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
    };
  }
  if (prep.delayStatus === 'WARNING') {
    return {
      dot: 'bg-amber-400',
      badge: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
    };
  }
  return {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
  };
};

export function KitchenDisplayView() {
  const { currentUser } = useAppStore();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [mobileTab, setMobileTab] = useState<'NEW' | 'PREPARING' | 'READY'>('NEW');
  const [toastError, setToastError] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<{ orderId: string; prevStatus: string; orderNumber: string } | null>(null);
  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({});
  const [loadingOrderIds, setLoadingOrderIds] = useState<Record<string, boolean>>({});
  const [audioPrompt, setAudioPrompt] = useState(false);
  const [, setTick] = useState(0);

  const toggleItemCompleted = (itemId: string) => {
    setCompletedItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const enableAudio = () => {
    try {
      playKitchenChime();
      setAudioPrompt(false);
    } catch (e) {
      // ignore
    }
  };

  const loadActiveOrders = () => {
    fetchApi('/orders?statuses=CONFIRMED,IN_PREPARATION,READY')
      .then((data) => setOrders(data))
      .catch((err) => console.error('Failed to load kitchen orders', err));
  };

  useEffect(() => {
    loadActiveOrders();

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    const socket = getSocket();

    socket.on('order:confirmed', (newOrder) => {
      playKitchenChime();
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    });

    socket.on('kitchen:order_status', (updatedOrder) => {
      setOrders((prev) => {
        if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) {
          return prev.filter((o) => o.id !== updatedOrder.id);
        }
        return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      });
    });

    socket.on('kitchen:order_ready', (readyOrder) => {
      playReadyChime();
      setOrders((prev) =>
        prev.map((o) => (o.id === readyOrder.id ? readyOrder : o))
      );
    });

    return () => {
      clearInterval(interval);
      socket.off('order:confirmed');
      socket.off('kitchen:order_status');
      socket.off('kitchen:order_ready');
    };
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    if (loadingOrderIds[orderId]) return;
    setLoadingOrderIds((prev) => ({ ...prev, [orderId]: true }));

    try {
      const current = orders.find((o) => o.id === orderId);
      const updated = await fetchApi(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          actorUserId: currentUser?.id,
        }),
      });

      if (current && ['READY', 'SERVED'].includes(status)) {
        setUndoToast({
          orderId,
          prevStatus: current.status,
          orderNumber: formatOrderNumber(current.orderNumber),
        });
        setTimeout(() => setUndoToast(null), 6000);
      }

      setOrders((prev) => {
        if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(status)) {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => (o.id === orderId ? updated : o));
      });
      setToastError(null);
    } catch (err: any) {
      setToastError(err.message || 'Error updating order status');
      setTimeout(() => setToastError(null), 5000);
    } finally {
      setLoadingOrderIds((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleUndo = async () => {
    if (!undoToast) return;
    try {
      await fetchApi(`/orders/${undoToast.orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: undoToast.prevStatus,
          actorUserId: currentUser?.id,
        }),
      });
      setUndoToast(null);
      loadActiveOrders();
    } catch (err: any) {
      setToastError('Failed to undo order status');
    }
  };

  const newOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const preparingOrders = orders.filter((o) => o.status === 'IN_PREPARATION');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  // Set initial mobile tab once on load - NEVER interrupt cooks while viewing tickets (BUG-029)
  const initialTabSetRef = useRef(false);
  useEffect(() => {
    if (!initialTabSetRef.current && orders.length > 0) {
      if (newOrders.length > 0) setMobileTab('NEW');
      else if (preparingOrders.length > 0) setMobileTab('PREPARING');
      else if (readyOrders.length > 0) setMobileTab('READY');
      initialTabSetRef.current = true;
    }
  }, [orders.length, newOrders.length, preparingOrders.length, readyOrders.length]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FA] text-stone-900 font-sans relative transition-colors">
      {/* Clean Top KDS Bar - Matching Waiter and POS Style */}
      <div className="bg-white border-b border-stone-200/90 px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/90 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black tracking-tight text-stone-900 flex items-center gap-2">
              <span>Kitchen Display (KDS)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            </h2>
          </div>
        </div>

        {/* Live Counters */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{newOrders.length} New</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200/90 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-orange-600" />
            <span>{preparingOrders.length} Cooking</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{readyOrders.length} Ready</span>
          </div>
        </div>
      </div>

      {/* Floating In-App Toast Notification */}
      {toastError && (
        <div className="mx-3 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 shadow-md relative z-20 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{toastError}</span>
          </div>
          <button
            onClick={() => setToastError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Stage Switcher (<md): 1 Tap to View Active Category */}
      <div className="md:hidden flex items-center p-1 bg-white border border-stone-200/90 rounded-2xl mx-3 mt-2.5 mb-1 gap-1 flex-shrink-0 shadow-2xs">
        <button
          onClick={() => setMobileTab('NEW')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'NEW'
              ? 'bg-amber-500 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <span>🟡 {t('kds_new_orders', 'New')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            mobileTab === 'NEW' ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {newOrders.length}
          </span>
        </button>

        <button
          onClick={() => setMobileTab('PREPARING')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'PREPARING'
              ? 'bg-orange-500 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <span>🔥 {t('kds_cooking', 'Cooking')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            mobileTab === 'PREPARING' ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {preparingOrders.length}
          </span>
        </button>

        <button
          onClick={() => setMobileTab('READY')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'READY'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <span>✅ {t('kds_ready', 'Ready')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            mobileTab === 'READY' ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {readyOrders.length}
          </span>
        </button>
      </div>

      {/* Kanban Board: 3 Columns on Tablet/Desktop, 1 Responsive Active Column on Mobile */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-5 overflow-y-auto relative no-scrollbar">
        {/* Column 1: New Confirmed Orders */}
        <div className={`${mobileTab === 'NEW' ? 'flex' : 'hidden md:flex'} flex-col bg-stone-100/70 border border-stone-200/90 rounded-3xl p-3.5 sm:p-4 shadow-xs min-h-[300px]`}>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-stone-200/80 flex-shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>1. {t('kds_new_orders', 'New Tickets')} ({newOrders.length})</span>
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {newOrders.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-xs text-stone-400">
                <Clock className="w-6 h-6 mb-1 text-stone-400 stroke-1" />
                <span>{t('kds_awaiting_orders', 'No new tickets waiting')}</span>
              </div>
            ) : (
              newOrders.map((order) => {
                const prep = calculatePrepTime(order.createdAt);
                const prepStyle = getPrepBadge(prep);
                const isLoading = Boolean(loadingOrderIds[order.id]);
                return (
                  <div
                    key={order.id}
                    className="bg-white border border-stone-200/90 hover:border-amber-400 rounded-2xl p-4 shadow-xs transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black text-stone-900">
                        {formatOrderNumber(order.orderNumber)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${prepStyle.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prepStyle.dot}`} />
                          {prep.formattedTime}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          order.orderType === 'TAKEAWAY'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-stone-100 text-stone-800 border-stone-200'
                        }`}>
                          {order.orderType === 'TAKEAWAY' ? '🛍️ TAKEAWAY' : `🍽️ Table ${order.table?.tableNumber || 'Assigned'}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 mb-2 flex items-center justify-between">
                      <div>
                        {order.orderType === 'TAKEAWAY' && order.customerName && (
                          <span>Guest: <strong className="text-stone-900 font-bold">{order.customerName}</strong> • </span>
                        )}
                        <span>Server: <strong className="text-stone-800 font-bold">{order.waiter?.name || 'Counter'}</strong></span>
                      </div>
                    </div>

                    {/* Order Note Callout if any */}
                    {order.notes && (
                      <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-start gap-1.5">
                        <span className="font-bold text-amber-800 flex-shrink-0">Note:</span>
                        <span className="break-words">{order.notes}</span>
                      </div>
                    )}

                    {/* Items list */}
                    <div className="space-y-1.5 mb-3 border-t border-b border-stone-100 py-2.5">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => toggleItemCompleted(item.id)}
                          className={`p-1.5 rounded-xl cursor-pointer transition select-none ${
                            completedItemIds[item.id]
                              ? 'opacity-40 line-through bg-stone-100'
                              : 'hover:bg-stone-50'
                          }`}
                          title="Click to check off prepared item"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded-md">{item.quantity}x</span>
                              <span className="text-stone-800 font-bold">{item.menuItem?.name || item.name || 'Dish'}</span>
                            </div>
                            {completedItemIds[item.id] && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            )}
                          </div>
                          {item.specialInstructions && (
                            <div className="text-[10px] text-amber-800 italic pl-7 mt-0.5">
                              &ldquo;{item.specialInstructions}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      disabled={isLoading}
                      onClick={() => updateStatus(order.id, 'IN_PREPARATION')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Starting Prep...</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4" />
                          <span>{t('kds_start_cooking', 'Accept & Start Prep')}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: In Preparation */}
        <div className={`${mobileTab === 'PREPARING' ? 'flex' : 'hidden md:flex'} flex-col bg-stone-100/70 border border-stone-200/90 rounded-3xl p-3.5 sm:p-4 shadow-xs min-h-[300px]`}>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-stone-200/80 flex-shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-orange-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>2. {t('kds_cooking', 'Cooking / Brewing')} ({preparingOrders.length})</span>
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {preparingOrders.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-xs text-stone-400">
                <Flame className="w-6 h-6 mb-1 text-stone-400 stroke-1" />
                <span>{t('kds_all_clear', 'Kitchen is all clear')}</span>
              </div>
            ) : (
              preparingOrders.map((order) => {
                const prep = calculatePrepTime(order.createdAt);
                const prepStyle = getPrepBadge(prep);
                const isLoading = Boolean(loadingOrderIds[order.id]);
                return (
                  <div
                    key={order.id}
                    className="bg-white border border-stone-200/90 hover:border-orange-400 rounded-2xl p-4 shadow-xs transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black text-stone-900">
                        {formatOrderNumber(order.orderNumber)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${prepStyle.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prepStyle.dot}`} />
                          {prep.formattedTime}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          order.orderType === 'TAKEAWAY'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-stone-100 text-stone-800 border-stone-200'
                        }`}>
                          {order.orderType === 'TAKEAWAY' ? '🛍️ TAKEAWAY' : `🍽️ Table ${order.table?.tableNumber || 'Assigned'}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 mb-2 flex items-center justify-between">
                      <div>
                        {order.orderType === 'TAKEAWAY' && order.customerName && (
                          <span>Guest: <strong className="text-stone-900 font-bold">{order.customerName}</strong> • </span>
                        )}
                        <span>Server: <strong className="text-stone-800 font-bold">{order.waiter?.name || 'Counter'}</strong></span>
                      </div>
                    </div>

                    {/* Order Note Callout if any */}
                    {order.notes && (
                      <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-start gap-1.5">
                        <span className="font-bold text-amber-800 flex-shrink-0">Note:</span>
                        <span className="break-words">{order.notes}</span>
                      </div>
                    )}

                    {/* Items list */}
                    <div className="space-y-1.5 mb-3 border-t border-b border-stone-100 py-2.5">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => toggleItemCompleted(item.id)}
                          className={`p-1.5 rounded-xl cursor-pointer transition select-none ${
                            completedItemIds[item.id]
                              ? 'opacity-40 line-through bg-stone-100'
                              : 'hover:bg-stone-50'
                          }`}
                          title="Click to check off prepared item"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">{item.quantity}x</span>
                              <span className="text-stone-800 font-bold">{item.menuItem?.name || item.name || 'Dish'}</span>
                            </div>
                            {completedItemIds[item.id] && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            )}
                          </div>
                          {item.specialInstructions && (
                            <div className="text-[10px] text-amber-800 italic pl-7 mt-0.5">
                              &ldquo;{item.specialInstructions}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      disabled={isLoading}
                      onClick={() => updateStatus(order.id, 'READY')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Marking Ready...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>{t('kds_mark_ready', 'Mark Order Ready!')}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Ready for Serving */}
        <div className={`${mobileTab === 'READY' ? 'flex' : 'hidden md:flex'} flex-col bg-stone-100/70 border border-stone-200/90 rounded-3xl p-3.5 sm:p-4 shadow-xs min-h-[300px]`}>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-stone-200/80 flex-shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>3. {t('kds_ready', 'Ready for Service')} ({readyOrders.length})</span>
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {readyOrders.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-xs text-stone-400">
                <CheckCircle className="w-6 h-6 mb-1 text-stone-400 stroke-1" />
                <span>{t('kds_awaiting_orders', 'No orders waiting for pickup')}</span>
              </div>
            ) : (
              readyOrders.map((order) => {
                const prep = calculatePrepTime(order.createdAt);
                const prepStyle = getPrepBadge(prep);
                const isLoading = Boolean(loadingOrderIds[order.id]);
                return (
                  <div
                    key={order.id}
                    className="bg-emerald-50/50 border border-emerald-200/90 hover:border-emerald-300 rounded-2xl p-4 shadow-xs transition animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black text-emerald-800">
                        {formatOrderNumber(order.orderNumber)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${prepStyle.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prepStyle.dot}`} />
                          {prep.formattedTime}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          order.orderType === 'TAKEAWAY'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        }`}>
                          {order.orderType === 'TAKEAWAY' ? '🛍️ TAKEAWAY' : `🍽️ Table ${order.table?.tableNumber || 'Assigned'}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 mb-2 flex items-center justify-between">
                      <div>
                        {order.customerName && <span>Guest: <strong className="text-stone-900 font-bold">{order.customerName}</strong> • </span>}
                        <span>Server: <strong className="text-stone-800 font-bold">{order.waiter?.name || 'Counter'}</strong></span>
                      </div>
                    </div>

                    {/* Order Note Callout if any */}
                    {order.notes && (
                      <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-start gap-1.5">
                        <span className="font-bold text-amber-800 flex-shrink-0">Note:</span>
                        <span className="break-words">{order.notes}</span>
                      </div>
                    )}

                    {/* Items list */}
                    <div className="space-y-1 mb-3 text-xs border-t border-b border-emerald-100/80 py-2.5">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <span className="font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">{item.quantity}x</span>
                          <span className="font-bold text-stone-800">{item.menuItem?.name || item.name || 'Dish'}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      disabled={isLoading}
                      onClick={() => updateStatus(order.id, 'SERVED')}
                      className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Delivering...</span>
                        </>
                      ) : (
                        <>
                          <Utensils className="w-4 h-4" />
                          <span>{t('kds_bump', 'Delivered & Served')}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick 6-Second Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white border border-stone-700/80 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="text-xs font-bold">
            Order <strong className="text-amber-400">{undoToast.orderNumber}</strong> status updated.
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUndo}
            className="h-7 px-2.5 text-xs font-black bg-amber-500 text-stone-950 hover:bg-amber-400 border-none flex items-center gap-1 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Undo</span>
          </Button>
        </div>
      )}
    </div>
  );
}
