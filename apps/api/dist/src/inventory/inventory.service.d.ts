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
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
        } & {
            id: string;
            locationId: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
        })[];
    } & {
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.LocationType;
        createdAt: Date;
    })[]>;
    getLowStockAlerts(locationType?: LocationType): Promise<({
        location: {
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.LocationType;
            createdAt: Date;
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
            createdAt: Date;
            sku: string;
            category: string;
            baseUnitId: string;
            currentCostPerBaseUnit: Prisma.Decimal;
            reorderThresholdMain: Prisma.Decimal;
            reorderThresholdKitchen: Prisma.Decimal;
            isActive: boolean;
            updatedAt: Date;
        };
    } & {
        id: string;
        locationId: string;
        ingredientId: string;
        quantity: Prisma.Decimal;
        reservedQuantity: Prisma.Decimal;
        lastUpdatedAt: Date;
    })[]>;
    requestTransfer(requestedById: string, items: {
        ingredientId: string;
        requestedQty: number;
        unitId: string;
    }[], notes?: string): Promise<{
        requestedBy: {
            id: string;
            name: string;
        };
        items: ({
            ingredient: {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            unitId: string;
            transferId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        requestedById: string;
        approvedById: string | null;
    }>;
    dispatchTransfer(transferId: string, approvedById: string, dispatchedItems: {
        itemId: string;
        dispatchedQty: number;
    }[]): Promise<{
        requestedBy: {
            id: string;
            name: string;
        };
        approvedBy: {
            id: string;
            name: string;
        };
        items: ({
            ingredient: {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            unitId: string;
            transferId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        requestedById: string;
        approvedById: string | null;
    }>;
    receiveTransfer(transferId: string, receivedById?: string, receivedItems?: {
        itemId?: string;
        ingredientId?: string;
        receivedQty: number;
    }[]): Promise<{
        requestedBy: {
            id: string;
            name: string;
        };
        approvedBy: {
            id: string;
            name: string;
        };
        items: ({
            ingredient: {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            unitId: string;
            transferId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        requestedById: string;
        approvedById: string | null;
    }>;
    rejectTransfer(transferId: string, rejectedById?: string, reason?: string): Promise<{
        requestedBy: {
            id: string;
            name: string;
        };
        approvedBy: {
            id: string;
            name: string;
        };
        items: ({
            ingredient: {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            unitId: string;
            transferId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        requestedById: string;
        approvedById: string | null;
    }>;
    dispatchDirectBatch(senderId: string, items: {
        ingredientId: string;
        quantity: number;
    }[], notes?: string): Promise<{
        sourceLocation: {
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.LocationType;
            createdAt: Date;
        };
        destLocation: {
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.LocationType;
            createdAt: Date;
        };
        requestedBy: {
            id: string;
            name: string;
        };
        approvedBy: {
            id: string;
            name: string;
        };
        items: ({
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
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            unitId: string;
            transferId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
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
        createdAt: Date;
        sku: string;
        category: string;
        baseUnitId: string;
        currentCostPerBaseUnit: Prisma.Decimal;
        reorderThresholdMain: Prisma.Decimal;
        reorderThresholdKitchen: Prisma.Decimal;
        isActive: boolean;
        updatedAt: Date;
    }>;
    recordWastage(userId: string, ingredientId: string, quantity: number, reason: string): Promise<{
        id: string;
        createdAt: Date;
        ingredientId: string;
        quantity: Prisma.Decimal;
        sourceLocationId: string | null;
        destLocationId: string | null;
        transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        referenceId: string | null;
        reason: string | null;
        userId: string;
    }>;
    getTransfers(): Promise<({
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
        items: ({
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
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            unitId: string;
            transferId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        requestedById: string;
        approvedById: string | null;
    })[]>;
    getLedger(limit?: number, page?: number, type?: string, search?: string): Promise<{
        data: {
            id: string;
            createdAt: Date;
            ingredientId: string;
            quantity: Prisma.Decimal;
            sourceLocationId: string | null;
            destLocationId: string | null;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            unitCost: Prisma.Decimal;
            totalCost: Prisma.Decimal;
            referenceId: string | null;
            reason: string | null;
            userId: string;
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
        createdAt: Date;
        email: string | null;
        contactPerson: string | null;
        phone: string | null;
        address: string | null;
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
        createdAt: Date;
        email: string | null;
        contactPerson: string | null;
        phone: string | null;
        address: string | null;
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
        items: ({
            ingredient: {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
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
        supplier: {
            id: string;
            name: string;
            createdAt: Date;
            email: string | null;
            contactPerson: string | null;
            phone: string | null;
            address: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        locationId: string;
        status: import("@prisma/client").$Enums.PurchaseStatus;
        receivedAt: Date;
        notes: string | null;
        poNumber: string;
        invoiceNumber: string | null;
        totalAmount: Prisma.Decimal;
        createdById: string;
        supplierId: string;
    }>;
    updateRecipe(menuItemId: string, yieldPortions: number, ingredientsList: {
        ingredientId: string;
        quantity: number;
        unitId: string;
    }[]): Promise<{
        ingredients: ({
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
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            unitId: string;
            recipeId: string;
        })[];
        menuItem: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            description: string | null;
            price: Prisma.Decimal;
            isDirectSale: boolean;
            directIngredientId: string | null;
            prepSection: string;
            imageUrl: string | null;
            isAvailable: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        isActive: boolean;
        updatedAt: Date;
        menuItemId: string;
        yieldPortions: Prisma.Decimal;
        prepInstructions: string | null;
        version: number;
    }>;
    adjustStock(userId: string, locationType: LocationType, ingredientId: string, deltaQuantity: number, reason: string): Promise<{
        balance: {
            id: string;
            locationId: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
        };
        transaction: {
            id: string;
            createdAt: Date;
            ingredientId: string;
            quantity: Prisma.Decimal;
            sourceLocationId: string | null;
            destLocationId: string | null;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            unitCost: Prisma.Decimal;
            totalCost: Prisma.Decimal;
            referenceId: string | null;
            reason: string | null;
            userId: string;
        };
    }>;
    directDispatchTransfer(sentById: string, items: {
        ingredientId: string;
        quantity: number;
    }[], notes?: string): Promise<{
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
        items: ({
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
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: Prisma.Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: Prisma.Decimal;
            dispatchedQty: Prisma.Decimal | null;
            receivedQty: Prisma.Decimal | null;
            unitId: string;
            transferId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        transferNumber: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        notes: string | null;
        sourceLocationId: string;
        destLocationId: string;
        requestedById: string;
        approvedById: string | null;
    }>;
    getIngredients(): Promise<({
        balances: ({
            location: {
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.LocationType;
                createdAt: Date;
            };
        } & {
            id: string;
            locationId: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
        })[];
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
        createdAt: Date;
        sku: string;
        category: string;
        baseUnitId: string;
        currentCostPerBaseUnit: Prisma.Decimal;
        reorderThresholdMain: Prisma.Decimal;
        reorderThresholdKitchen: Prisma.Decimal;
        isActive: boolean;
        updatedAt: Date;
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
        createdAt: Date;
        sku: string;
        category: string;
        baseUnitId: string;
        currentCostPerBaseUnit: Prisma.Decimal;
        reorderThresholdMain: Prisma.Decimal;
        reorderThresholdKitchen: Prisma.Decimal;
        isActive: boolean;
        updatedAt: Date;
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
        balances: ({
            location: {
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.LocationType;
                createdAt: Date;
            };
        } & {
            id: string;
            locationId: string;
            ingredientId: string;
            quantity: Prisma.Decimal;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
        })[];
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
        createdAt: Date;
        sku: string;
        category: string;
        baseUnitId: string;
        currentCostPerBaseUnit: Prisma.Decimal;
        reorderThresholdMain: Prisma.Decimal;
        reorderThresholdKitchen: Prisma.Decimal;
        isActive: boolean;
        updatedAt: Date;
    }>;
    deleteIngredient(id: string): Promise<{
        success: boolean;
        message: string;
        item: {
            id: string;
            name: string;
            createdAt: Date;
            sku: string;
            category: string;
            baseUnitId: string;
            currentCostPerBaseUnit: Prisma.Decimal;
            reorderThresholdMain: Prisma.Decimal;
            reorderThresholdKitchen: Prisma.Decimal;
            isActive: boolean;
            updatedAt: Date;
        };
    }>;
}
