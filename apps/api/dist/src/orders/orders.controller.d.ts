import { OrdersService } from './orders.service';
import { OrderStatus, OrderType, PaymentMethod } from '@cafe/shared-types';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    getOrders(statuses?: string, tableId?: string, waiterId?: string): Promise<({
        table: {
            id: string;
            status: import("@prisma/client").$Enums.TableStatus;
            tableNumber: string;
            capacity: number;
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
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
            menuItemId: string;
            orderId: string;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            orderId: string;
            cashierShiftId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionRef: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        cashierId: string;
        waiterId: string | null;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
    })[]>;
    getWaiterSlips(): Promise<({
        table: {
            id: string;
            status: import("@prisma/client").$Enums.TableStatus;
            tableNumber: string;
            capacity: number;
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
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
            menuItemId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        cashierId: string;
        waiterId: string | null;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
    })[]>;
    createWaiterDraftNote(body: {
        tableId?: string;
        customerName?: string;
        waiterId: string;
        orderType?: OrderType;
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
        }[];
    }): Promise<{
        table: {
            id: string;
            status: import("@prisma/client").$Enums.TableStatus;
            tableNumber: string;
            capacity: number;
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
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
            menuItemId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        cashierId: string;
        waiterId: string | null;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
    }>;
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
    }): Promise<{
        table: {
            id: string;
            status: import("@prisma/client").$Enums.TableStatus;
            tableNumber: string;
            capacity: number;
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
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
            menuItemId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        cashierId: string;
        waiterId: string | null;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
    }>;
    confirmOrder(id: string, body: {
        cashierId: string;
    }): Promise<{
        table: {
            id: string;
            status: import("@prisma/client").$Enums.TableStatus;
            tableNumber: string;
            capacity: number;
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
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
            menuItemId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        cashierId: string;
        waiterId: string | null;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
    }>;
    appendItems(id: string, body: {
        cashierId?: string;
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
        }[];
    }): Promise<{
        table: {
            id: string;
            status: import("@prisma/client").$Enums.TableStatus;
            tableNumber: string;
            capacity: number;
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
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
            menuItemId: string;
            orderId: string;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            orderId: string;
            cashierShiftId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionRef: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        cashierId: string;
        waiterId: string | null;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
    }>;
    updateStatus(id: string, body: {
        status: OrderStatus;
        actorUserId?: string;
    }): Promise<{
        table: {
            id: string;
            status: import("@prisma/client").$Enums.TableStatus;
            tableNumber: string;
            capacity: number;
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
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                isDirectSale: boolean;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            specialInstructions: string | null;
            costAtSale: import("@prisma/client/runtime/library").Decimal | null;
            selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
            menuItemId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        cashierId: string;
        waiterId: string | null;
        orderNumber: string;
        orderType: import("@prisma/client").$Enums.OrderType;
        tableId: string | null;
        customerName: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        tip: import("@prisma/client/runtime/library").Decimal;
        tax: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
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
            cashierShiftId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionRef: string | null;
        };
        order: {
            table: {
                id: string;
                status: import("@prisma/client").$Enums.TableStatus;
                tableNumber: string;
                capacity: number;
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
                    createdAt: Date;
                    updatedAt: Date;
                    categoryId: string;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    isDirectSale: boolean;
                    directIngredientId: string | null;
                    prepSection: string;
                    imageUrl: string | null;
                    isAvailable: boolean;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.ItemPrepStatus;
                subtotal: import("@prisma/client/runtime/library").Decimal;
                tip: import("@prisma/client/runtime/library").Decimal;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                specialInstructions: string | null;
                costAtSale: import("@prisma/client/runtime/library").Decimal | null;
                selectedAddons: import("@prisma/client/runtime/library").JsonValue | null;
                menuItemId: string;
                orderId: string;
            })[];
            payments: {
                id: string;
                createdAt: Date;
                orderId: string;
                cashierShiftId: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                transactionRef: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.OrderStatus;
            cashierId: string;
            waiterId: string | null;
            orderNumber: string;
            orderType: import("@prisma/client").$Enums.OrderType;
            tableId: string | null;
            customerName: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            tip: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            cancellationReason: string | null;
        };
    }>;
}
