"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = exports.UnitType = exports.TransferStatus = exports.InventoryTransactionType = exports.LocationType = exports.PaymentMethod = exports.PaymentStatus = exports.ItemPrepStatus = exports.OrderStatus = exports.OrderType = exports.UserRole = void 0;

exports.UserRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  WAITER: 'WAITER',
  KITCHEN_STAFF: 'KITCHEN_STAFF',
  MAIN_STOREKEEPER: 'MAIN_STOREKEEPER',
  KITCHEN_STOREKEEPER: 'KITCHEN_STOREKEEPER',
  HEAD_CHEF: 'HEAD_CHEF',
};

exports.OrderType = {
  DINE_IN: 'DINE_IN',
  TAKEAWAY: 'TAKEAWAY',
  DELIVERY: 'DELIVERY',
};

exports.OrderStatus = {
  DRAFT_NOTE: 'DRAFT_NOTE',
  CONFIRMED: 'CONFIRMED',
  IN_PREPARATION: 'IN_PREPARATION',
  READY: 'READY',
  SERVED: 'SERVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

exports.ItemPrepStatus = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED',
};

exports.PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
};

exports.PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  MOBILE_PAY: 'MOBILE_PAY',
  BANK_TRANSFER: 'BANK_TRANSFER',
};

exports.LocationType = {
  MAIN_STORE: 'MAIN_STORE',
  KITCHEN_STORE: 'KITCHEN_STORE',
};

exports.InventoryTransactionType = {
  PURCHASE_RECEIPT: 'PURCHASE_RECEIPT',
  TRANSFER_DISPATCH: 'TRANSFER_DISPATCH',
  TRANSFER_RECEIVE: 'TRANSFER_RECEIVE',
  TRANSFER_REJECT: 'TRANSFER_REJECT',
  PRODUCTION_CONSUMPTION: 'PRODUCTION_CONSUMPTION',
  DIRECT_SALE_DEDUCT: 'DIRECT_SALE_DEDUCT',
  WASTAGE: 'WASTAGE',
  ADJUSTMENT: 'ADJUSTMENT',
};

exports.TransferStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  DISPATCHED: 'DISPATCHED',
  RECEIVED: 'RECEIVED',
  REJECTED: 'REJECTED',
};

exports.UnitType = {
  MASS: 'MASS',
  VOLUME: 'VOLUME',
  COUNT: 'COUNT',
};

exports.SocketEvents = {
  WAITER_NEW_ORDER_NOTE: 'waiter:new_order_note',
  WAITER_ORDER_UPDATED: 'waiter:order_updated',
  ORDER_CONFIRMED: 'order:confirmed',
  ORDER_UPDATED: 'order:updated',
  ORDER_CANCELLED: 'order:cancelled',
  KITCHEN_ITEM_STATUS: 'kitchen:item_status',
  KITCHEN_ORDER_STATUS: 'kitchen:order_status',
  KITCHEN_ORDER_READY: 'kitchen:order_ready',
  STOCK_LOW_ALERT: 'stock:low_alert',
  STOCK_TRANSFER_UPDATED: 'stock:transfer_updated',
};
