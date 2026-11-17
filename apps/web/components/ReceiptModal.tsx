'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function ReceiptModal({ isOpen, onClose, order }: ReceiptModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const subtotal = Number(order.subtotal || 0);
  const tip = Number(order.tip || 0);
  const tax = Number(order.tax || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.totalAmount || 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161311] text-stone-900 dark:text-white rounded-[32px] max-w-sm w-full p-5 shadow-2xl relative border border-stone-200 dark:border-white/15">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200 dark:border-white/10 print:hidden">
          <span className="text-xs font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            Customer Receipt
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="icon-sm"
              onClick={handlePrint}
              title="Print Receipt"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={onClose}
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Printable Thermal Slip (Standard 80mm receipt style) */}
        <div id="thermal-receipt" className="font-mono text-xs text-black space-y-3 p-4 bg-white rounded-2xl shadow-inner">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E0D9CB] p-1 flex items-center justify-center shadow-xs">
                <img src="/nitsuh-logo.png" alt="Nitsuh Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="font-black text-sm uppercase tracking-wider text-black">
              NITSUH FOODS & CAFE
            </div>
            <div className="text-[10px] text-gray-700">
              Addis Ababa, Ethiopia • Inquiries: 0966833177
            </div>
            <div className="text-[10px] text-gray-600 font-semibold italic">
              &ldquo;From Savour Bites to Sweet Delights – We Cater It All!&rdquo;
            </div>
            <div className="text-[10px] font-bold border-t border-b border-dashed border-gray-400 py-1 mt-2">
              ERCA OFFICIAL CASH RECEIPT / TAX INVOICE
            </div>
          </div>

          {/* Metadata */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between">
              <span>Order #:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Order Type:</span>
              <span className="font-bold">
                {order.orderType === 'TAKEAWAY'
                  ? '🛍️ TAKEAWAY (Package)'
                  : `🍽️ DINE-IN (${order.table?.tableNumber || 'Table Assigned'})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customerName || 'Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{new Date(order.createdAt || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="font-bold text-gray-800">{order.cashier?.name || 'Cashier Station'}</span>
            </div>
            {order.waiter?.name && (
              <div className="flex justify-between">
                <span>Waiter / Server:</span>
                <span className="font-bold text-gray-800">{order.waiter.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-bold uppercase text-emerald-800">
                {order.paymentMethod || 'CASH'} (PAID)
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-gray-300">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/3 text-right">Price</span>
            </div>
            {order.items?.map((item: any, idx: number) => {
              const name = item.menuItem?.name || item.name || 'Item';
              const price = Number(item.unitPrice || item.price || 0);
              const qty = item.quantity || 1;
              const lineTotal = Number(item.subtotal || price * qty);

              return (
                <div key={idx} className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="w-1/2 truncate font-bold">{name}</span>
                    <span className="w-1/6 text-center font-bold">{qty}</span>
                    <span className="w-1/3 text-right">{lineTotal.toFixed(2)}</span>
                  </div>
                  {item.specialInstructions && (
                    <div className="text-[10px] text-gray-600 italic pl-2">
                      &bull; {item.specialInstructions}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals Calculation */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between">
              <span>Base Subtotal:</span>
              <span>{subtotal.toFixed(2)} ETB</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-bold text-red-600">
                <span>Promotional Discount:</span>
                <span>-{discount.toFixed(2)} ETB</span>
              </div>
            )}
            {tip > 0 && (
              <div className="flex justify-between font-bold">
                <span>Staff Tip / Gratuity:</span>
                <span>+{tip.toFixed(2)} ETB</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>VAT (15% Included):</span>
              <span>{tax.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-gray-400">
              <span>TOTAL DUE:</span>
              <span>{total.toFixed(2)} ETB</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 border-t border-dashed border-gray-400 text-[10px] text-gray-600 space-y-1">
            <p className="font-bold">Thank you for dining with Nitsuh Foods!</p>
            <p>Please retain this receipt for your records.</p>
            <p className="text-[9px] text-gray-400 font-sans mt-2">
              System powered by Nitsuh POS &bull; www.nitsuh.et
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2 print:hidden">
          <Button
            variant="primary"
            className="flex-1"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
