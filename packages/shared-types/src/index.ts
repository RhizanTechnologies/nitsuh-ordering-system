export const UserRole = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  WAITER: 'WAITER',
  KITCHEN_STAFF: 'KITCHEN_STAFF',
  MAIN_STOREKEEPER: 'MAIN_STOREKEEPER',
  KITCHEN_STOREKEEPER: 'KITCHEN_STOREKEEPER',
  HEAD_CHEF: 'HEAD_CHEF',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrderType = {
  DINE_IN: 'DINE_IN',
  TAKEAWAY: 'TAKEAWAY',
  DELIVERY: 'DELIVERY',
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const OrderStatus = {
  DRAFT_NOTE: 'DRAFT_NOTE', // Waiter digital slip waiting for cashier confirmation
  CONFIRMED: 'CONFIRMED',   // Confirmed by cashier, fired to kitchen
  IN_PREPARATION: 'IN_PREPARATION', // Kitchen started cooking
  READY: 'READY',           // Food/drinks ready for pickup/serving
  SERVED: 'SERVED',         // Delivered to table
  COMPLETED: 'COMPLETED',   // Paid and closed
  CANCELLED: 'CANCELLED',    // Cancelled with documented reason
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ItemPrepStatus = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED',
} as const;
export type ItemPrepStatus = (typeof ItemPrepStatus)[keyof typeof ItemPrepStatus];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  MOBILE_PAY: 'MOBILE_PAY',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const LocationType = {
  MAIN_STORE: 'MAIN_STORE',
  KITCHEN_STORE: 'KITCHEN_STORE',
} as const;
export type LocationType = (typeof LocationType)[keyof typeof LocationType];

export const InventoryTransactionType = {
  PURCHASE_RECEIPT: 'PURCHASE_RECEIPT',       // Supplier -> Main Store
  TRANSFER_DISPATCH: 'TRANSFER_DISPATCH',     // Main Store -> In-Transit
  TRANSFER_RECEIVE: 'TRANSFER_RECEIVE',       // In-Transit -> Kitchen Store
  TRANSFER_REJECT: 'TRANSFER_REJECT',         // Reversal back to Main Store
  PRODUCTION_CONSUMPTION: 'PRODUCTION_CONSUMPTION', // Kitchen Store -> Prepared Dish
  DIRECT_SALE_DEDUCT: 'DIRECT_SALE_DEDUCT',   // Kitchen/Bar Store -> Sold bottled item
  WASTAGE: 'WASTAGE',                         // Spoilage, burns, spills
  ADJUSTMENT: 'ADJUSTMENT',                    // Audit recount variance (+/-)
} as const;
export type InventoryTransactionType = (typeof InventoryTransactionType)[keyof typeof InventoryTransactionType];

export const TransferStatus = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  DISPATCHED: 'DISPATCHED',
  RECEIVED: 'RECEIVED',
  REJECTED: 'REJECTED',
} as const;
export type TransferStatus = (typeof TransferStatus)[keyof typeof TransferStatus];

export const UnitType = {
  MASS: 'MASS',     // Base: grams (g)
  VOLUME: 'VOLUME', // Base: milliliters (ml)
  COUNT: 'COUNT',    // Base: pieces (pcs)
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

// Socket.IO event dictionary
export const SocketEvents = {
  // Waiter -> Cashier
  WAITER_NEW_ORDER_NOTE: 'waiter:new_order_note',
  WAITER_ORDER_UPDATED: 'waiter:order_updated',

  // Cashier -> Kitchen / Waiter
  ORDER_CONFIRMED: 'order:confirmed',
  ORDER_UPDATED: 'order:updated',
  ORDER_CANCELLED: 'order:cancelled',

  // Kitchen -> Waiter / Cashier
  KITCHEN_ITEM_STATUS: 'kitchen:item_status',
  KITCHEN_ORDER_STATUS: 'kitchen:order_status',
  KITCHEN_ORDER_READY: 'kitchen:order_ready',

  // Inventory & Alerts
  STOCK_LOW_ALERT: 'stock:low_alert',
  STOCK_TRANSFER_UPDATED: 'stock:transfer_updated',
} as const;
