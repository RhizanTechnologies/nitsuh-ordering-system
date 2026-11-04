'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#161311] text-white rounded-[32px] max-w-sm w-full p-5 shadow-2xl relative border border-white/15">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 print:hidden">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Customer Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl hover:brightness-110 transition shadow-md cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/[0.08] text-zinc-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
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
                <span>Server:</span>
                <span className="font-semibold text-gray-700">{order.waiter.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1.5 border-b border-dashed border-gray-400 pb-2 text-[11px]">
            <div className="grid grid-cols-12 font-bold pb-1 text-gray-700">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-4 text-right">Amount</span>
            </div>

            {order.items?.map((item: any) => (
              <div key={item.id} className="grid grid-cols-12">
                <div className="col-span-6 truncate">
                  <div>{item.menuItem?.name || item.name}</div>
                  {Number(item.tip || 0) > 0 && (
                    <div className="text-[9px] text-amber-900 font-bold">
                      +Tip: {Number(item.tip).toFixed(2)} ETB
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className="text-[9px] text-gray-600 italic">
                      *{item.specialInstructions}
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-center">{item.quantity}</div>
                <div className="col-span-4 text-right font-semibold">
                  {((Number(item.unitPrice || item.price) + Number(item.tip || 0)) * item.quantity).toFixed(2)} ETB
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Base Subtotal:</span>
              <span>{subtotal.toFixed(2)} ETB</span>
            </div>
            {tip > 0 && (
              <div className="flex justify-between font-bold text-black">
                <span>Staff Tip (Gratuity):</span>
                <span>+{tip.toFixed(2)} ETB</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-[#C11221] font-bold">
                <span>Discount:</span>
                <span>-{discount.toFixed(2)} ETB</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (15% VAT):</span>
              <span>{tax.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between text-sm font-black border-t border-b border-black py-1 my-1">
              <span>TOTAL DUE:</span>
              <span>{total.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>Payment Tender:</span>
              <span className="font-bold uppercase text-[#C11221]">
                {order.payments?.[0]?.paymentMethod ? `${order.payments[0].paymentMethod.replace('_', ' ')} (PAID)` : 'PAID'}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[10px] text-gray-600 space-y-1">
            <div>WiFi: NitsuhCafe_Guest</div>
            <div className="italic font-medium">Thank you for visiting Nitsuh Foods! Please come again.</div>
            <div className="tracking-widest text-xs pt-1 font-bold text-gray-400">
              * * * * * * * * * * *
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-4 pt-3 border-t border-white/10 flex gap-2 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
