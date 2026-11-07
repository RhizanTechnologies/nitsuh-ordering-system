import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  PaymentMethod,
  ItemPrepStatus,
  LocationType,
  InventoryTransactionType,
} from '@cafe/shared-types';
import { Prisma, TableStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  // 1. Waiter creates Digital Order Note (Draft slip sent to cashier)
  async createWaiterDraftNote(data: {
    tableId?: string;
    customerName?: string;
    waiterId: string;
    orderType?: OrderType;
    items: {
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
      selectedAddonIds?: string[];
      selectedAddons?: any[];
    }[];
  }) {
    // If dine-in and tableId specified, automatically append to active unsettled bill if guests order more items!
    if (data.tableId && data.orderType !== OrderType.TAKEAWAY) {
      const activeUnsettledOrder = await this.prisma.order.findFirst({
        where: {
          tableId: data.tableId,
          paymentStatus: { not: PaymentStatus.PAID },
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.IN_PREPARATION, OrderStatus.READY, OrderStatus.SERVED] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (activeUnsettledOrder) {
        return this.appendItemsToOrder(activeUnsettledOrder.id, {
          cashierId: data.waiterId,
          items: data.items,
        });
      }
    }

    // Generate strictly unique sequential order number
    const allOrders = await this.prisma.order.findMany({ select: { orderNumber: true } });
    const maxNum = allOrders.reduce((max, o) => {
      const parsed = parseInt(o.orderNumber.replace(/\D/g, ''), 10);
      return !isNaN(parsed) && parsed > max ? parsed : max;
    }, 27000);
    const orderNumber = `#${maxNum + 1}`;

    // Fetch items with price and recipes to compute subtotal and portion cost snapshot
    const itemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: { ingredient: true },
            },
          },
        },
        directIngredient: true,
      },
    });

    // Fetch any referenced addons to ensure exact pricing & ingredient deduction
    const allAddonIds: string[] = [];
    for (const itm of data.items) {
      if (Array.isArray(itm.selectedAddonIds)) {
        allAddonIds.push(...itm.selectedAddonIds);
      }
      if (Array.isArray(itm.selectedAddons)) {
        for (const a of itm.selectedAddons) {
          if (a?.id) allAddonIds.push(a.id);
        }
      }
    }
    const dbAddons = allAddonIds.length > 0
      ? await this.prisma.menuItemAddon.findMany({
          where: { id: { in: Array.from(new Set(allAddonIds)) } },
          include: { ingredient: { include: { baseUnit: true } }, unit: true },
        })
      : [];

    let subtotal = 0;
    let totalTip = 0;
    const orderItemsCreate = data.items.map((cartItem) => {
      const mi = menuItems.find((m) => m.id === cartItem.menuItemId);
      if (!mi) throw new NotFoundException(`Item not found`);

      // Resolve selected addons
      const selectedAddonsSnapshot: any[] = [];
      let addonsPriceTotal = 0;
      let addonsCostTotal = 0;

      const itemAddonIds = [
        ...(cartItem.selectedAddonIds || []),
        ...(cartItem.selectedAddons?.map((a: any) => a.id) || []),
      ];
      const uniqueAddonIds = Array.from(new Set(itemAddonIds.filter(Boolean)));

      for (const addonId of uniqueAddonIds) {
        const addon = dbAddons.find((a) => a.id === addonId);
        if (addon) {
          const aPrice = Number(addon.price);
          const aQty = Number(addon.quantity || 0);
          const aCost = addon.ingredient
            ? Number(addon.ingredient.currentCostPerBaseUnit) * aQty
            : 0;

          addonsPriceTotal += aPrice;
          addonsCostTotal += aCost;
          selectedAddonsSnapshot.push({
            id: addon.id,
            name: addon.name,
            price: aPrice,
            ingredientId: addon.ingredientId,
            ingredientName: addon.ingredient?.name,
            quantity: aQty,
            unitSymbol: addon.ingredient?.baseUnit?.symbol || addon.unit?.symbol || 'g',
            costAtSale: Number(aCost.toFixed(4)),
          });
        }
      }

      const unitPrice = Number(mi.price) + addonsPriceTotal;
      const tipPerItem = Number((cartItem as any).tip || 0);
      const lineSubtotal = unitPrice * cartItem.quantity;
      const lineTip = tipPerItem * cartItem.quantity;
      subtotal += lineSubtotal;
      totalTip += lineTip;

      // Calculate cost at sale (base recipe + addon ingredients)
      let costPerPortion = 0;
      if (mi.isDirectSale && mi.directIngredient) {
        costPerPortion = Number(mi.directIngredient.currentCostPerBaseUnit);
      } else if (mi.recipe) {
        for (const ri of mi.recipe.ingredients) {
          costPerPortion += Number(ri.ingredient.currentCostPerBaseUnit) * Number(ri.quantity);
        }
      }
      costPerPortion += addonsCostTotal;

      return {
        menuItemId: mi.id,
        quantity: cartItem.quantity,
        unitPrice: unitPrice,
        tip: tipPerItem,
        subtotal: lineSubtotal,
        specialInstructions: cartItem.specialInstructions,
        status: ItemPrepStatus.PENDING,
        costAtSale: Number(costPerPortion.toFixed(4)),
        selectedAddons: selectedAddonsSnapshot.length > 0 ? selectedAddonsSnapshot : undefined,
      };
    });

    // Ensure valid user foreign keys
    let waiter = await this.prisma.user.findUnique({ where: { id: data.waiterId } });
    if (!waiter) {
      waiter = await this.prisma.user.findFirst({ where: { role: 'WAITER', isActive: true } });
    }
    const cashier = await this.prisma.user.findFirst({
      where: { role: 'CASHIER', isActive: true },
    });

    const tax = subtotal * 0.15; // 15% Ethiopian VAT
    const totalAmount = subtotal + totalTip + tax;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        orderType: data.orderType || OrderType.DINE_IN,
        tableId: data.tableId || null,
        customerName: data.customerName || 'Guest',
        waiterId: waiter ? waiter.id : null,
        cashierId: cashier ? cashier.id : waiter?.id || '',
        status: OrderStatus.DRAFT_NOTE,
        subtotal,
        tip: totalTip,
        tax,
        totalAmount,
        paymentStatus: PaymentStatus.UNPAID,
        items: {
          create: orderItemsCreate,
        },
      },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });

    // Broadcast live event to Cashier screen!
    this.eventsGateway.broadcastWaiterNote(order);
    return order;
  }

  // 2. Cashier Confirms & Fires Order to Kitchen (or direct POS entry)
  async confirmOrder(orderId: string, cashierId: string) {
    let validCashier = await this.prisma.user.findUnique({ where: { id: cashierId } });
    if (!validCashier) {
      validCashier = await this.prisma.user.findFirst({ where: { role: 'CASHIER', isActive: true } });
    }
    const resolvedCashierId = validCashier ? validCashier.id : cashierId;

    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: { directIngredient: true },
            },
          },
        },
      },
    });

    if (!existing) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        cashierId: resolvedCashierId,
        status: OrderStatus.CONFIRMED,
      },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });

    // Deduct direct retail items right away if any
    const kitchenStore = await this.prisma.inventoryLocation.findUnique({
      where: { type: LocationType.KITCHEN_STORE },
    });

    if (kitchenStore) {
      for (const itm of existing.items) {
        if (itm.menuItem.isDirectSale && itm.menuItem.directIngredientId) {
          const qty = itm.quantity;
          const ingId = itm.menuItem.directIngredientId;
          const unitCost = itm.menuItem.directIngredient?.currentCostPerBaseUnit || 0;

          await this.prisma.$transaction(async (tx) => {
            await tx.inventoryBalance.updateMany({
              where: { locationId: kitchenStore.id, ingredientId: ingId },
              data: { quantity: { decrement: qty } },
            });

            await tx.inventoryTransaction.create({
              data: {
                transactionType: InventoryTransactionType.DIRECT_SALE_DEDUCT,
                sourceLocationId: kitchenStore.id,
                ingredientId: ingId,
                quantity: qty,
                unitCost,
                totalCost: new Prisma.Decimal(qty).mul(unitCost),
                referenceId: updated.orderNumber,
                reason: `Direct sale: ${itm.menuItem.name} x${qty}`,
                userId: resolvedCashierId,
              },
            });
          });
        }
      }
    }

    // Broadcast to Kitchen Display System (KDS) & update table status if dine-in
    if (updated.tableId) {
      await this.prisma.diningTable.update({
        where: { id: updated.tableId },
        data: { status: TableStatus.OCCUPIED },
      });
      const allTables = await this.prisma.diningTable.findMany({
        orderBy: { tableNumber: 'asc' },
        include: {
          orders: {
            where: { status: { in: ['CONFIRMED', 'IN_PREPARATION', 'READY', 'SERVED'] } },
            select: { id: true, orderNumber: true, totalAmount: true, status: true },
          },
        },
      });
      this.eventsGateway.broadcastTablesUpdated(allTables);
    }

    this.eventsGateway.broadcastOrderConfirmed(updated);
    this.eventsGateway.broadcastOrderUpdated(updated);
    return updated;
  }

  // 3. Direct POS Order Entry by Cashier (Walk-in / Dine-in / Takeaway)
  async createPosOrder(data: {
    cashierId: string;
    tableId?: string;
    customerName?: string;
    waiterId?: string;
    orderType: OrderType;
    items: {
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
    }[];
  }) {
    // If dine-in on an occupied table with an active open bill, append to that single order!
    if (data.tableId && data.orderType === OrderType.DINE_IN) {
      const activeOrder = await this.prisma.order.findFirst({
        where: {
          tableId: data.tableId,
          paymentStatus: { not: PaymentStatus.PAID },
          status: {
            in: [
              OrderStatus.CONFIRMED,
              OrderStatus.IN_PREPARATION,
              OrderStatus.READY,
              OrderStatus.SERVED,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (activeOrder) {
        return this.appendItemsToOrder(activeOrder.id, {
          cashierId: data.cashierId,
          items: data.items,
        });
      }
    }

    const draft = await this.createWaiterDraftNote({
      tableId: data.tableId,
      customerName: data.customerName,
      waiterId: data.waiterId || data.cashierId,
      orderType: data.orderType,
      items: data.items,
    });

    return this.confirmOrder(draft.id, data.cashierId);
  }

  // 4. Update Kitchen Preparation Status (KDS)
  async updateOrderStatus(orderId: string, status: OrderStatus, actorUserId?: string) {
    let validUser = null;
    if (actorUserId) {
      validUser = await this.prisma.user.findUnique({ where: { id: actorUserId } });
    }
    if (!validUser) {
      validUser = await this.prisma.user.findFirst({
        where: {
          role: { in: ['HEAD_CHEF', 'KITCHEN_STAFF', 'MANAGER', 'OWNER'] },
          isActive: true,
        },
      });
    }
    const resolvedUserId = validUser ? validUser.id : (actorUserId || '');
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipe: {
                  include: {
                    ingredients: {
                      include: { ingredient: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    // If order reaches READY or COMPLETED and hasn't had recipe ingredients deducted yet,
    // deduct actual recipe ingredients from Kitchen Store!
    if (
      (status === OrderStatus.READY || status === OrderStatus.SERVED || status === OrderStatus.COMPLETED) &&
      order.status !== OrderStatus.READY &&
      order.status !== OrderStatus.SERVED &&
      order.status !== OrderStatus.COMPLETED
    ) {
      const kitchenStore = await this.prisma.inventoryLocation.findUnique({
        where: { type: LocationType.KITCHEN_STORE },
      });

      if (kitchenStore) {
        await this.prisma.$transaction(async (tx) => {
          for (const itm of order.items) {
            // Recipe-based meal production deduction
            if (!itm.menuItem.isDirectSale && itm.menuItem.recipe) {
              const portionQty = itm.quantity;

              for (const ri of itm.menuItem.recipe.ingredients) {
                const totalGramsNeeded = Number(ri.quantity) * portionQty;
                const unitCost = ri.ingredient.currentCostPerBaseUnit;

                // Deduct from Kitchen Store balance
                await tx.inventoryBalance.updateMany({
                  where: {
                    locationId: kitchenStore.id,
                    ingredientId: ri.ingredientId,
                  },
                  data: { quantity: { decrement: totalGramsNeeded } },
                });

                // Record in immutable transaction ledger
                await tx.inventoryTransaction.create({
                  data: {
                    transactionType: InventoryTransactionType.PRODUCTION_CONSUMPTION,
                    sourceLocationId: kitchenStore.id,
                    ingredientId: ri.ingredientId,
                    quantity: totalGramsNeeded,
                    unitCost,
                    totalCost: new Prisma.Decimal(totalGramsNeeded).mul(unitCost),
                    referenceId: order.orderNumber,
                    reason: `Kitchen Production for Order ${order.orderNumber}: ${itm.menuItem.name} x${portionQty}`,
                    userId: resolvedUserId,
                  },
                });
              }
            } else if (itm.menuItem.isDirectSale && itm.menuItem.directIngredientId) {
              // Direct beverage / retail stock deduction from Kitchen Store
              const directQty = itm.quantity;
              const directIng = await tx.ingredient.findUnique({
                where: { id: itm.menuItem.directIngredientId },
              });

              if (directIng) {
                await tx.inventoryBalance.updateMany({
                  where: {
                    locationId: kitchenStore.id,
                    ingredientId: itm.menuItem.directIngredientId,
                  },
                  data: { quantity: { decrement: directQty } },
                });

                await tx.inventoryTransaction.create({
                  data: {
                    transactionType: InventoryTransactionType.DIRECT_SALE_DEDUCT,
                    sourceLocationId: kitchenStore.id,
                    ingredientId: itm.menuItem.directIngredientId,
                    quantity: directQty,
                    unitCost: directIng.currentCostPerBaseUnit,
                    totalCost: new Prisma.Decimal(directQty).mul(directIng.currentCostPerBaseUnit),
                    referenceId: order.orderNumber,
                    reason: `Direct Retail Sale for Order ${order.orderNumber}: ${itm.menuItem.name} x${directQty}`,
                    userId: resolvedUserId,
                  },
                });
              }
            }

            // Real Add-on ingredient stock deduction from Kitchen Store
            const itmAddons = (itm.selectedAddons as any[]) || [];
            if (Array.isArray(itmAddons) && itmAddons.length > 0) {
              const portionQty = itm.quantity;
              for (const addon of itmAddons) {
                if (addon.ingredientId && Number(addon.quantity) > 0) {
                  const totalAddonGrams = Number(addon.quantity) * portionQty;
                  const addonIng = await tx.ingredient.findUnique({
                    where: { id: addon.ingredientId },
                  });
                  const unitCost = addonIng ? addonIng.currentCostPerBaseUnit : new Prisma.Decimal(0);

                  // Deduct from Kitchen Store balance
                  await tx.inventoryBalance.updateMany({
                    where: {
                      locationId: kitchenStore.id,
                      ingredientId: addon.ingredientId,
                    },
                    data: { quantity: { decrement: totalAddonGrams } },
                  });

                  // Record in immutable transaction ledger
                  await tx.inventoryTransaction.create({
                    data: {
                      transactionType: InventoryTransactionType.PRODUCTION_CONSUMPTION,
                      sourceLocationId: kitchenStore.id,
                      ingredientId: addon.ingredientId,
                      quantity: totalAddonGrams,
                      unitCost,
                      totalCost: new Prisma.Decimal(totalAddonGrams).mul(unitCost),
                      referenceId: order.orderNumber,
                      reason: `Add-on Production for Order ${order.orderNumber}: ${addon.name} for ${itm.menuItem.name} x${portionQty}`,
                      userId: resolvedUserId,
                    },
                  });
                }
              }
            }
          }
        });
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });

    this.eventsGateway.broadcastOrderStatus(updated);
    return updated;
  }

  // 5. Process Payment (Split payment, Cash, Card, Mobile Pay)
  async recordPayment(orderId: string, data: {
    amount: number;
    paymentMethod: PaymentMethod;
    transactionRef?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef,
      },
    });

    const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0) + data.amount;
    const isFullyPaid = totalPaid >= Number(order.totalAmount);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID,
        status: isFullyPaid ? OrderStatus.COMPLETED : order.status,
      },
      include: {
        payments: true,
        table: true,
        cashier: { select: { id: true, name: true } },
        waiter: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });

    if (isFullyPaid && updatedOrder.tableId) {
      // Clear the table seat immediately upon bill settlement
      await this.prisma.diningTable.update({
        where: { id: updatedOrder.tableId },
        data: { status: TableStatus.AVAILABLE },
      });

      const allTables = await this.prisma.diningTable.findMany({
        orderBy: { tableNumber: 'asc' },
        include: {
          orders: {
            where: { status: { in: ['CONFIRMED', 'IN_PREPARATION', 'READY', 'SERVED'] } },
            select: { id: true, orderNumber: true, totalAmount: true, status: true },
          },
        },
      });
      this.eventsGateway.broadcastTablesUpdated(allTables);
    }

    this.eventsGateway.broadcastOrderUpdated(updatedOrder);
    return { payment, order: updatedOrder };
  }

  // 5b. Append additional items to an existing open order (e.g. extra drinks/food rounds)
  async appendItemsToOrder(
    orderId: string,
    data: {
      cashierId?: string;
      items: {
        menuItemId: string;
        quantity: number;
        specialInstructions?: string;
        selectedAddonIds?: string[];
        selectedAddons?: any[];
      }[];
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Cannot append items to an already settled order.');
    }

    const itemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        recipe: { include: { ingredients: { include: { ingredient: true } } } },
        directIngredient: true,
      },
    });

    // Fetch referenced addons
    const allAddonIds: string[] = [];
    for (const itm of data.items) {
      if (Array.isArray(itm.selectedAddonIds)) {
        allAddonIds.push(...itm.selectedAddonIds);
      }
      if (Array.isArray(itm.selectedAddons)) {
        for (const a of itm.selectedAddons) {
          if (a?.id) allAddonIds.push(a.id);
        }
      }
    }
    const dbAddons = allAddonIds.length > 0
      ? await this.prisma.menuItemAddon.findMany({
          where: { id: { in: Array.from(new Set(allAddonIds)) } },
          include: { ingredient: { include: { baseUnit: true } }, unit: true },
        })
      : [];

    let addedSubtotal = 0;
    let addedTip = 0;
    for (const cartItem of data.items) {
      const mi = menuItems.find((m) => m.id === cartItem.menuItemId);
      if (!mi) continue;

      // Resolve selected addons
      const selectedAddonsSnapshot: any[] = [];
      let addonsPriceTotal = 0;
      let addonsCostTotal = 0;

      const itemAddonIds = [
        ...(cartItem.selectedAddonIds || []),
        ...(cartItem.selectedAddons?.map((a: any) => a.id) || []),
      ];
      const uniqueAddonIds = Array.from(new Set(itemAddonIds.filter(Boolean)));

      for (const addonId of uniqueAddonIds) {
        const addon = dbAddons.find((a) => a.id === addonId);
        if (addon) {
          const aPrice = Number(addon.price);
          const aQty = Number(addon.quantity || 0);
          const aCost = addon.ingredient
            ? Number(addon.ingredient.currentCostPerBaseUnit) * aQty
            : 0;

          addonsPriceTotal += aPrice;
          addonsCostTotal += aCost;
          selectedAddonsSnapshot.push({
            id: addon.id,
            name: addon.name,
            price: aPrice,
            ingredientId: addon.ingredientId,
            ingredientName: addon.ingredient?.name,
            quantity: aQty,
            unitSymbol: addon.ingredient?.baseUnit?.symbol || addon.unit?.symbol || 'g',
            costAtSale: Number(aCost.toFixed(4)),
          });
        }
      }

      const unitPrice = Number(mi.price) + addonsPriceTotal;
      const tipPerItem = Number((cartItem as any).tip || 0);
      const lineSubtotal = unitPrice * cartItem.quantity;
      const lineTip = tipPerItem * cartItem.quantity;
      addedSubtotal += lineSubtotal;
      addedTip += lineTip;

      let costPerPortion = 0;
      if (mi.isDirectSale && mi.directIngredient) {
        costPerPortion = Number(mi.directIngredient.currentCostPerBaseUnit);
      } else if (mi.recipe) {
        for (const ri of mi.recipe.ingredients) {
          costPerPortion += Number(ri.ingredient.currentCostPerBaseUnit) * Number(ri.quantity);
        }
      }
      costPerPortion += addonsCostTotal;

      await this.prisma.orderItem.create({
        data: {
          orderId,
          menuItemId: mi.id,
          quantity: cartItem.quantity,
          unitPrice: unitPrice,
          tip: tipPerItem,
          subtotal: lineSubtotal,
          specialInstructions: cartItem.specialInstructions,
          status: ItemPrepStatus.PENDING,
          costAtSale: Number(costPerPortion.toFixed(4)),
          selectedAddons: selectedAddonsSnapshot.length > 0 ? selectedAddonsSnapshot : undefined,
        },
      });
    }

    // Deduct direct retail items right away if any
    const kitchenStore = await this.prisma.inventoryLocation.findUnique({
      where: { type: LocationType.KITCHEN_STORE },
    });

    if (kitchenStore) {
      for (const cartItem of data.items) {
        const mi = menuItems.find((m) => m.id === cartItem.menuItemId);
        if (mi?.isDirectSale && mi.directIngredientId) {
          const qty = cartItem.quantity;
          const ingId = mi.directIngredientId;
          const unitCost = mi.directIngredient?.currentCostPerBaseUnit || 0;

          await this.prisma.$transaction(async (tx) => {
            await tx.inventoryBalance.updateMany({
              where: { locationId: kitchenStore.id, ingredientId: ingId },
              data: { quantity: { decrement: qty } },
            });

            await tx.inventoryTransaction.create({
              data: {
                transactionType: InventoryTransactionType.DIRECT_SALE_DEDUCT,
                sourceLocationId: kitchenStore.id,
                ingredientId: ingId,
                quantity: qty,
                unitCost,
                totalCost: new Prisma.Decimal(qty).mul(unitCost),
                referenceId: order.orderNumber,
                reason: `Direct sale item appended to ${order.orderNumber}: ${mi.name} x${qty}`,
                userId: data.cashierId || order.cashierId,
              },
            });
          });
        }
      }
    }

    const newSubtotal = Number(order.subtotal) + addedSubtotal;
    const newTip = Number((order as any).tip || 0) + addedTip;
    const newTax = newSubtotal * 0.15;
    const newTotal = newSubtotal + newTip - Number(order.discount || 0) + newTax;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        tip: newTip,
        tax: newTax,
        totalAmount: newTotal,
        status: OrderStatus.CONFIRMED,
      },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
        payments: true,
      },
    });

    this.eventsGateway.broadcastOrderConfirmed(updated);
    this.eventsGateway.broadcastOrderUpdated(updated);
    return updated;
  }

  // 6. Get Active Orders (Filterable by status e.g. for KDS or Cashier)
  async getOrders(params?: {
    statuses?: OrderStatus[];
    tableId?: string;
    waiterId?: string;
    limit?: number;
  }) {
    return this.prisma.order.findMany({
      where: {
        ...(params?.statuses ? { status: { in: params.statuses } } : {}),
        ...(params?.tableId ? { tableId: params.tableId } : {}),
        ...(params?.waiterId ? { waiterId: params.waiterId } : {}),
      },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 100,
    });
  }

  // 7. Get Waiter Draft Slips for Cashier Screen
  async getWaiterDraftSlips() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.DRAFT_NOTE },
      include: {
        table: true,
        waiter: { select: { id: true, name: true, avatarUrl: true } },
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
