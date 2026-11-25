'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  CreditCard,
  PlusCircle,
  Clock,
  UserCheck,
  Smartphone,
  ShoppingBag,
  Utensils,
  Printer
} from 'lucide-react';
import { Button, Badge, Input } from '@/components/ui';

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
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white text-stone-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-stone-200 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-900">
                Active Orders & Live Bills
              </h3>
            </div>
          </div>
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onClose}
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <Button
              variant={filter === 'ALL' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('ALL')}
            >
              All Active ({orders.length})
            </Button>
            <Button
              variant={filter === 'DINE_IN' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('DINE_IN')}
            >
              <Utensils className="w-3 h-3" />
              Dine-In ({orders.filter((o) => o.orderType === 'DINE_IN').length})
            </Button>
            <Button
              variant={filter === 'TAKEAWAY' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('TAKEAWAY')}
            >
              <ShoppingBag className="w-3 h-3" />
              Takeaway ({orders.filter((o) => o.orderType === 'TAKEAWAY').length})
            </Button>
            <Button
              variant={filter === 'UNPAID' ? 'destructive' : 'secondary'}
              size="sm"
              onClick={() => setFilter('UNPAID')}
            >
              Unpaid ({orders.filter((o) => o.paymentStatus !== 'PAID').length})
            </Button>
            <Button
              variant={filter === 'READY' ? 'success' : 'secondary'}
              size="sm"
              onClick={() => setFilter('READY')}
            >
              Ready ({orders.filter((o) => o.status === 'READY').length})
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search table, cashier, guest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Orders Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400">
              No orders found matching the filter criteria.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isPaid = order.paymentStatus === 'PAID';
              const isTakeaway = order.orderType === 'TAKEAWAY';

              return (
                <div
                  key={order.id}
                  className="bg-stone-50 border border-stone-200 rounded-2xl p-4 shadow-xs hover:border-emerald-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Metadata & Attribution */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-stone-900">
                        {order.orderNumber?.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`}
                      </span>

                      {/* Destination Badge */}
                      {isTakeaway ? (
                        <Badge variant="purple">
                          <ShoppingBag className="w-3 h-3" />
                          TAKEAWAY ({order.customerName || 'Pickup'})
                        </Badge>
                      ) : (
                        <Badge variant="info">
                          <Utensils className="w-3 h-3" />
                          Table {order.table?.tableNumber || 'Counter'}
                        </Badge>
                      )}

                      {/* Kitchen Preparation Status */}
                      <Badge
                        variant={
                          order.status === 'READY'
                            ? 'success'
                            : order.status === 'IN_PREPARATION'
                            ? 'info'
                            : order.status === 'CONFIRMED'
                            ? 'amber'
                            : 'default'
                        }
                      >
                        {order.status}
                      </Badge>

                      {/* Payment Status */}
                      <Badge variant={isPaid ? 'success' : 'destructive'}>
                        {isPaid ? 'PAID' : 'UNPAID'}
                      </Badge>
                    </div>

                    {/* Attribution Line */}
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 flex-wrap">
                      <div className="flex items-center gap-1 font-semibold text-stone-700">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cashier:</span>
                        <span className="font-bold text-emerald-700">
                          {order.cashier?.name || 'Assigned Station'}
                        </span>
                      </div>

                      {order.waiter && (
                        <div className="flex items-center gap-1 text-stone-700">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Server:</span>
                          <span className="font-semibold">{order.waiter.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-stone-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Items Summary Line */}
                    <div className="text-xs text-stone-600 font-medium truncate pt-1">
                      {order.items?.map((itm: any) => `${itm.quantity}x ${itm.menuItem?.name || itm.name}`).join(', ')}
                    </div>
                  </div>

                  {/* Right: Financial Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-200">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-stone-500 font-bold uppercase">Total Bill (15% VAT)</div>
                      <div className="text-base font-black text-emerald-700">
                        {Number(order.totalAmount).toFixed(2)} ETB
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Add Items Button */}
                      {!isPaid && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            onAppendItems(order);
                            onClose();
                          }}
                          title="Add more items to this order"
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
                          onPrintReceipt(order);
                        }}
                        title="Print receipt or guest check"
                      >
                        <Printer className="w-3.5 h-3.5 text-stone-600" />
                      </Button>

                      {/* Settle Bill Button */}
                      {!isPaid && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            onSettleOrder(order);
                            onClose();
                          }}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Settle Bill</span>
                        </Button>
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
