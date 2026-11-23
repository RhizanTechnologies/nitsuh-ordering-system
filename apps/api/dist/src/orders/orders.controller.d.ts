import { OrdersService } from './orders.service';
import { OrderStatus, OrderType, PaymentMethod } from '@cafe/shared-types';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    getOrders(statuses?: string, tableId?: string, waiterId?: string, limit?: string): Promise<({
        table: {
            id: string;
            tableNumber: string;
            capacity: number;
            status: import("@prisma/client").$Enums.TableStatus;
        };
        waiter: {
            id: string;
            name: string;
        };
        cashier: {
            id: string;
            name: string;
        };
        items: ({
            menuItem: {
                id: string;
                name: string;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            quantity: number;
            menuItemId: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            orderId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionRef: string | null;
            cashierShiftId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        waiterId: string | null;
        cashierId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    })[]>;
    getWaiterSlips(): Promise<({
        table: {
            id: string;
            tableNumber: string;
            capacity: number;
            status: import("@prisma/client").$Enums.TableStatus;
        };
        waiter: {
            id: string;
            name: string;
            avatarUrl: string;
        };
        items: ({
            menuItem: {
                id: string;
                name: string;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            quantity: number;
            menuItemId: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        waiterId: string | null;
        cashierId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    })[]>;
    createWaiterDraftNote(body: {
        tableId?: string;
        customerName?: string;
        waiterId: string;
        orderType?: OrderType;
        notes?: string;
        discount?: number;
        discountPercent?: number;
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
            selectedAddonIds?: string[];
            selectedAddons?: any[];
        }[];
    }): Promise<any>;
    updateWaiterDraftNotePut(id: string, body: {
        waiterId?: string;
        tableId?: string;
        customerName?: string;
        notes?: string;
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
            selectedAddonIds?: string[];
            selectedAddons?: any[];
        }[];
    }): Promise<any>;
    updateWaiterDraftNotePatch(id: string, body: {
        waiterId?: string;
        tableId?: string;
        customerName?: string;
        notes?: string;
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
            selectedAddonIds?: string[];
            selectedAddons?: any[];
        }[];
    }): Promise<any>;
    createPosOrder(body: {
        cashierId: string;
        tableId?: string;
        customerName?: string;
        waiterId?: string;
        orderType: OrderType;
        discount?: number;
        discountPercent?: number;
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
        }[];
    }): Promise<any>;
    confirmOrder(id: string, body: {
        cashierId: string;
    }): Promise<{
        table: {
            id: string;
            tableNumber: string;
            capacity: number;
            status: import("@prisma/client").$Enums.TableStatus;
        };
        waiter: {
            id: string;
            name: string;
        };
        cashier: {
            id: string;
            name: string;
        };
        items: ({
            menuItem: {
                id: string;
                name: string;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            quantity: number;
            menuItemId: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        waiterId: string | null;
        cashierId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    }>;
    updateAndConfirmOrderPut(id: string, body: {
        cashierId: string;
        tableId?: string;
        customerName?: string;
        orderType?: OrderType;
        discount?: number;
        discountPercent?: number;
        items: {
            menuItemId: string;
            quantity: number;
            tip?: number;
            specialInstructions?: string;
            selectedAddonIds?: string[];
            selectedAddons?: any[];
        }[];
    }): Promise<{
        table: {
            id: string;
            tableNumber: string;
            capacity: number;
            status: import("@prisma/client").$Enums.TableStatus;
        };
        waiter: {
            id: string;
            name: string;
        };
        cashier: {
            id: string;
            name: string;
        };
        items: ({
            menuItem: {
                id: string;
                name: string;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            quantity: number;
            menuItemId: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        waiterId: string | null;
        cashierId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    }>;
    updateAndConfirmOrderPost(id: string, body: {
        cashierId: string;
        tableId?: string;
        customerName?: string;
        orderType?: OrderType;
        discount?: number;
        discountPercent?: number;
        items: {
            menuItemId: string;
            quantity: number;
            tip?: number;
            specialInstructions?: string;
            selectedAddonIds?: string[];
            selectedAddons?: any[];
        }[];
    }): Promise<{
        table: {
            id: string;
            tableNumber: string;
            capacity: number;
            status: import("@prisma/client").$Enums.TableStatus;
        };
        waiter: {
            id: string;
            name: string;
        };
        cashier: {
            id: string;
            name: string;
        };
        items: ({
            menuItem: {
                id: string;
                name: string;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            quantity: number;
            menuItemId: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        waiterId: string | null;
        cashierId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    }>;
    appendItems(id: string, body: {
        cashierId?: string;
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
        }[];
    }): Promise<any>;
    updateStatus(id: string, body: {
        status: OrderStatus;
        actorUserId?: string;
    }): Promise<{
        table: {
            id: string;
            tableNumber: string;
            capacity: number;
            status: import("@prisma/client").$Enums.TableStatus;
        };
        waiter: {
            id: string;
            name: string;
        };
        cashier: {
            id: string;
            name: string;
        };
        items: ({
            menuItem: {
                id: string;
                name: string;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            quantity: number;
            menuItemId: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        waiterId: string | null;
        cashierId: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    }>;
    recordPayment(id: string, body: {
        amount: number;
        paymentMethod: PaymentMethod;
        transactionRef?: string;
    }): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            orderId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionRef: string | null;
            cashierShiftId: string | null;
        };
        order: {
            table: {
                id: string;
                tableNumber: string;
                capacity: number;
                status: import("@prisma/client").$Enums.TableStatus;
            };
            waiter: {
                id: string;
                name: string;
            };
            cashier: {
                id: string;
                name: string;
            };
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    categoryId: string;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    isDirectSale: boolean;
                    directIngredientId: string | null;
                    prepSection: string;
                    imageUrl: string | null;
                    isAvailable: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                quantity: number;
                menuItemId: string;
                status: import("@prisma/client").$Enums.ItemPrepStatus;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                tip: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                specialInstructions: string | null;
                costAtSale: import("@prisma/client/runtime/library").Decimal | null;
                selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
            })[];
            payments: {
                id: string;
                createdAt: Date;
                orderId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                transactionRef: string | null;
                cashierShiftId: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            orderType: import("@prisma/client").$Enums.OrderType;
            tableId: string | null;
            customerName: string | null;
            waiterId: string | null;
            cashierId: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            cancellationReason: string | null;
            notes: string | null;
        };
    }>;
}
