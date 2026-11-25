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
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
        } & {
            id: string;
            locationId: string;
            ingredientId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
        })[];
    } & {
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.LocationType;
        createdAt: Date;
    })[]>;
    getAlerts(role?: string): Promise<({
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
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            sku: string;
            category: string;
            baseUnitId: string;
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            updatedAt: Date;
        };
    } & {
        id: string;
        locationId: string;
        ingredientId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reservedQuantity: import("@prisma/client/runtime/library").Decimal;
        lastUpdatedAt: Date;
    })[]>;
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
                    baseMultiplier: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
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
    requestTransfer(body: {
        requestedById: string;
        items: {
            ingredientId: string;
            requestedQty: number;
            unitId: string;
        }[];
        notes?: string;
    }): Promise<{
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
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
    dispatchTransfer(id: string, body: {
        approvedById: string;
        dispatchedItems: {
            itemId: string;
            dispatchedQty: number;
        }[];
    }): Promise<{
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
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
    dispatchDirectBatch(body: {
        senderId?: string;
        userId?: string;
        items: {
            ingredientId: string;
            quantity: number;
        }[];
        notes?: string;
    }): Promise<{
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
                    baseMultiplier: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
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
    rejectTransfer(id: string, body: {
        rejectedById?: string;
        userId?: string;
        reason?: string;
    }): Promise<{
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
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
        name: string;
        createdAt: Date;
        sku: string;
        category: string;
        baseUnitId: string;
        currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        updatedAt: Date;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
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
    recordWastage(body: {
        userId: string;
        ingredientId: string;
        quantity: number;
        reason: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        ingredientId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        sourceLocationId: string | null;
        destLocationId: string | null;
        transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        referenceId: string | null;
        reason: string | null;
        userId: string;
    }>;
    getLedger(limit?: string, page?: string, type?: string, search?: string): Promise<{
        data: {
            id: string;
            createdAt: Date;
            ingredientId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sourceLocationId: string | null;
            destLocationId: string | null;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            totalCost: import("@prisma/client/runtime/library").Decimal;
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
    createSupplier(body: {
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
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
            };
        } & {
            id: string;
            ingredientId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            totalCost: import("@prisma/client/runtime/library").Decimal;
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
        totalAmount: import("@prisma/client/runtime/library").Decimal;
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
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
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
            price: import("@prisma/client/runtime/library").Decimal;
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
            locationId: string;
            ingredientId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
        };
        transaction: {
            id: string;
            createdAt: Date;
            ingredientId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            sourceLocationId: string | null;
            destLocationId: string | null;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
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
                    baseMultiplier: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                sku: string;
                category: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                updatedAt: Date;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
        })[];
        baseUnit: {
            symbol: string;
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.UnitType;
            baseMultiplier: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        sku: string;
        category: string;
        baseUnitId: string;
        currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        updatedAt: Date;
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
        name: string;
        createdAt: Date;
        sku: string;
        category: string;
        baseUnitId: string;
        currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        updatedAt: Date;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
        })[];
        baseUnit: {
            symbol: string;
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.UnitType;
            baseMultiplier: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        sku: string;
        category: string;
        baseUnitId: string;
        currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
        reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
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
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            updatedAt: Date;
        };
    }>;
}
