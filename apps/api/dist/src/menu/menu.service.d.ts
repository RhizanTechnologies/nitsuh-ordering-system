import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
export declare class MenuService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getCategories(): Promise<({
        _count: {
            menuItems: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        displayOrder: number;
        iconName: string | null;
        badgeColor: string | null;
    })[]>;
    getMenuItems(categoryId?: string): Promise<any[]>;
    getAllAddons(): Promise<{
        price: number;
        quantity: number;
        costPerAddon: number;
        profitPerAddon: number;
        marginPercent: number;
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
        category: {
            id: string;
            name: string;
            isActive: boolean;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
        };
        unit: {
            symbol: string;
            id: string;
            name: string;
            type: import("@prisma/client").$Enums.UnitType;
            baseMultiplier: import("@prisma/client/runtime/library").Decimal;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        menuItemId: string | null;
        ingredientId: string | null;
        categoryId: string | null;
        unitId: string | null;
    }[]>;
    createAddon(data: {
        name: string;
        price: number;
        ingredientId?: string;
        quantity?: number;
        unitId?: string;
        categoryId?: string;
        menuItemId?: string;
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
        category: {
            id: string;
            name: string;
            isActive: boolean;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        menuItemId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string | null;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        unitId: string | null;
    }>;
    updateAddon(id: string, data: {
        name?: string;
        price?: number;
        ingredientId?: string | null;
        quantity?: number;
        unitId?: string | null;
        categoryId?: string | null;
        menuItemId?: string | null;
        isActive?: boolean;
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
        category: {
            id: string;
            name: string;
            isActive: boolean;
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isActive: boolean;
        menuItemId: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string | null;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        unitId: string | null;
    }>;
    deleteAddon(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getTables(): Promise<({
        orders: {
            id: string;
            orderNumber: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.TableStatus;
        tableNumber: string;
        capacity: number;
    })[]>;
    createTable(data: {
        tableNumber: string;
        capacity?: number;
        status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    }): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TableStatus;
        tableNumber: string;
        capacity: number;
    }>;
    updateTable(id: string, data: {
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
    createMenuItem(data: {
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
    }>;
    updateMenuItem(id: string, data: {
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
    }>;
    deleteMenuItem(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    saveRecipe(menuItemId: string, yieldPortions: number, ingredients: {
        ingredientId: string;
        quantity: number;
        unitId?: string;
    }[]): Promise<{
        ingredients: ({
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
}
