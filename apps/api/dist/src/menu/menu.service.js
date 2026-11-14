"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const events_gateway_1 = require("../events/events.gateway");
let MenuService = class MenuService {
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async getCategories() {
        return this.prisma.category.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            include: {
                _count: { select: { menuItems: true } },
            },
        });
    }
    async getMenuItems(categoryId) {
        const items = await this.prisma.menuItem.findMany({
            where: {
                isAvailable: true,
                category: { isActive: true },
                ...(categoryId ? { categoryId } : {}),
            },
            include: {
                category: true,
                recipe: {
                    include: {
                        ingredients: {
                            include: {
                                ingredient: {
                                    include: { baseUnit: true },
                                },
                                unit: true,
                            },
                        },
                    },
                },
                directIngredient: {
                    include: { baseUnit: true },
                },
                addons: {
                    where: { isActive: true },
                    include: {
                        ingredient: { include: { baseUnit: true } },
                        unit: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const categoryAndGlobalAddons = await this.prisma.menuItemAddon.findMany({
            where: {
                isActive: true,
                menuItemId: null,
            },
            include: {
                ingredient: { include: { baseUnit: true } },
                unit: true,
            },
            orderBy: { name: 'asc' },
        });
        return items.map((item) => {
            let portionCost = 0;
            if (item.isDirectSale && item.directIngredient) {
                portionCost = Number(item.directIngredient.currentCostPerBaseUnit);
            }
            else if (item.recipe && item.recipe.ingredients.length > 0) {
                for (const ri of item.recipe.ingredients) {
                    const ingCost = Number(ri.ingredient.currentCostPerBaseUnit);
                    const qty = Number(ri.quantity);
                    portionCost += ingCost * qty;
                }
            }
            const price = Number(item.price);
            const grossProfit = price - portionCost;
            const marginPercent = price > 0 ? (grossProfit / price) * 100 : 0;
            const matchedAddons = [
                ...(item.addons || []),
                ...categoryAndGlobalAddons.filter((a) => a.categoryId === item.categoryId || a.categoryId === null),
            ];
            const uniqueAddonsMap = new Map();
            for (const a of matchedAddons) {
                if (!uniqueAddonsMap.has(a.id)) {
                    const addonIngCost = a.ingredient
                        ? Number(a.ingredient.currentCostPerBaseUnit) * Number(a.quantity || 0)
                        : 0;
                    uniqueAddonsMap.set(a.id, {
                        ...a,
                        costPerAddon: Number(addonIngCost.toFixed(4)),
                        price: Number(a.price),
                        quantity: Number(a.quantity || 0),
                    });
                }
            }
            return {
                ...item,
                costPerPortion: Number(portionCost.toFixed(4)),
                grossProfitEstimate: Number(grossProfit.toFixed(2)),
                marginPercent: Number(marginPercent.toFixed(1)),
                applicableAddons: Array.from(uniqueAddonsMap.values()),
            };
        });
    }
    async getAllAddons() {
        const addons = await this.prisma.menuItemAddon.findMany({
            include: {
                ingredient: { include: { baseUnit: true } },
                unit: true,
                category: true,
                menuItem: true,
            },
            orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
        });
        return addons.map((a) => {
            const ingCost = a.ingredient
                ? Number(a.ingredient.currentCostPerBaseUnit) * Number(a.quantity || 0)
                : 0;
            const price = Number(a.price);
            const profit = price - ingCost;
            const margin = price > 0 ? (profit / price) * 100 : 0;
            return {
                ...a,
                price,
                quantity: Number(a.quantity || 0),
                costPerAddon: Number(ingCost.toFixed(4)),
                profitPerAddon: Number(profit.toFixed(2)),
                marginPercent: Number(margin.toFixed(1)),
            };
        });
    }
    async createAddon(data) {
        if (!data.name || !data.name.trim()) {
            throw new common_1.BadRequestException('Add-on name is required');
        }
        if (data.price === undefined || data.price === null || isNaN(Number(data.price))) {
            throw new common_1.BadRequestException('Valid price is required');
        }
        let unitId = data.unitId;
        if (!unitId && data.ingredientId) {
            const ing = await this.prisma.ingredient.findUnique({
                where: { id: data.ingredientId },
                select: { baseUnitId: true },
            });
            if (ing)
                unitId = ing.baseUnitId;
        }
        return this.prisma.menuItemAddon.create({
            data: {
                name: data.name.trim(),
                price: Number(data.price),
                ingredientId: data.ingredientId || null,
                quantity: data.quantity !== undefined ? Number(data.quantity) : 0,
                unitId: unitId || null,
                categoryId: data.categoryId || null,
                menuItemId: data.menuItemId || null,
                isActive: true,
            },
            include: {
                ingredient: { include: { baseUnit: true } },
                unit: true,
                category: true,
                menuItem: true,
            },
        });
    }
    async updateAddon(id, data) {
        const existing = await this.prisma.menuItemAddon.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Add-on not found');
        let unitId = data.unitId;
        if (unitId === undefined && data.ingredientId) {
            const ing = await this.prisma.ingredient.findUnique({
                where: { id: data.ingredientId },
                select: { baseUnitId: true },
            });
            if (ing)
                unitId = ing.baseUnitId;
        }
        return this.prisma.menuItemAddon.update({
            where: { id },
            data: {
                ...(data.name !== undefined ? { name: data.name.trim() } : {}),
                ...(data.price !== undefined ? { price: Number(data.price) } : {}),
                ...(data.ingredientId !== undefined ? { ingredientId: data.ingredientId } : {}),
                ...(data.quantity !== undefined ? { quantity: Number(data.quantity) } : {}),
                ...(unitId !== undefined ? { unitId } : {}),
                ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
                ...(data.menuItemId !== undefined ? { menuItemId: data.menuItemId } : {}),
                ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            },
            include: {
                ingredient: { include: { baseUnit: true } },
                unit: true,
                category: true,
                menuItem: true,
            },
        });
    }
    async deleteAddon(id) {
        const existing = await this.prisma.menuItemAddon.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Add-on not found');
        await this.prisma.menuItemAddon.delete({ where: { id } });
        return { success: true, message: `Add-on "${existing.name}" deleted.` };
    }
    async getTables() {
        return this.prisma.diningTable.findMany({
            orderBy: { tableNumber: 'asc' },
            include: {
                orders: {
                    where: {
                        status: { in: ['CONFIRMED', 'IN_PREPARATION', 'READY', 'SERVED'] },
                    },
                    select: { id: true, orderNumber: true, totalAmount: true, status: true },
                },
            },
        });
    }
    async createTable(data) {
        if (!data.tableNumber || !data.tableNumber.trim()) {
            throw new common_1.BadRequestException('Table number or name is required');
        }
        const cleanNumber = data.tableNumber.trim();
        const existing = await this.prisma.diningTable.findUnique({
            where: { tableNumber: cleanNumber },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Table "${cleanNumber}" already exists.`);
        }
        const table = await this.prisma.diningTable.create({
            data: {
                tableNumber: cleanNumber,
                capacity: Number(data.capacity) || 4,
                status: data.status || 'AVAILABLE',
            },
        });
        const allTables = await this.getTables();
        this.eventsGateway.broadcastTablesUpdated(allTables);
        return table;
    }
    async updateTable(id, data) {
        const existing = await this.prisma.diningTable.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Table not found');
        }
        if (data.tableNumber && data.tableNumber.trim() !== existing.tableNumber) {
            const cleanNumber = data.tableNumber.trim();
            const duplicate = await this.prisma.diningTable.findUnique({
                where: { tableNumber: cleanNumber },
            });
            if (duplicate) {
                throw new common_1.BadRequestException(`Table "${cleanNumber}" already exists.`);
            }
        }
        const updated = await this.prisma.diningTable.update({
            where: { id },
            data: {
                ...(data.tableNumber ? { tableNumber: data.tableNumber.trim() } : {}),
                ...(data.capacity !== undefined ? { capacity: Number(data.capacity) } : {}),
                ...(data.status ? { status: data.status } : {}),
            },
        });
        const allTables = await this.getTables();
        this.eventsGateway.broadcastTablesUpdated(allTables);
        return updated;
    }
    async deleteTable(id) {
        const table = await this.prisma.diningTable.findUnique({
            where: { id },
            include: {
                orders: {
                    where: {
                        status: { in: ['CONFIRMED', 'IN_PREPARATION', 'READY', 'SERVED'] },
                    },
                },
            },
        });
        if (!table) {
            throw new common_1.NotFoundException('Table not found');
        }
        if (table.orders.length > 0) {
            throw new common_1.BadRequestException(`Cannot delete table ${table.tableNumber}: active order ${table.orders[0].orderNumber} is assigned. Please settle or cancel it first.`);
        }
        await this.prisma.order.updateMany({
            where: { tableId: id },
            data: { tableId: null },
        });
        await this.prisma.diningTable.delete({ where: { id } });
        const allTables = await this.getTables();
        this.eventsGateway.broadcastTablesUpdated(allTables);
        return { success: true, message: `Table ${table.tableNumber} deleted successfully.` };
    }
    async createMenuItem(data) {
        return this.prisma.menuItem.create({
            data: {
                name: data.name,
                categoryId: data.categoryId,
                price: data.price,
                description: data.description || null,
                prepSection: data.prepSection || 'HOT_KITCHEN',
                isDirectSale: data.isDirectSale ?? false,
                imageUrl: data.imageUrl || null,
                isAvailable: true,
            },
            include: {
                category: true,
            },
        });
    }
    async updateMenuItem(id, data) {
        const item = await this.prisma.menuItem.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        return this.prisma.menuItem.update({
            where: { id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
                ...(data.price !== undefined ? { price: data.price } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.prepSection !== undefined ? { prepSection: data.prepSection } : {}),
                ...(data.isDirectSale !== undefined ? { isDirectSale: data.isDirectSale } : {}),
                ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
                ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
            },
            include: {
                category: true,
            },
        });
    }
    async deleteMenuItem(id) {
        const item = await this.prisma.menuItem.findUnique({
            where: { id },
            include: { orderItems: true },
        });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        if (item.orderItems.length > 0) {
            await this.prisma.menuItem.update({
                where: { id },
                data: { isAvailable: false },
            });
            return { success: true, message: `Product "${item.name}" has order history, so it was marked unavailable (archived).` };
        }
        const recipe = await this.prisma.recipe.findUnique({ where: { menuItemId: id } });
        if (recipe) {
            await this.prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
            await this.prisma.recipe.delete({ where: { id: recipe.id } });
        }
        await this.prisma.menuItem.delete({ where: { id } });
        return { success: true, message: `Product "${item.name}" deleted successfully.` };
    }
    async saveRecipe(menuItemId, yieldPortions, ingredients) {
        return this.prisma.$transaction(async (tx) => {
            let recipe = await tx.recipe.findUnique({ where: { menuItemId } });
            if (!recipe) {
                recipe = await tx.recipe.create({
                    data: {
                        menuItemId,
                        yieldPortions: Number(yieldPortions) || 1,
                        prepInstructions: 'Chef standard preparation',
                    },
                });
            }
            else {
                await tx.recipe.update({
                    where: { id: recipe.id },
                    data: { yieldPortions: Number(yieldPortions) || 1, version: { increment: 1 } },
                });
                await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
            }
            for (const ing of ingredients) {
                let unitId = ing.unitId;
                if (!unitId) {
                    const ingredientRecord = await tx.ingredient.findUnique({
                        where: { id: ing.ingredientId },
                        select: { baseUnitId: true },
                    });
                    unitId = ingredientRecord?.baseUnitId;
                }
                if (unitId) {
                    await tx.recipeIngredient.create({
                        data: {
                            recipeId: recipe.id,
                            ingredientId: ing.ingredientId,
                            quantity: Number(ing.quantity) || 1,
                            unitId,
                        },
                    });
                }
            }
            return tx.recipe.findUnique({
                where: { id: recipe.id },
                include: {
                    ingredients: {
                        include: { ingredient: true, unit: true },
                    },
                },
            });
        });
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], MenuService);
//# sourceMappingURL=menu.service.js.map