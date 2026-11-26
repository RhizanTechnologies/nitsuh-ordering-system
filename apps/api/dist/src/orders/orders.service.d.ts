import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { OrderStatus, OrderType, PaymentMethod } from '@cafe/shared-types';
import { Prisma } from '@prisma/client';
export declare class OrdersService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    createWaiterDraftNote(data: {
        tableId?: string;
        customerName?: string;
        waiterId?: string;
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
    updateWaiterDraftNote(orderId: string, data: {
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
    confirmOrder(orderId: string, cashierId: string): Promise<{
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
                description: string | null;
                isDirectSale: boolean;
                categoryId: string;
                price: Prisma.Decimal;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            quantity: number;
            menuItemId: string;
            subtotal: Prisma.Decimal;
            tip: Prisma.Decimal;
            orderId: string;
            unitPrice: Prisma.Decimal;
            specialInstructions: string | null;
            costAtSale: Prisma.Decimal | null;
            selectedAddons: Prisma.JsonValue | null;
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
        subtotal: Prisma.Decimal;
        tip: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    }>;
    updateAndConfirmDraftNote(orderId: string, data: {
        cashierId: string;
        tableId?: string | null;
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
                description: string | null;
                isDirectSale: boolean;
                categoryId: string;
                price: Prisma.Decimal;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            quantity: number;
            menuItemId: string;
            subtotal: Prisma.Decimal;
            tip: Prisma.Decimal;
            orderId: string;
            unitPrice: Prisma.Decimal;
            specialInstructions: string | null;
            costAtSale: Prisma.Decimal | null;
            selectedAddons: Prisma.JsonValue | null;
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
        subtotal: Prisma.Decimal;
        tip: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    }>;
    createPosOrder(data: {
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
    updateOrderStatus(orderId: string, status: OrderStatus, actorUserId?: string): Promise<{
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
                description: string | null;
                isDirectSale: boolean;
                categoryId: string;
                price: Prisma.Decimal;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            quantity: number;
            menuItemId: string;
            subtotal: Prisma.Decimal;
            tip: Prisma.Decimal;
            orderId: string;
            unitPrice: Prisma.Decimal;
            specialInstructions: string | null;
            costAtSale: Prisma.Decimal | null;
            selectedAddons: Prisma.JsonValue | null;
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
        subtotal: Prisma.Decimal;
        tip: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    }>;
    recordPayment(orderId: string, data: {
        amount: number;
        paymentMethod: PaymentMethod;
        transactionRef?: string;
    }): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            orderId: string;
            amount: Prisma.Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionRef: string | null;
            cashierShiftId: string | null;
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
                    description: string | null;
                    isDirectSale: boolean;
                    categoryId: string;
                    price: Prisma.Decimal;
                    directIngredientId: string | null;
                    prepSection: string;
                    imageUrl: string | null;
                    isAvailable: boolean;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.ItemPrepStatus;
                quantity: number;
                menuItemId: string;
                subtotal: Prisma.Decimal;
                tip: Prisma.Decimal;
                orderId: string;
                unitPrice: Prisma.Decimal;
                specialInstructions: string | null;
                costAtSale: Prisma.Decimal | null;
                selectedAddons: Prisma.JsonValue | null;
            })[];
            payments: {
                id: string;
                createdAt: Date;
                orderId: string;
                amount: Prisma.Decimal;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                transactionRef: string | null;
                cashierShiftId: string | null;
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
            subtotal: Prisma.Decimal;
            tip: Prisma.Decimal;
            tax: Prisma.Decimal;
            discount: Prisma.Decimal;
            totalAmount: Prisma.Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
            cancellationReason: string | null;
            notes: string | null;
        };
    }>;
    appendItemsToOrder(orderId: string, data: {
        cashierId?: string;
        notes?: string;
        items: {
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
            selectedAddonIds?: string[];
            selectedAddons?: any[];
        }[];
    }): Promise<any>;
    getOrders(params?: {
        statuses?: OrderStatus[];
        tableId?: string;
        waiterId?: string;
        limit?: number;
    }): Promise<({
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
                description: string | null;
                isDirectSale: boolean;
                categoryId: string;
                price: Prisma.Decimal;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            quantity: number;
            menuItemId: string;
            subtotal: Prisma.Decimal;
            tip: Prisma.Decimal;
            orderId: string;
            unitPrice: Prisma.Decimal;
            specialInstructions: string | null;
            costAtSale: Prisma.Decimal | null;
            selectedAddons: Prisma.JsonValue | null;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            orderId: string;
            amount: Prisma.Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            transactionRef: string | null;
            cashierShiftId: string | null;
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
        subtotal: Prisma.Decimal;
        tip: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    })[]>;
    getWaiterDraftSlips(): Promise<({
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
                description: string | null;
                isDirectSale: boolean;
                categoryId: string;
                price: Prisma.Decimal;
                directIngredientId: string | null;
                prepSection: string;
                imageUrl: string | null;
                isAvailable: boolean;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.ItemPrepStatus;
            quantity: number;
            menuItemId: string;
            subtotal: Prisma.Decimal;
            tip: Prisma.Decimal;
            orderId: string;
            unitPrice: Prisma.Decimal;
            specialInstructions: string | null;
            costAtSale: Prisma.Decimal | null;
            selectedAddons: Prisma.JsonValue | null;
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
        subtotal: Prisma.Decimal;
        tip: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        cancellationReason: string | null;
        notes: string | null;
    })[]>;
}
