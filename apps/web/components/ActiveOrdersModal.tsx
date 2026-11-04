'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  Receipt,
  CreditCard,
  PlusCircle,
  Clock,
  UserCheck,
  Smartphone,
  CheckCircle,
  Flame,
  ShoppingBag,
  Utensils
} from 'lucide-react';

interface ActiveOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  onSettleOrder: (order: any) => void;
  onPrintReceipt: (order: any) => void;
  onAppendItems: (order: any) => void;
  onRefreshOrders?: () => void;
}

export function ActiveOrdersModal({
  isOpen,
  onClose,
  orders,
  onSettleOrder,
  onPrintReceipt,
  onAppendItems,
  onRefreshOrders,
}: ActiveOrdersModalProps) {
  const [filter, setFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'UNPAID' | 'READY'>('ALL');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    // Status filter
    if (filter === 'DINE_IN' && o.orderType !== 'DINE_IN') return false;
    if (filter === 'TAKEAWAY' && o.orderType !== 'TAKEAWAY') return false;
    if (filter === 'UNPAID' && o.paymentStatus === 'PAID') return false;
    if (filter === 'READY' && o.status !== 'READY') return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const numMatch = o.orderNumber?.toLowerCase().includes(q);
      const tableMatch = o.table?.tableNumber?.toLowerCase().includes(q);
      const custMatch = o.customerName?.toLowerCase().includes(q);
      const cashierMatch = o.cashier?.name?.toLowerCase().includes(q);
      const waiterMatch = o.waiter?.name?.toLowerCase().includes(q);
      return numMatch || tableMatch || custMatch || cashierMatch || waiterMatch;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#161311] text-white rounded-[32px] max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-white/15 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <span>Cashier Orders & Live Active Tickets</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Overview of all active dine-in table bills and takeaway orders with cashier & waiter attribution
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.08] hover:bg-white/[0.15] rounded-xl transition text-zinc-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md'
                  : 'bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              All Active ({orders.length})
            </button>
            <button
              onClick={() => setFilter('DINE_IN')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'DINE_IN'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md'
                  : 'bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Utensils className="w-3 h-3" />
              Dine-In ({orders.filter((o) => o.orderType === 'DINE_IN').length})
            </button>
            <button
              onClick={() => setFilter('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filter === 'TAKEAWAY'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md'
                  : 'bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              Takeaway ({orders.filter((o) => o.orderType === 'TAKEAWAY').length})
            </button>
            <button
              onClick={() => setFilter('UNPAID')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                filter === 'UNPAID'
                  ? 'bg-[#C11221] text-white font-black shadow-md'
                  : 'bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              Unpaid ({orders.filter((o) => o.paymentStatus !== 'PAID').length})
            </button>
            <button
              onClick={() => setFilter('READY')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                filter === 'READY'
                  ? 'bg-emerald-600 text-white font-black shadow-md'
                  : 'bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              Ready ({orders.filter((o) => o.status === 'READY').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table, cashier, guest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Orders Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500">
              No orders found matching the filter criteria.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isPaid = order.paymentStatus === 'PAID';
              const isTakeaway = order.orderType === 'TAKEAWAY';

              return (
                <div
                  key={order.id}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 shadow-lg hover:border-amber-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl"
                >
                  {/* Left: Metadata & Attribution */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">#{order.orderNumber}</span>

                      {/* Destination Badge */}
                      {isTakeaway ? (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          TAKEAWAY ({order.customerName || 'Pickup'})
                        </span>
                      ) : (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Utensils className="w-3 h-3" />
                          Table {order.table?.tableNumber || 'Counter'}
                        </span>
                      )}

                      {/* Kitchen Preparation Status */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'READY'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                            : order.status === 'IN_PREPARATION'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : order.status === 'CONFIRMED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {order.status}
                      </span>

                      {/* Payment Status */}
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#C11221] text-white shadow-sm'
                        }`}
                      >
                        {isPaid ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>

                    {/* Attribution Line */}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 flex-wrap">
                      <div className="flex items-center gap-1 font-semibold text-zinc-300">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cashier:</span>
                        <span className="font-bold text-amber-400">
                          {order.cashier?.name || 'Assigned Station'}
                        </span>
                      </div>

                      {order.waiter && (
                        <div className="flex items-center gap-1 text-zinc-300">
                          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                          <span>Server:</span>
                          <span className="font-semibold">{order.waiter.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-zinc-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Items Summary Line */}
                    <div className="text-xs text-zinc-300 font-medium truncate pt-1">
                      {order.items?.map((itm: any) => `${itm.quantity}x ${itm.menuItem?.name || itm.name}`).join(', ')}
                    </div>
                  </div>

                  {/* Right: Financial Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase">Total Bill (15% VAT)</div>
                      <div className="text-base font-black text-amber-400">
                        {Number(order.totalAmount).toFixed(2)} ETB
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Add Items Button (for open dine-in table orders) */}
                      {!isPaid && (
                        <button
                          onClick={() => {
                            onAppendItems(order);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Add more items to this order"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Items</span>
                        </button>
                      )}

                      {/* Settle Bill Button */}
                      {!isPaid ? (
                        <button
                          onClick={() => {
                            onSettleOrder(order);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl text-xs font-black shadow-lg shadow-amber-500/25 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Settle Bill</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onPrintReceipt(order);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.15] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
