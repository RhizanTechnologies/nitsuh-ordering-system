import { PrismaService } from '../prisma.service';
import { LocationType } from '@cafe/shared-types';
import { EventsGateway } from '../events/events.gateway';
import { Prisma } from '@prisma/client';
export declare class InventoryService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getStockBalances(locationType?: LocationType): Promise<({
        balances: ({
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: Prisma.Decimal;
                };
            } & {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
            locationId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.LocationType;
    })[]>;
    getLowStockAlerts(locationType?: LocationType): Promise<({
        ingredient: {
            baseUnit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: Prisma.Decimal;
            reorderThresholdMain: Prisma.Decimal;
            reorderThresholdKitchen: Prisma.Decimal;
        };
        location: {
            id: string;
            name: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.LocationType;
        };
    } & {
        id: string;
        ingredientId: string;
        quantity: Prisma.Decimal;
        reservedQuantity: Prisma.Decimal;
        lastUpdatedAt: Date;
        locationId: string;
    })[]>;
    requestTransfer(requestedById: string, items: {
        ingredientId: string;
        requestedQty: number;
        unitId: string;
    }[], notes?: string): Promise<{
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
            ingredient: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            transferId: string;
        })[];
        requestedBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransferStatus;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    }>;
    dispatchTransfer(transferId: string, approvedById: string, dispatchedItems: {
        itemId: string;
        dispatchedQty: number;
    }[]): Promise<{
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
            ingredient: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            transferId: string;
        })[];
        requestedBy: {
            id: string;
            name: string;
        };
        approvedBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransferStatus;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    }>;
    receiveTransfer(transferId: string, receivedById?: string, receivedItems?: {
        itemId?: string;
        ingredientId?: string;
        receivedQty: number;
    }[]): Promise<{
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
            ingredient: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            transferId: string;
        })[];
        requestedBy: {
            id: string;
            name: string;
        };
        approvedBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransferStatus;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    }>;
    rejectTransfer(transferId: string, rejectedById?: string, reason?: string): Promise<{
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
            ingredient: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            transferId: string;
        })[];
        requestedBy: {
            id: string;
            name: string;
        };
        approvedBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransferStatus;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    }>;
    dispatchDirectBatch(senderId: string, items: {
        ingredientId: string;
        quantity: number;
    }[], notes?: string): Promise<{
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: Prisma.Decimal;
                };
            } & {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            transferId: string;
        })[];
        sourceLocation: {
            id: string;
            name: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.LocationType;
        };
        destLocation: {
            id: string;
            name: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.LocationType;
        };
        requestedBy: {
            id: string;
            name: string;
        };
        approvedBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransferStatus;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    }>;
    updateIngredientThresholds(ingredientId: string, thresholds: {
        reorderThresholdMain?: number;
        reorderThresholdKitchen?: number;
    }): Promise<{
        baseUnit: {
            symbol: string;
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.UnitType;
            baseMultiplier: Prisma.Decimal;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        sku: string;
        baseUnitId: string;
        currentCostPerBaseUnit: Prisma.Decimal;
        reorderThresholdMain: Prisma.Decimal;
        reorderThresholdKitchen: Prisma.Decimal;
    }>;
    recordWastage(userId: string, ingredientId: string, quantity: number, reason: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        reason: string | null;
        ingredientId: string;
        quantity: Prisma.Decimal;
        transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        referenceId: string | null;
        sourceLocationId: string | null;
        destLocationId: string | null;
    }>;
    getTransfers(): Promise<({
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: Prisma.Decimal;
                };
            } & {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            transferId: string;
        })[];
        requestedBy: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        approvedBy: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransferStatus;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    })[]>;
    getLedger(limit?: number, page?: number, type?: string, search?: string): Promise<{
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            reason: string | null;
            ingredientId: string;
            quantity: Prisma.Decimal;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            unitCost: Prisma.Decimal;
            totalCost: Prisma.Decimal;
            referenceId: string | null;
            sourceLocationId: string | null;
            destLocationId: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getSuppliers(): Promise<({
        _count: {
            purchases: number;
        };
    } & {
        id: string;
        name: string;
        email: string | null;
        createdAt: Date;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    })[]>;
    createSupplier(data: {
        name: string;
        contactPerson?: string;
        phone?: string;
        email?: string;
        address?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string | null;
        createdAt: Date;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
    recordPurchaseReceipt(data: {
        supplierId: string;
        invoiceNumber?: string;
        createdById: string;
        notes?: string;
        items: {
            ingredientId: string;
            quantity: number;
            totalCost: number;
            unitId: string;
        }[];
    }): Promise<{
        supplier: {
            id: string;
            name: string;
            email: string | null;
            createdAt: Date;
            address: string | null;
            phone: string | null;
            contactPerson: string | null;
        };
        items: ({
            ingredient: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            unitId: string;
            unitCost: Prisma.Decimal;
            totalCost: Prisma.Decimal;
            purchaseOrderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PurchaseStatus;
        totalAmount: Prisma.Decimal;
        notes: string | null;
        locationId: string;
        receivedAt: Date;
        poNumber: string;
        invoiceNumber: string | null;
        createdById: string;
        supplierId: string;
    }>;
    updateRecipe(menuItemId: string, yieldPortions: number, ingredientsList: {
        ingredientId: string;
        quantity: number;
        unitId: string;
    }[]): Promise<{
        menuItem: {
            description: string | null;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            price: Prisma.Decimal;
            isDirectSale: boolean;
            directIngredientId: string | null;
            prepSection: string;
            imageUrl: string | null;
            isAvailable: boolean;
        };
        ingredients: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: Prisma.Decimal;
                };
            } & {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            unitId: string;
            recipeId: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string;
        yieldPortions: Prisma.Decimal;
        prepInstructions: string | null;
        version: number;
    }>;
    adjustStock(userId: string, locationType: LocationType, ingredientId: string, deltaQuantity: number, reason: string): Promise<{
        balance: {
            id: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
            locationId: string;
        };
        transaction: {
            id: string;
            createdAt: Date;
            userId: string;
            reason: string | null;
            ingredientId: string;
            quantity: Prisma.Decimal;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            unitCost: Prisma.Decimal;
            totalCost: Prisma.Decimal;
            referenceId: string | null;
            sourceLocationId: string | null;
            destLocationId: string | null;
        };
    }>;
    directDispatchTransfer(sentById: string, items: {
        ingredientId: string;
        quantity: number;
    }[], notes?: string): Promise<{
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: Prisma.Decimal;
                };
            } & {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            transferId: string;
        })[];
        requestedBy: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        approvedBy: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransferStatus;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    }>;
    getIngredients(): Promise<({
        baseUnit: {
            symbol: string;
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.UnitType;
            baseMultiplier: Prisma.Decimal;
        };
        balances: ({
            location: {
                id: string;
                name: string;
                createdAt: Date;
                type: import("@prisma/client").$Enums.LocationType;
            };
        } & {
            id: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
            locationId: string;
        })[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        sku: string;
        baseUnitId: string;
        currentCostPerBaseUnit: Prisma.Decimal;
        reorderThresholdMain: Prisma.Decimal;
        reorderThresholdKitchen: Prisma.Decimal;
    })[]>;
    getUnits(): Promise<{
        symbol: string;
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.UnitType;
        baseMultiplier: Prisma.Decimal;
    }[]>;
    createIngredient(data: {
        name: string;
        sku?: string;
        category?: string;
        baseUnitId: string;
        currentCostPerBaseUnit: number;
        reorderThresholdMain?: number;
        reorderThresholdKitchen?: number;
        initialMainStock?: number;
        initialKitchenStock?: number;
    }): Promise<{
        baseUnit: {
            symbol: string;
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.UnitType;
            baseMultiplier: Prisma.Decimal;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        sku: string;
        baseUnitId: string;
        currentCostPerBaseUnit: Prisma.Decimal;
        reorderThresholdMain: Prisma.Decimal;
        reorderThresholdKitchen: Prisma.Decimal;
    }>;
    updateIngredient(id: string, data: {
        name?: string;
        sku?: string;
        category?: string;
        baseUnitId?: string;
        currentCostPerBaseUnit?: number;
        reorderThresholdMain?: number;
        reorderThresholdKitchen?: number;
        isActive?: boolean;
    }): Promise<{
        baseUnit: {
            symbol: string;
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.UnitType;
            baseMultiplier: Prisma.Decimal;
        };
        balances: ({
            location: {
                id: string;
                name: string;
                createdAt: Date;
                type: import("@prisma/client").$Enums.LocationType;
            };
        } & {
            id: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
            locationId: string;
        })[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        sku: string;
        baseUnitId: string;
        currentCostPerBaseUnit: Prisma.Decimal;
        reorderThresholdMain: Prisma.Decimal;
        reorderThresholdKitchen: Prisma.Decimal;
    }>;
    deleteIngredient(id: string): Promise<{
        success: boolean;
        message: string;
        item: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: Prisma.Decimal;
            reorderThresholdMain: Prisma.Decimal;
            reorderThresholdKitchen: Prisma.Decimal;
        };
    }>;
}
