import { MenuService } from './menu.service';
export declare class MenuController {
    private menuService;
    constructor(menuService: MenuService);
    getCategories(): Promise<({
        _count: {
            menuItems: number;
        };
    } & {
        id: string;
        name: string;
        displayOrder: number;
        iconName: string | null;
        badgeColor: string | null;
        isActive: boolean;
    })[]>;
    getItems(categoryId?: string): Promise<any[]>;
    createMenuItem(body: {
        name: string;
        categoryId: string;
        price: number;
        description?: string;
        prepSection?: string;
        isDirectSale?: boolean;
        imageUrl?: string;
    }): Promise<{
        category: {
            id: string;
            name: string;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
            isActive: boolean;
        };
    } & {
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
    }>;
    updateMenuItem(id: string, body: {
        name?: string;
        categoryId?: string;
        price?: number;
        description?: string;
        prepSection?: string;
        isDirectSale?: boolean;
        imageUrl?: string;
        isAvailable?: boolean;
    }): Promise<{
        category: {
            id: string;
            name: string;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
            isActive: boolean;
        };
    } & {
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
    }>;
    deleteMenuItem(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    saveItemRecipe(id: string, body: {
        yieldPortions?: number;
        ingredients?: {
            ingredientId: string;
            quantity: number;
            unitId?: string;
        }[];
        ingredientsList?: {
            ingredientId: string;
            quantity: number;
            unitId?: string;
        }[];
    }): Promise<{
        ingredients: ({
            ingredient: {
                category: string;
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitId: string;
            recipeId: string;
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
    getTables(): Promise<({
        orders: {
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        }[];
    } & {
        id: string;
        tableNumber: string;
        capacity: number;
        status: import("@prisma/client").$Enums.TableStatus;
    })[]>;
    createTable(body: {
        tableNumber: string;
        capacity?: number;
        status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    }): Promise<{
        id: string;
        tableNumber: string;
        capacity: number;
        status: import("@prisma/client").$Enums.TableStatus;
    }>;
    updateTable(id: string, body: {
        tableNumber?: string;
        capacity?: number;
        status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    }): Promise<{
        id: string;
        tableNumber: string;
        capacity: number;
        status: import("@prisma/client").$Enums.TableStatus;
    }>;
    deleteTable(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAddons(): Promise<{
        price: number;
        quantity: number;
        costPerAddon: number;
        profitPerAddon: number;
        marginPercent: number;
        category: {
            id: string;
            name: string;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
            isActive: boolean;
        };
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
        ingredient: {
            baseUnit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            category: string;
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
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
        id: string;
        name: string;
        isActive: boolean;
        categoryId: string | null;
        createdAt: Date;
        updatedAt: Date;
        ingredientId: string | null;
        unitId: string | null;
        menuItemId: string | null;
    }[]>;
    createAddon(body: {
        name: string;
        price: number;
        ingredientId?: string;
        quantity?: number;
        unitId?: string;
        categoryId?: string;
        menuItemId?: string;
    }): Promise<{
        category: {
            id: string;
            name: string;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
            isActive: boolean;
        };
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
        ingredient: {
            baseUnit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            category: string;
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
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
        name: string;
        isActive: boolean;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        ingredientId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unitId: string | null;
        menuItemId: string | null;
    }>;
    updateAddon(id: string, body: {
        name?: string;
        price?: number;
        ingredientId?: string | null;
        quantity?: number;
        unitId?: string | null;
        categoryId?: string | null;
        menuItemId?: string | null;
        isActive?: boolean;
    }): Promise<{
        category: {
            id: string;
            name: string;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
            isActive: boolean;
        };
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
        ingredient: {
            baseUnit: {
                symbol: string;
                id: string;
                name: string;
                type: import("@prisma/client").$Enums.UnitType;
                baseMultiplier: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            category: string;
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
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
        name: string;
        isActive: boolean;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        ingredientId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unitId: string | null;
        menuItemId: string | null;
    }>;
    deleteAddon(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
