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
        displayOrder: number;
        iconName: string | null;
        badgeColor: string | null;
        isActive: boolean;
    })[]>;
    getMenuItems(categoryId?: string): Promise<any[]>;
    getAllAddons(): Promise<{
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
            isDirectSale: boolean;
            name: string;
            categoryId: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            directIngredientId: string | null;
            prepSection: string;
            imageUrl: string | null;
            isAvailable: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
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
            category: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        };
        id: string;
        ingredientId: string | null;
        name: string;
        isActive: boolean;
        categoryId: string | null;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string | null;
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
            isDirectSale: boolean;
            name: string;
            categoryId: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            directIngredientId: string | null;
            prepSection: string;
            imageUrl: string | null;
            isAvailable: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
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
            category: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string | null;
        name: string;
        isActive: boolean;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string | null;
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
            isDirectSale: boolean;
            name: string;
            categoryId: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            directIngredientId: string | null;
            prepSection: string;
            imageUrl: string | null;
            isAvailable: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
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
            category: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            baseUnitId: string;
            currentCostPerBaseUnit: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdMain: import("@prisma/client/runtime/library").Decimal;
            reorderThresholdKitchen: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string | null;
        name: string;
        isActive: boolean;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string | null;
        unitId: string | null;
    }>;
    deleteAddon(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getTables(): Promise<({
        orders: {
            id: string;
            status: import("@prisma/client").$Enums.OrderStatus;
            orderNumber: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        tableNumber: string;
        capacity: number;
        status: import("@prisma/client").$Enums.TableStatus;
    })[]>;
    createTable(data: {
        tableNumber: string;
        capacity?: number;
        status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    }): Promise<{
        id: string;
        tableNumber: string;
        capacity: number;
        status: import("@prisma/client").$Enums.TableStatus;
    }>;
    updateTable(id: string, data: {
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
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
            isActive: boolean;
        };
    } & {
        id: string;
        isDirectSale: boolean;
        name: string;
        categoryId: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        directIngredientId: string | null;
        prepSection: string;
        imageUrl: string | null;
        isAvailable: boolean;
        createdAt: Date;
        updatedAt: Date;
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
            displayOrder: number;
            iconName: string | null;
            badgeColor: string | null;
            isActive: boolean;
        };
    } & {
        id: string;
        isDirectSale: boolean;
        name: string;
        categoryId: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
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
    saveRecipe(menuItemId: string, yieldPortions: number, ingredients: {
        ingredientId: string;
        quantity: number;
        unitId?: string;
    }[]): Promise<{
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
                category: string;
                createdAt: Date;
                updatedAt: Date;
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
}
