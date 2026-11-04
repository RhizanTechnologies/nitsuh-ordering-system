import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { menuItems: true } },
      },
    });
  }

  async getMenuItems(categoryId?: string) {
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
      },
      orderBy: { name: 'asc' },
    });

    // Compute exact production cost and gross profit per item
    return items.map((item: any) => {
      let portionCost = 0;

      if (item.isDirectSale && item.directIngredient) {
        portionCost = Number(item.directIngredient.currentCostPerBaseUnit);
      } else if (item.recipe && item.recipe.ingredients.length > 0) {
        for (const ri of item.recipe.ingredients) {
          const ingCost = Number(ri.ingredient.currentCostPerBaseUnit);
          const qty = Number(ri.quantity);
          portionCost += ingCost * qty;
        }
      }

      const price = Number(item.price);
      const grossProfit = price - portionCost;
      const marginPercent = price > 0 ? (grossProfit / price) * 100 : 0;

      return {
        ...item,
        costPerPortion: Number(portionCost.toFixed(4)),
        grossProfitEstimate: Number(grossProfit.toFixed(2)),
        marginPercent: Number(marginPercent.toFixed(1)),
      };
    });
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

  async createTable(data: { tableNumber: string; capacity?: number; status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' }) {
    if (!data.tableNumber || !data.tableNumber.trim()) {
      throw new BadRequestException('Table number or name is required');
    }
    const cleanNumber = data.tableNumber.trim();
    const existing = await this.prisma.diningTable.findUnique({
      where: { tableNumber: cleanNumber },
    });
    if (existing) {
      throw new BadRequestException(`Table "${cleanNumber}" already exists.`);
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

  async updateTable(
    id: string,
    data: { tableNumber?: string; capacity?: number; status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' },
  ) {
    const existing = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Table not found');
    }

    if (data.tableNumber && data.tableNumber.trim() !== existing.tableNumber) {
      const cleanNumber = data.tableNumber.trim();
      const duplicate = await this.prisma.diningTable.findUnique({
        where: { tableNumber: cleanNumber },
      });
      if (duplicate) {
        throw new BadRequestException(`Table "${cleanNumber}" already exists.`);
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

  async deleteTable(id: string) {
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
      throw new NotFoundException('Table not found');
    }

    if (table.orders.length > 0) {
      throw new BadRequestException(
        `Cannot delete table ${table.tableNumber}: active order ${table.orders[0].orderNumber} is assigned. Please settle or cancel it first.`,
      );
    }

    // Unlink old historical settled orders
    await this.prisma.order.updateMany({
      where: { tableId: id },
      data: { tableId: null },
    });

    await this.prisma.diningTable.delete({ where: { id } });

    const allTables = await this.getTables();
    this.eventsGateway.broadcastTablesUpdated(allTables);
    return { success: true, message: `Table ${table.tableNumber} deleted successfully.` };
  }

  async createMenuItem(data: {
    name: string;
    categoryId: string;
    price: number;
    description?: string;
    prepSection?: string;
    isDirectSale?: boolean;
    imageUrl?: string;
  }) {
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

  async updateMenuItem(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      price?: number;
      description?: string;
      prepSection?: string;
      isDirectSale?: boolean;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');

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

  async deleteMenuItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { orderItems: true },
    });
    if (!item) throw new NotFoundException('Menu item not found');

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

  async saveRecipe(
    menuItemId: string,
    yieldPortions: number,
    ingredients: { ingredientId: string; quantity: number; unitId?: string }[],
  ) {
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
      } else {
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
}
