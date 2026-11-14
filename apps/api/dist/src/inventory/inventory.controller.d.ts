import { InventoryService } from './inventory.service';
import { LocationType } from '@cafe/shared-types';
export declare class InventoryController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
    getBalances(location?: LocationType, role?: string): Promise<({
        balances: ({
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            locationId: string;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        type: import("@prisma/client").$Enums.LocationType;
    })[]>;
    getAlerts(role?: string): Promise<({
        ingredient: {
            baseUnit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        };
        location: {
            id: string;
            createdAt: Date;
            name: string;
            type: import("@prisma/client").$Enums.LocationType;
        };
    } & {
        id: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        locationId: string;
        reservedQuantity: import("@prisma/client/runtime/library").Decimal;
        lastUpdatedAt: Date;
    })[]>;
    getTransfers(): Promise<({
        items: ({
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
    requestTransfer(body: {
        requestedById: string;
        items: {
            ingredientId: string;
            requestedQty: number;
            unitId: string;
        }[];
        notes?: string;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
    dispatchTransfer(id: string, body: {
        approvedById: string;
        dispatchedItems: {
            itemId: string;
            dispatchedQty: number;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
    dispatchDirectBatch(body: {
        senderId?: string;
        userId?: string;
        items: {
            ingredientId: string;
            quantity: number;
        }[];
        notes?: string;
    }): Promise<{
        items: ({
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
    rejectTransfer(id: string, body: {
        rejectedById?: string;
        userId?: string;
        reason?: string;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
    updateIngredientThresholds(id: string, body: {
        reorderThresholdMain?: number;
        reorderThresholdKitchen?: number;
    }): Promise<{
        baseUnit: {
            symbol: string;
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.UnitType;
            baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
        currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
    }>;
    receiveTransfer(id: string, body: {
        receivedById?: string;
        userId?: string;
        receivedItems?: {
            itemId?: string;
            ingredientId?: string;
            receivedQty: number;
        }[];
        items?: {
            itemId?: string;
            ingredientId?: string;
            receivedQty: number;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
    recordWastage(body: {
        userId: string;
        ingredientId: string;
        quantity: number;
        reason: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
        sourceLocationId: string | null;
        destLocationId: string | null;
        ingredientId: string;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        referenceId: string | null;
        reason: string | null;
        userId: string;
    }>;
    getLedger(limit?: string): Promise<({
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
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
        sourceLocationId: string | null;
        destLocationId: string | null;
        ingredientId: string;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
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
    createSupplier(body: {
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
    recordPurchaseReceipt(body: {
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            totalCost: import("@prisma/client/runtime/library").Decimal;
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
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        notes: string | null;
        locationId: string;
        receivedAt: Date;
        poNumber: string;
        invoiceNumber: string | null;
        createdById: string;
        supplierId: string;
    }>;
    updateRecipe(body: {
        menuItemId: string;
        yieldPortions: number;
        ingredientsList: {
            ingredientId: string;
            quantity: number;
            unitId: string;
        }[];
    }): Promise<{
        menuItem: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            categoryId: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
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
                    baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        yieldPortions: import("@prisma/client/runtime/library").Decimal;
        prepInstructions: string | null;
        version: number;
    }>;
    adjustStock(body: {
        userId: string;
        locationType: LocationType;
        ingredientId: string;
        deltaQuantity: number;
        reason: string;
    }): Promise<{
        balance: {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            locationId: string;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
        };
        transaction: {
            id: string;
            createdAt: Date;
            quantity: import("@prisma/client/runtime/library").Decimal;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            sourceLocationId: string | null;
            destLocationId: string | null;
            ingredientId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            totalCost: import("@prisma/client/runtime/library").Decimal;
            referenceId: string | null;
            reason: string | null;
            userId: string;
        };
    }>;
    directDispatch(body: {
        sentById?: string;
        userId?: string;
        items?: {
            ingredientId: string;
            quantity: number;
        }[];
        ingredientId?: string;
        quantity?: number;
        notes?: string;
    }): Promise<{
        items: ({
            ingredient: {
                baseUnit: {
                    symbol: string;
                    id: string;
                    name: string;
                    type: import("@prisma/client").$Enums.UnitType;
                    baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
            baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            locationId: string;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
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
        currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getUnits(): Promise<{
        symbol: string;
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.UnitType;
        baseMultiplier: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    createIngredient(body: {
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
            baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
        currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateIngredient(id: string, body: {
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
            baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            locationId: string;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
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
        currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
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
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
}
