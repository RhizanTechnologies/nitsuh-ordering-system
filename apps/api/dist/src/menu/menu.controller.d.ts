import { MenuService } from './menu.service';
export declare class MenuController {
    private menuService;
    constructor(menuService: MenuService);
    getCategories(): Promise<({
        _count: {
            menuItems: number;
            addons: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        iconName: string | null;
        badgeColor: string | null;
    })[]>;
    createCategory(body: {
        name: string;
        displayOrder?: number;
        iconName?: string;
        badgeColor?: string;
    }): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        iconName: string | null;
        badgeColor: string | null;
    }>;
    deleteCategory(id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        iconName: string | null;
        badgeColor: string | null;
    }>;
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
            isActive: boolean;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
        };
    } & {
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
            isActive: boolean;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
        };
    } & {
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
        status: import("@prisma/client").$Enums.TableStatus;
        tableNumber: string;
        capacity: number;
    })[]>;
    createTable(body: {
        tableNumber: string;
        capacity?: number;
        status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    }): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TableStatus;
        tableNumber: string;
        capacity: number;
    }>;
    updateTable(id: string, body: {
        tableNumber?: string;
        capacity?: number;
        status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    }): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TableStatus;
        tableNumber: string;
        capacity: number;
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
        category: {
            id: string;
            name: string;
            isActive: boolean;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
        };
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
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        ingredientId: string | null;
        categoryId: string | null;
        menuItemId: string | null;
        unitId: string | null;
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
        category: {
            id: string;
            name: string;
            isActive: boolean;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
        };
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
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string | null;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        menuItemId: string | null;
        unitId: string | null;
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
        category: {
            id: string;
            name: string;
            isActive: boolean;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
        };
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
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string | null;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        menuItemId: string | null;
        unitId: string | null;
    }>;
    deleteAddon(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
