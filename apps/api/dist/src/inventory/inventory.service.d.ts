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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            quantity: Prisma.Decimal;
            ingredientId: string;
            locationId: string;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
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
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            category: string;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: Prisma.Decimal;
            reorderThresholdMain: Prisma.Decimal;
            reorderThresholdKitchen: Prisma.Decimal;
        };
        location: {
            id: string;
            createdAt: Date;
            name: string;
            type: import("@prisma/client").$Enums.LocationType;
        };
    } & {
        id: string;
        quantity: Prisma.Decimal;
        ingredientId: string;
        locationId: string;
        reservedQuantity: Prisma.Decimal;
        lastUpdatedAt: Date;
    })[]>;
    requestTransfer(requestedById: string, items: {
        ingredientId: string;
        requestedQty: number;
        unitId: string;
    }[], notes?: string): Promise<{
        items: ({
            ingredient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
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
        requestedBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TransferStatus;
        createdAt: Date;
        updatedAt: Date;
        sourceLocationId: string;
        destLocationId: string;
        notes: string | null;
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
            ingredient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
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
        status: import("@prisma/client").$Enums.TransferStatus;
        createdAt: Date;
        updatedAt: Date;
        sourceLocationId: string;
        destLocationId: string;
        notes: string | null;
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
            ingredient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
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
        status: import("@prisma/client").$Enums.TransferStatus;
        createdAt: Date;
        updatedAt: Date;
        sourceLocationId: string;
        destLocationId: string;
        notes: string | null;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    }>;
    rejectTransfer(transferId: string, rejectedById?: string, reason?: string): Promise<{
        items: ({
            ingredient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
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
        status: import("@prisma/client").$Enums.TransferStatus;
        createdAt: Date;
        updatedAt: Date;
        sourceLocationId: string;
        destLocationId: string;
        notes: string | null;
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
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
        sourceLocation: {
            id: string;
            createdAt: Date;
            name: string;
            type: import("@prisma/client").$Enums.LocationType;
        };
        destLocation: {
            id: string;
            createdAt: Date;
            name: string;
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
        status: import("@prisma/client").$Enums.TransferStatus;
        createdAt: Date;
        updatedAt: Date;
        sourceLocationId: string;
        destLocationId: string;
        notes: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
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
        quantity: Prisma.Decimal;
        transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
        sourceLocationId: string | null;
        destLocationId: string | null;
        ingredientId: string;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        referenceId: string | null;
        reason: string | null;
        userId: string;
    }>;
    getTransfers(): Promise<({
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
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
        status: import("@prisma/client").$Enums.TransferStatus;
        createdAt: Date;
        updatedAt: Date;
        sourceLocationId: string;
        destLocationId: string;
        notes: string | null;
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        requestedById: string;
        approvedById: string | null;
    })[]>;
    getLedger(limit?: number): Promise<({
        user: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        sourceLocation: {
            id: string;
            createdAt: Date;
            name: string;
            type: import("@prisma/client").$Enums.LocationType;
        };
        destLocation: {
            id: string;
            createdAt: Date;
            name: string;
            type: import("@prisma/client").$Enums.LocationType;
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
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            category: string;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: Prisma.Decimal;
            reorderThresholdMain: Prisma.Decimal;
            reorderThresholdKitchen: Prisma.Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        quantity: Prisma.Decimal;
        transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
        sourceLocationId: string | null;
        destLocationId: string | null;
        ingredientId: string;
        unitCost: Prisma.Decimal;
        totalCost: Prisma.Decimal;
        referenceId: string | null;
        reason: string | null;
        userId: string;
    })[]>;
    getSuppliers(): Promise<({
        _count: {
            purchases: number;
        };
    } & {
        id: string;
        createdAt: Date;
        name: string;
        email: string | null;
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
        createdAt: Date;
        name: string;
        email: string | null;
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
        items: ({
            ingredient: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
            };
        } & {
            id: string;
            quantity: Prisma.Decimal;
            ingredientId: string;
            unitCost: Prisma.Decimal;
            totalCost: Prisma.Decimal;
            unitId: string;
            purchaseOrderId: string;
        })[];
        supplier: {
            id: string;
            createdAt: Date;
            name: string;
            email: string | null;
            address: string | null;
            phone: string | null;
            contactPerson: string | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PurchaseStatus;
        totalAmount: Prisma.Decimal;
        createdAt: Date;
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            categoryId: string;
            description: string | null;
            price: Prisma.Decimal;
            isDirectSale: boolean;
            directIngredientId: string | null;
            prepSection: string;
            imageUrl: string | null;
            isAvailable: boolean;
        };
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
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
            quantity: Prisma.Decimal;
            ingredientId: string;
            unitId: string;
            recipeId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        menuItemId: string;
        yieldPortions: Prisma.Decimal;
        prepInstructions: string | null;
        version: number;
    }>;
    adjustStock(userId: string, locationType: LocationType, ingredientId: string, deltaQuantity: number, reason: string): Promise<{
        balance: {
            id: string;
            quantity: Prisma.Decimal;
            ingredientId: string;
            locationId: string;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
        };
        transaction: {
            id: string;
            createdAt: Date;
            quantity: Prisma.Decimal;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            sourceLocationId: string | null;
            destLocationId: string | null;
            ingredientId: string;
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
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: Prisma.Decimal;
                reorderThresholdMain: Prisma.Decimal;
                reorderThresholdKitchen: Prisma.Decimal;
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
        status: import("@prisma/client").$Enums.TransferStatus;
        createdAt: Date;
        updatedAt: Date;
        sourceLocationId: string;
        destLocationId: string;
        notes: string | null;
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
                createdAt: Date;
                name: string;
                type: import("@prisma/client").$Enums.LocationType;
            };
        } & {
            id: string;
            quantity: Prisma.Decimal;
            ingredientId: string;
            locationId: string;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
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
                createdAt: Date;
                name: string;
                type: import("@prisma/client").$Enums.LocationType;
            };
        } & {
            id: string;
            quantity: Prisma.Decimal;
            ingredientId: string;
            locationId: string;
            reservedQuantity: Prisma.Decimal;
            lastUpdatedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
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
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            category: string;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: Prisma.Decimal;
            reorderThresholdMain: Prisma.Decimal;
            reorderThresholdKitchen: Prisma.Decimal;
        };
    }>;
}
