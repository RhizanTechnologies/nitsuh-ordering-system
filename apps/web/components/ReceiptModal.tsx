'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function ReceiptModal({ isOpen, onClose, order }: ReceiptModalProps) {
  const { t, lang } = useTranslation();
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
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white text-stone-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative border border-stone-200">
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200 print:hidden">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            {t('receipt_customer_receipt', 'Customer Receipt')}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="icon-sm"
              onClick={handlePrint}
              title={t('receipt_print', 'Print Receipt')}
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={onClose}
              title={t('receipt_close', 'Close')}
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
              <div className="w-12 h-12 rounded-full border border-stone-200 overflow-hidden flex items-center justify-center shadow-xs">
                <img src="/nitsuh-logo.png" alt="Nitsuh Logo" className="w-full h-full object-cover" />
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
              {t('receipt_official_title', 'ERCA OFFICIAL CASH RECEIPT / TAX INVOICE')}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between">
              <span>{t('receipt_order_no', 'Order #:')}</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'am' ? 'የትዕዛዝ ዓይነት:' : 'Order Type:'}</span>
              <span className="font-bold">
                {order.orderType === 'TAKEAWAY'
                  ? `🛍️ ${t('waiter_takeaway_label', 'TAKEAWAY')}`
                  : `🍽️ ${t('waiter_table_label', 'DINE-IN')} (${order.table?.tableNumber || (lang === 'am' ? 'የተመደበ ጠረጴዛ' : 'Table Assigned')})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'am' ? 'ደንበኛ:' : 'Customer:'}</span>
              <span>{order.customerName || (lang === 'am' ? 'እንግዳ' : 'Guest')}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('receipt_date', 'Date & Time:')}</span>
              <span>{new Date(order.createdAt || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('receipt_cashier', 'Cashier:')}</span>
              <span className="font-bold text-gray-800">{order.cashier?.name || (lang === 'am' ? 'ካሸር' : 'Cashier Station')}</span>
            </div>
            {order.waiter?.name && (
              <div className="flex justify-between">
                <span>{lang === 'am' ? 'አስተናጋጅ:' : 'Waiter / Server:'}</span>
                <span className="font-bold text-gray-800">{order.waiter.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{lang === 'am' ? 'የክፍያ ዘዴ:' : 'Payment Method:'}</span>
              <span className="font-bold uppercase text-emerald-800">
                {order.paymentMethod || 'CASH'} ({lang === 'am' ? 'ተከፍሏል' : 'PAID'})
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-gray-300">
              <span className="w-1/2">{t('receipt_item', 'Item Description')}</span>
              <span className="w-1/6 text-center">{t('receipt_qty', 'Qty')}</span>
              <span className="w-1/3 text-right">{t('receipt_amount', 'Price')}</span>
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
              <span>{t('receipt_subtotal', 'Base Subtotal:')}</span>
              <span>{subtotal.toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-bold text-red-600">
                <span>{t('receipt_discount', 'Promotional Discount:')}</span>
                <span>-{discount.toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'}</span>
              </div>
            )}
            {tip > 0 && (
              <div className="flex justify-between font-bold">
                <span>{t('receipt_tip', 'Staff Tip / Gratuity:')}</span>
                <span>+{tip.toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t('receipt_tax', 'VAT (15% Included):')}</span>
              <span>{tax.toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'}</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-gray-400">
              <span>{t('receipt_total', 'TOTAL DUE:')}</span>
              <span>{total.toFixed(2)} {lang === 'am' ? 'ብር' : 'ETB'}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 border-t border-dashed border-gray-400 text-[10px] text-gray-600 space-y-1">
            <p className="font-bold">{t('receipt_thank_you', 'Thank you for dining with Nitsuh Foods!')}</p>
            <p>{lang === 'am' ? 'እባክዎ ይህን ደረሰኝ ለይዞታዎ ያስቀምጡ።' : 'Please retain this receipt for your records.'}</p>
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
            <span>{t('receipt_print', 'Print Receipt')}</span>
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
