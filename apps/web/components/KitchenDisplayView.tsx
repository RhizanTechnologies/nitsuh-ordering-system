'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi, getSocket } from '@/lib/api';
import { ChefHat, Flame, CheckCircle, Clock, Utensils } from 'lucide-react';
import { playKitchenChime, playReadyChime } from '@/lib/audio';
import { calculatePrepTime } from '@/lib/timer-utils';

export function KitchenDisplayView() {
  const { currentUser } = useAppStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [mobileTab, setMobileTab] = useState<'NEW' | 'PREPARING' | 'READY'>('NEW');
  const [, setTick] = useState(0);

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
    try {
      const updated = await fetchApi(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          actorUserId: currentUser?.id,
        }),
      });

      setOrders((prev) => {
        if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(status)) {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => (o.id === orderId ? updated : o));
      });
    } catch (err: any) {
      alert(`Error updating order: ${err.message}`);
    }
  };

  const newOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const preparingOrders = orders.filter((o) => o.status === 'IN_PREPARATION');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  // Auto-focus on active tickets if currently selected mobile tab has none
  useEffect(() => {
    if (newOrders.length > 0) setMobileTab('NEW');
    else if (preparingOrders.length > 0) setMobileTab('PREPARING');
    else if (readyOrders.length > 0) setMobileTab('READY');
  }, [newOrders.length, preparingOrders.length, readyOrders.length]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0D0B0A] text-white relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C11221]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Clean Top KDS Bar - Minimal & High Contrast */}
      <div className="bg-[#12100E]/95 backdrop-blur-xl border-b border-white/10 px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-[#C11221] p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full rounded-[10px] bg-[#161311] flex items-center justify-center text-amber-400">
              <ChefHat className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-2">
              <span>Kitchen Display (KDS)</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                LIVE
              </span>
            </h2>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 sm:gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{newOrders.length} New</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-orange-400">
            <Flame className="w-3.5 h-3.5" />
            <span>{preparingOrders.length} Cooking</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{readyOrders.length} Ready</span>
          </div>
        </div>
      </div>

      {/* Mobile Stage Switcher (<md): 1 Tap to View Active Category with ZERO Scrolling */}
      <div className="md:hidden flex items-center p-1 bg-white/[0.04] border border-white/10 rounded-2xl mx-3 mt-2.5 mb-1 gap-1 flex-shrink-0 relative z-10">
        <button
          onClick={() => setMobileTab('NEW')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'NEW'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🟡 New</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            mobileTab === 'NEW' ? 'bg-black/30 text-black' : 'bg-white/10 text-zinc-400'
          }`}>
            {newOrders.length}
          </span>
        </button>

        <button
          onClick={() => setMobileTab('PREPARING')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'PREPARING'
              ? 'bg-orange-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>🔥 Cooking</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            mobileTab === 'PREPARING' ? 'bg-black/30 text-black' : 'bg-white/10 text-zinc-400'
          }`}>
            {preparingOrders.length}
          </span>
        </button>

        <button
          onClick={() => setMobileTab('READY')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'READY'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>✅ Ready</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
            mobileTab === 'READY' ? 'bg-black/30 text-black' : 'bg-white/10 text-zinc-400'
          }`}>
            {readyOrders.length}
          </span>
        </button>
      </div>

      {/* Kanban Board: 3 Columns on Tablet/Desktop, 1 Responsive Active Column on Mobile */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-5 overflow-y-auto relative z-10 no-scrollbar">
        {/* Column 1: New Confirmed Orders */}
        <div className={`${mobileTab === 'NEW' ? 'flex' : 'hidden md:flex'} flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-3.5 sm:p-4 backdrop-blur-xl shadow-xl min-h-[300px]`}>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10 flex-shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>1. New Tickets ({newOrders.length})</span>
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {newOrders.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-xs text-zinc-500">
                <Clock className="w-6 h-6 mb-1 text-zinc-600 stroke-1" />
                <span>No new tickets waiting</span>
              </div>
            ) : (
              newOrders.map((order) => {
                const prep = calculatePrepTime(order.createdAt);
                return (
                  <div
                    key={order.id}
                    className={`bg-white/[0.05] border rounded-2xl p-3.5 shadow-xl backdrop-blur-xl transition ${
                      prep.delayStatus === 'DELAYED'
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : prep.delayStatus === 'WARNING'
                        ? 'border-amber-500/80'
                        : 'border-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black text-white">
                        #{order.orderNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            prep.delayStatus === 'DELAYED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : prep.delayStatus === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prep.delayStatus === 'DELAYED' ? 'bg-rose-500 animate-ping' : prep.delayStatus === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          {prep.formattedTime}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                            order.orderType === 'TAKEAWAY'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                          }`}
                        >
                          {order.orderType === 'TAKEAWAY'
                            ? `🛍️ TAKEAWAY`
                            : `🍽️ Table ${order.table?.tableNumber || 'Assigned'}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 mb-2">
                      {order.orderType === 'TAKEAWAY' && order.customerName && (
                        <span>Customer: <strong className="text-white">{order.customerName}</strong> • </span>
                      )}
                      <span>Server: <strong className="text-amber-400">{order.waiter?.name || 'Counter'}</strong></span>
                    </div>

                    {/* Items list */}
                    <div className="space-y-1.5 mb-3 border-t border-b border-white/10 py-2">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-amber-400">{item.quantity}x</span>
                            <span className="text-white font-bold">{item.menuItem.name}</span>
                          </div>
                          {item.specialInstructions && (
                            <div className="text-[10px] text-amber-300/90 italic pl-5 mt-0.5">
                              &ldquo;{item.specialInstructions}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => updateStatus(order.id, 'IN_PREPARATION')}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Flame className="w-4 h-4 fill-black" />
                      <span>Accept & Start Prep</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: In Preparation */}
        <div className={`${mobileTab === 'PREPARING' ? 'flex' : 'hidden md:flex'} flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-3.5 sm:p-4 backdrop-blur-xl shadow-xl min-h-[300px]`}>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10 flex-shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span>2. Cooking / Brewing ({preparingOrders.length})</span>
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {preparingOrders.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-xs text-zinc-500">
                <Flame className="w-6 h-6 mb-1 text-zinc-600 stroke-1" />
                <span>Kitchen is all clear</span>
              </div>
            ) : (
              preparingOrders.map((order) => {
                const prep = calculatePrepTime(order.createdAt);
                return (
                  <div
                    key={order.id}
                    className={`bg-white/[0.05] border rounded-2xl p-3.5 shadow-xl backdrop-blur-xl transition ${
                      prep.delayStatus === 'DELAYED'
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : prep.delayStatus === 'WARNING'
                        ? 'border-amber-500/80'
                        : 'border-white/10 hover:border-orange-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black text-white">
                        #{order.orderNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            prep.delayStatus === 'DELAYED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : prep.delayStatus === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prep.delayStatus === 'DELAYED' ? 'bg-rose-500 animate-ping' : prep.delayStatus === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          {prep.formattedTime}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${
                            order.orderType === 'TAKEAWAY'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'text-orange-300 bg-orange-500/20 border-orange-500/30'
                          }`}
                        >
                          {order.orderType === 'TAKEAWAY'
                            ? `🛍️ TAKEAWAY`
                            : `🍽️ Table ${order.table?.tableNumber || 'Assigned'}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 mb-2">
                      {order.orderType === 'TAKEAWAY' && order.customerName && (
                        <span>Customer: <strong className="text-white">{order.customerName}</strong> • </span>
                      )}
                      <span>Server: <strong className="text-amber-400">{order.waiter?.name || 'Counter'}</strong></span>
                    </div>

                    {/* Items list */}
                    <div className="space-y-1.5 mb-3 border-t border-b border-white/10 py-2">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-orange-400">{item.quantity}x</span>
                            <span className="text-white font-bold">{item.menuItem.name}</span>
                          </div>
                          {item.specialInstructions && (
                            <div className="text-[10px] text-amber-300/90 italic pl-5 mt-0.5">
                              &ldquo;{item.specialInstructions}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => updateStatus(order.id, 'READY')}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark Order Ready!</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Ready for Serving */}
        <div className={`${mobileTab === 'READY' ? 'flex' : 'hidden md:flex'} flex-col bg-white/[0.03] border border-white/10 rounded-3xl p-3.5 sm:p-4 backdrop-blur-xl shadow-xl min-h-[300px]`}>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10 flex-shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>3. Ready for Service ({readyOrders.length})</span>
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {readyOrders.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-xs text-zinc-500">
                <CheckCircle className="w-6 h-6 mb-1 text-zinc-600 stroke-1" />
                <span>No orders waiting for pickup</span>
              </div>
            ) : (
              readyOrders.map((order) => {
                const prep = calculatePrepTime(order.createdAt);
                return (
                  <div
                    key={order.id}
                    className="bg-white/[0.05] border border-emerald-500/40 rounded-2xl p-3.5 shadow-xl backdrop-blur-xl animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black text-emerald-300">
                        #{order.orderNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {prep.formattedTime}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${
                            order.orderType === 'TAKEAWAY'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                          }`}
                        >
                          {order.orderType === 'TAKEAWAY'
                            ? `🛍️ TAKEAWAY`
                            : `🍽️ Table ${order.table?.tableNumber || 'Assigned'}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 mb-2">
                      <span>Server: <strong className="text-amber-400">{order.waiter?.name || 'Counter'}</strong></span>
                      {order.customerName && <span> • Guest: <strong className="text-white">{order.customerName}</strong></span>}
                    </div>

                    {/* Items list */}
                    <div className="space-y-1 mb-3 text-xs text-zinc-200 border-t border-b border-white/10 py-2">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-400">{item.quantity}x</span>
                          <span className="font-bold text-white">{item.menuItem.name}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => updateStatus(order.id, 'SERVED')}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Delivered & Served</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
