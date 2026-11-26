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
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
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
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
            locationId: string;
            ingredientId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
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
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        };
        location: {
            id: string;
            name: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.LocationType;
        };
    } & {
        id: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reservedQuantity: import("@prisma/client/runtime/library").Decimal;
        lastUpdatedAt: Date;
        locationId: string;
        ingredientId: string;
    })[]>;
    getTransfers(): Promise<({
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
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
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
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
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
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
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
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
        items: ({
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
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
        userId: string;
        reason: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        sourceLocationId: string | null;
        destLocationId: string | null;
        transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        totalCost: import("@prisma/client/runtime/library").Decimal;
        referenceId: string | null;
    }>;
    getLedger(limit?: string, page?: string, type?: string, search?: string): Promise<{
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            reason: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            sourceLocationId: string | null;
            destLocationId: string | null;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            totalCost: import("@prisma/client/runtime/library").Decimal;
            referenceId: string | null;
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
    createSupplier(body: {
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
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            unitId: string;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            totalCost: import("@prisma/client/runtime/library").Decimal;
            purchaseOrderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.PurchaseStatus;
        locationId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
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
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isDirectSale: boolean;
            categoryId: string;
            price: import("@prisma/client/runtime/library").Decimal;
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
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
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
            recipeId: string;
            unitId: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
            locationId: string;
            ingredientId: string;
        };
        transaction: {
            id: string;
            createdAt: Date;
            userId: string;
            reason: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            ingredientId: string;
            sourceLocationId: string | null;
            destLocationId: string | null;
            transactionType: import("@prisma/client").$Enums.InventoryTransactionType;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            totalCost: import("@prisma/client/runtime/library").Decimal;
            referenceId: string | null;
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
            unit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
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
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                category: string;
                sku: string;
                baseUnitId: string;
                currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
                reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            ingredientId: string;
            unitId: string;
            requestedQty: import("@prisma/client/runtime/library").Decimal;
            dispatchedQty: import("@prisma/client/runtime/library").Decimal | null;
            receivedQty: import("@prisma/client/runtime/library").Decimal | null;
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
        transferNumber: string;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
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
                createdAt: Date;
                type: import("@prisma/client").$Enums.LocationType;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
            locationId: string;
            ingredientId: string;
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        balances: ({
            location: {
                id: string;
                name: string;
                createdAt: Date;
                type: import("@prisma/client").$Enums.LocationType;
            };
        } & {
            id: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            reservedQuantity: import("@prisma/client/runtime/library").Decimal;
            lastUpdatedAt: Date;
            locationId: string;
            ingredientId: string;
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            category: string;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
}
