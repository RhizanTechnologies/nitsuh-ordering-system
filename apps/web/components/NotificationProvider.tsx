'use client';

import React, { useEffect } from 'react';
import { getSocket } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  dispatchNotification,
  requestNotificationPermission,
  getNotificationPermission,
} from '@/lib/notifications';
import { NotificationToastContainer } from '@/components/NotificationToastContainer';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppStore();

  useEffect(() => {
    // 1. Register PWA Service Worker if available
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();
    const role = currentUser.role;
    const isKitchen = role === 'KITCHEN_STAFF' || role === 'HEAD_CHEF';
    const isStorekeeper = role === 'MAIN_STOREKEEPER' || role === 'KITCHEN_STOREKEEPER';
    const isWaiter = role === 'WAITER';
    const isCashier = role === 'CASHIER';
    const isOwnerOrManager = role === 'OWNER' || role === 'MANAGER';

    // A. KITCHEN ORDER READY (Alert Waiter & Cashier & Manager/Owner)
    const handleOrderReady = (order: any) => {
      const orderNum = order?.orderNumber ? `#${String(order.orderNumber).replace(/^#+/, '')}` : 'Order';
      const tbl = order?.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway';

      dispatchNotification({
        type: 'ORDER_READY',
        title: `Order Ready for Pickup!`,
        message: `${orderNum} for ${tbl} is marked READY in the kitchen.`,
        url: isWaiter ? '/waiter' : isKitchen ? '/kds' : '/pos',
        orderNumber: orderNum,
        tableNumber: tbl,
      });
    };

    // B. NEW WAITER ORDER NOTE (Alert Cashier & Kitchen & Manager/Owner)
    const handleNewOrderNote = (orderNote: any) => {
      const orderNum = orderNote?.orderNumber ? `#${String(orderNote.orderNumber).replace(/^#+/, '')}` : 'Draft Note';
      const tbl = orderNote?.tableNumber ? `Table ${orderNote.tableNumber}` : 'Dining';

      dispatchNotification({
        type: 'WAITER_NOTE',
        title: `New Waiter Slip Submitted`,
        message: `${orderNum} (${tbl}) received from Waiter. Ready for cashier review.`,
        url: isCashier ? '/pos' : isWaiter ? '/waiter' : '/pos',
        orderNumber: orderNum,
        tableNumber: tbl,
      });
    };

    // C. ORDER CONFIRMED (Alert Kitchen & Waiter)
    const handleOrderConfirmed = (order: any) => {
      const orderNum = order?.orderNumber ? `#${String(order.orderNumber).replace(/^#+/, '')}` : 'Order';
      const tbl = order?.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway';

      // Only notify kitchen if they are on duty, or notify waiter if relevant
      if (isKitchen || isWaiter || isOwnerOrManager) {
        dispatchNotification({
          type: 'ORDER_CREATED',
          title: `Order Confirmed & Sent to Kitchen`,
          message: `${orderNum} (${tbl}) is now queued for culinary preparation.`,
          url: isKitchen ? '/kds' : isWaiter ? '/waiter' : '/pos',
          orderNumber: orderNum,
          tableNumber: tbl,
        });
      }
    };

    // D. ORDER STATUS CHANGED (Preparing, Cancelled, Completed)
    const handleStatusChanged = (order: any) => {
      if (!order?.status) return;
      const orderNum = order?.orderNumber ? `#${String(order.orderNumber).replace(/^#+/, '')}` : 'Order';

      if (order.status === 'PREPARING') {
        if (isWaiter) {
          dispatchNotification({
            type: 'STATUS_UPDATE',
            title: `Order Now Cooking`,
            message: `${orderNum} is now being actively prepared by the kitchen team.`,
            url: '/waiter',
            orderNumber: orderNum,
          });
        }
      } else if (order.status === 'CANCELLED') {
        dispatchNotification({
          type: 'STATUS_UPDATE',
          title: `Order Cancelled`,
          message: `${orderNum} was cancelled.`,
          url: isKitchen ? '/kds' : isWaiter ? '/waiter' : '/pos',
          orderNumber: orderNum,
        });
      }
    };

    // E. STOCK LOW ALERT (Alert Owner, Manager, Inventory Staff)
    const handleStockLowAlert = (alert: any) => {
      const itemName = alert?.itemName || alert?.name || 'Stock item';
      const currentQty = alert?.currentStock ?? alert?.quantity ?? 'Low';
      const unit = alert?.unit || '';

      if (isOwnerOrManager || isStorekeeper || isKitchen) {
        dispatchNotification({
          type: 'STOCK_ALERT',
          title: `Low Stock Warning!`,
          message: `${itemName} has reached critical threshold (${currentQty} ${unit} remaining).`,
          url: '/inventory',
        });
      }
    };

    // F. STOCK TRANSFER DISPATCHED OR RECEIVED
    const handleTransferUpdated = (transfer: any) => {
      if (isOwnerOrManager || isStorekeeper || isKitchen) {
        const status = transfer?.status || 'UPDATED';
        dispatchNotification({
          type: 'TRANSFER_ALERT',
          title: `Inventory Transfer ${status}`,
          message: `Stock transfer #${transfer?.id?.slice(0, 6) || ''} is now marked ${status}.`,
          url: '/inventory',
        });
      }
    };

    socket.on('kitchen:order_ready', handleOrderReady);
    socket.on('waiter:new_order_note', handleNewOrderNote);
    socket.on('order:confirmed', handleOrderConfirmed);
    socket.on('kitchen:order_status', handleStatusChanged);
    socket.on('order:status_changed', handleStatusChanged);
    socket.on('stock:low_alert', handleStockLowAlert);
    socket.on('stock:transfer_updated', handleTransferUpdated);

    return () => {
      socket.off('kitchen:order_ready', handleOrderReady);
      socket.off('waiter:new_order_note', handleNewOrderNote);
      socket.off('order:confirmed', handleOrderConfirmed);
      socket.off('kitchen:order_status', handleStatusChanged);
      socket.off('order:status_changed', handleStatusChanged);
      socket.off('stock:low_alert', handleStockLowAlert);
      socket.off('stock:transfer_updated', handleTransferUpdated);
    };
  }, [currentUser]);

  return (
    <>
      <NotificationToastContainer />
      {children}
    </>
  );
}
