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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const shared_types_1 = require("@cafe/shared-types");
const client_1 = require("@prisma/client");
let OrdersService = class OrdersService {
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async createWaiterDraftNote(data) {
        if (data.tableId && data.orderType !== shared_types_1.OrderType.TAKEAWAY) {
            const activeUnsettledOrder = await this.prisma.order.findFirst({
                where: {
                    tableId: data.tableId,
                    paymentStatus: { not: shared_types_1.PaymentStatus.PAID },
                    status: { in: [shared_types_1.OrderStatus.CONFIRMED, shared_types_1.OrderStatus.IN_PREPARATION, shared_types_1.OrderStatus.READY, shared_types_1.OrderStatus.SERVED] },
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
        const allOrders = await this.prisma.order.findMany({ select: { orderNumber: true } });
        const maxNum = allOrders.reduce((max, o) => {
            const parsed = parseInt(o.orderNumber.replace(/\D/g, ''), 10);
            return !isNaN(parsed) && parsed > max ? parsed : max;
        }, 27000);
        const orderNumber = `#${maxNum + 1}`;
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
        const allAddonIds = [];
        for (const itm of data.items) {
            if (Array.isArray(itm.selectedAddonIds)) {
                allAddonIds.push(...itm.selectedAddonIds);
            }
            if (Array.isArray(itm.selectedAddons)) {
                for (const a of itm.selectedAddons) {
                    if (a?.id)
                        allAddonIds.push(a.id);
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
            if (!mi)
                throw new common_1.NotFoundException(`Item not found`);
            const selectedAddonsSnapshot = [];
            let addonsPriceTotal = 0;
            let addonsCostTotal = 0;
            const itemAddonIds = [
                ...(cartItem.selectedAddonIds || []),
                ...(cartItem.selectedAddons?.map((a) => a.id) || []),
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
            const tipPerItem = Number(cartItem.tip || 0);
            const lineSubtotal = unitPrice * cartItem.quantity;
            const lineTip = tipPerItem * cartItem.quantity;
            subtotal += lineSubtotal;
            totalTip += lineTip;
            let costPerPortion = 0;
            if (mi.isDirectSale && mi.directIngredient) {
                costPerPortion = Number(mi.directIngredient.currentCostPerBaseUnit);
            }
            else if (mi.recipe) {
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
                status: shared_types_1.ItemPrepStatus.PENDING,
                costAtSale: Number(costPerPortion.toFixed(4)),
                selectedAddons: selectedAddonsSnapshot.length > 0 ? selectedAddonsSnapshot : undefined,
            };
        });
        let waiter = await this.prisma.user.findUnique({ where: { id: data.waiterId } });
        if (!waiter) {
            waiter = await this.prisma.user.findFirst({ where: { role: 'WAITER', isActive: true } });
        }
        const cashier = await this.prisma.user.findFirst({
            where: { role: 'CASHIER', isActive: true },
        });
        const tax = subtotal * 0.15;
        const totalAmount = subtotal + totalTip + tax;
        const order = await this.prisma.order.create({
            data: {
                orderNumber,
                orderType: data.orderType || shared_types_1.OrderType.DINE_IN,
                tableId: data.tableId || null,
                customerName: data.customerName || 'Guest',
                waiterId: waiter ? waiter.id : null,
                cashierId: cashier ? cashier.id : waiter?.id || '',
                status: shared_types_1.OrderStatus.DRAFT_NOTE,
                subtotal,
                tip: totalTip,
                tax,
                totalAmount,
                paymentStatus: shared_types_1.PaymentStatus.UNPAID,
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
        this.eventsGateway.broadcastWaiterNote(order);
        return order;
    }
    async confirmOrder(orderId, cashierId) {
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
        if (!existing)
            throw new common_1.NotFoundException('Order not found');
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                cashierId: resolvedCashierId,
                status: shared_types_1.OrderStatus.CONFIRMED,
            },
            include: {
                table: true,
                waiter: { select: { id: true, name: true } },
                cashier: { select: { id: true, name: true } },
                items: { include: { menuItem: true } },
            },
        });
        const kitchenStore = await this.prisma.inventoryLocation.findUnique({
            where: { type: shared_types_1.LocationType.KITCHEN_STORE },
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
                                transactionType: shared_types_1.InventoryTransactionType.DIRECT_SALE_DEDUCT,
                                sourceLocationId: kitchenStore.id,
                                ingredientId: ingId,
                                quantity: qty,
                                unitCost,
                                totalCost: new client_1.Prisma.Decimal(qty).mul(unitCost),
                                referenceId: updated.orderNumber,
                                reason: `Direct sale: ${itm.menuItem.name} x${qty}`,
                                userId: resolvedCashierId,
                            },
                        });
                    });
                }
            }
        }
        if (updated.tableId) {
            await this.prisma.diningTable.update({
                where: { id: updated.tableId },
                data: { status: client_1.TableStatus.OCCUPIED },
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
    async createPosOrder(data) {
        if (data.tableId && data.orderType === shared_types_1.OrderType.DINE_IN) {
            const activeOrder = await this.prisma.order.findFirst({
                where: {
                    tableId: data.tableId,
                    paymentStatus: { not: shared_types_1.PaymentStatus.PAID },
                    status: {
                        in: [
                            shared_types_1.OrderStatus.CONFIRMED,
                            shared_types_1.OrderStatus.IN_PREPARATION,
                            shared_types_1.OrderStatus.READY,
                            shared_types_1.OrderStatus.SERVED,
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
    async updateOrderStatus(orderId, status, actorUserId) {
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
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if ((status === shared_types_1.OrderStatus.READY || status === shared_types_1.OrderStatus.SERVED || status === shared_types_1.OrderStatus.COMPLETED) &&
            order.status !== shared_types_1.OrderStatus.READY &&
            order.status !== shared_types_1.OrderStatus.SERVED &&
            order.status !== shared_types_1.OrderStatus.COMPLETED) {
            const kitchenStore = await this.prisma.inventoryLocation.findUnique({
                where: { type: shared_types_1.LocationType.KITCHEN_STORE },
            });
            if (kitchenStore) {
                await this.prisma.$transaction(async (tx) => {
                    for (const itm of order.items) {
                        if (!itm.menuItem.isDirectSale && itm.menuItem.recipe) {
                            const portionQty = itm.quantity;
                            for (const ri of itm.menuItem.recipe.ingredients) {
                                const totalGramsNeeded = Number(ri.quantity) * portionQty;
                                const unitCost = ri.ingredient.currentCostPerBaseUnit;
                                await tx.inventoryBalance.updateMany({
                                    where: {
                                        locationId: kitchenStore.id,
                                        ingredientId: ri.ingredientId,
                                    },
                                    data: { quantity: { decrement: totalGramsNeeded } },
                                });
                                await tx.inventoryTransaction.create({
                                    data: {
                                        transactionType: shared_types_1.InventoryTransactionType.PRODUCTION_CONSUMPTION,
                                        sourceLocationId: kitchenStore.id,
                                        ingredientId: ri.ingredientId,
                                        quantity: totalGramsNeeded,
                                        unitCost,
                                        totalCost: new client_1.Prisma.Decimal(totalGramsNeeded).mul(unitCost),
                                        referenceId: order.orderNumber,
                                        reason: `Kitchen Production for Order ${order.orderNumber}: ${itm.menuItem.name} x${portionQty}`,
                                        userId: resolvedUserId,
                                    },
                                });
                            }
                        }
                        else if (itm.menuItem.isDirectSale && itm.menuItem.directIngredientId) {
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
                                        transactionType: shared_types_1.InventoryTransactionType.DIRECT_SALE_DEDUCT,
                                        sourceLocationId: kitchenStore.id,
                                        ingredientId: itm.menuItem.directIngredientId,
                                        quantity: directQty,
                                        unitCost: directIng.currentCostPerBaseUnit,
                                        totalCost: new client_1.Prisma.Decimal(directQty).mul(directIng.currentCostPerBaseUnit),
                                        referenceId: order.orderNumber,
                                        reason: `Direct Retail Sale for Order ${order.orderNumber}: ${itm.menuItem.name} x${directQty}`,
                                        userId: resolvedUserId,
                                    },
                                });
                            }
                        }
                        const itmAddons = itm.selectedAddons || [];
                        if (Array.isArray(itmAddons) && itmAddons.length > 0) {
                            const portionQty = itm.quantity;
                            for (const addon of itmAddons) {
                                if (addon.ingredientId && Number(addon.quantity) > 0) {
                                    const totalAddonGrams = Number(addon.quantity) * portionQty;
                                    const addonIng = await tx.ingredient.findUnique({
                                        where: { id: addon.ingredientId },
                                    });
                                    const unitCost = addonIng ? addonIng.currentCostPerBaseUnit : new client_1.Prisma.Decimal(0);
                                    await tx.inventoryBalance.updateMany({
                                        where: {
                                            locationId: kitchenStore.id,
                                            ingredientId: addon.ingredientId,
                                        },
                                        data: { quantity: { decrement: totalAddonGrams } },
                                    });
                                    await tx.inventoryTransaction.create({
                                        data: {
                                            transactionType: shared_types_1.InventoryTransactionType.PRODUCTION_CONSUMPTION,
                                            sourceLocationId: kitchenStore.id,
                                            ingredientId: addon.ingredientId,
                                            quantity: totalAddonGrams,
                                            unitCost,
                                            totalCost: new client_1.Prisma.Decimal(totalAddonGrams).mul(unitCost),
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
    async recordPayment(orderId, data) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payments: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
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
                paymentStatus: isFullyPaid ? shared_types_1.PaymentStatus.PAID : shared_types_1.PaymentStatus.PARTIALLY_PAID,
                status: isFullyPaid ? shared_types_1.OrderStatus.COMPLETED : order.status,
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
            await this.prisma.diningTable.update({
                where: { id: updatedOrder.tableId },
                data: { status: client_1.TableStatus.AVAILABLE },
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
    async appendItemsToOrder(orderId, data) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.paymentStatus === shared_types_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Cannot append items to an already settled order.');
        }
        const itemIds = data.items.map((i) => i.menuItemId);
        const menuItems = await this.prisma.menuItem.findMany({
            where: { id: { in: itemIds } },
            include: {
                recipe: { include: { ingredients: { include: { ingredient: true } } } },
                directIngredient: true,
            },
        });
        const allAddonIds = [];
        for (const itm of data.items) {
            if (Array.isArray(itm.selectedAddonIds)) {
                allAddonIds.push(...itm.selectedAddonIds);
            }
            if (Array.isArray(itm.selectedAddons)) {
                for (const a of itm.selectedAddons) {
                    if (a?.id)
                        allAddonIds.push(a.id);
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
            if (!mi)
                continue;
            const selectedAddonsSnapshot = [];
            let addonsPriceTotal = 0;
            let addonsCostTotal = 0;
            const itemAddonIds = [
                ...(cartItem.selectedAddonIds || []),
                ...(cartItem.selectedAddons?.map((a) => a.id) || []),
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
            const tipPerItem = Number(cartItem.tip || 0);
            const lineSubtotal = unitPrice * cartItem.quantity;
            const lineTip = tipPerItem * cartItem.quantity;
            addedSubtotal += lineSubtotal;
            addedTip += lineTip;
            let costPerPortion = 0;
            if (mi.isDirectSale && mi.directIngredient) {
                costPerPortion = Number(mi.directIngredient.currentCostPerBaseUnit);
            }
            else if (mi.recipe) {
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
                    status: shared_types_1.ItemPrepStatus.PENDING,
                    costAtSale: Number(costPerPortion.toFixed(4)),
                    selectedAddons: selectedAddonsSnapshot.length > 0 ? selectedAddonsSnapshot : undefined,
                },
            });
        }
        const kitchenStore = await this.prisma.inventoryLocation.findUnique({
            where: { type: shared_types_1.LocationType.KITCHEN_STORE },
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
                                transactionType: shared_types_1.InventoryTransactionType.DIRECT_SALE_DEDUCT,
                                sourceLocationId: kitchenStore.id,
                                ingredientId: ingId,
                                quantity: qty,
                                unitCost,
                                totalCost: new client_1.Prisma.Decimal(qty).mul(unitCost),
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
        const newTip = Number(order.tip || 0) + addedTip;
        const newTax = newSubtotal * 0.15;
        const newTotal = newSubtotal + newTip - Number(order.discount || 0) + newTax;
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                subtotal: newSubtotal,
                tip: newTip,
                tax: newTax,
                totalAmount: newTotal,
                status: shared_types_1.OrderStatus.CONFIRMED,
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
    async getOrders(params) {
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
    async getWaiterDraftSlips() {
        return this.prisma.order.findMany({
            where: { status: shared_types_1.OrderStatus.DRAFT_NOTE },
            include: {
                table: true,
                waiter: { select: { id: true, name: true, avatarUrl: true } },
                items: { include: { menuItem: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map