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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const shared_types_1 = require("@cafe/shared-types");
const events_gateway_1 = require("../events/events.gateway");
const client_1 = require("@prisma/client");
let InventoryService = class InventoryService {
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async getStockBalances(locationType) {
        const locations = await this.prisma.inventoryLocation.findMany({
            where: locationType ? { type: locationType } : {},
            include: {
                balances: {
                    include: {
                        ingredient: {
                            include: { baseUnit: true },
                        },
                    },
                    orderBy: { ingredient: { name: 'asc' } },
                },
            },
        });
        return locations;
    }
    async getLowStockAlerts(locationType) {
        const balances = await this.prisma.inventoryBalance.findMany({
            where: locationType ? { location: { type: locationType } } : {},
            include: {
                location: true,
                ingredient: { include: { baseUnit: true } },
            },
        });
        return balances.filter((b) => {
            const currentQty = Number(b.quantity);
            if (b.location.type === shared_types_1.LocationType.MAIN_STORE) {
                return currentQty <= Number(b.ingredient.reorderThresholdMain);
            }
            else {
                return currentQty <= Number(b.ingredient.reorderThresholdKitchen);
            }
        });
    }
    async requestTransfer(requestedById, items, notes) {
        const mainStore = await this.prisma.inventoryLocation.findUnique({
            where: { type: shared_types_1.LocationType.MAIN_STORE },
        });
        const kitchenStore = await this.prisma.inventoryLocation.findUnique({
            where: { type: shared_types_1.LocationType.KITCHEN_STORE },
        });
        if (!mainStore || !kitchenStore) {
            throw new common_1.BadRequestException('Store locations not configured');
        }
        const transferCount = await this.prisma.stockTransfer.count();
        const transferNumber = `TR-${String(transferCount + 1).padStart(5, '0')}`;
        let user = await this.prisma.user.findUnique({ where: { id: requestedById } });
        if (!user) {
            user = await this.prisma.user.findFirst({ where: { role: 'KITCHEN_STOREKEEPER', isActive: true } });
        }
        const resolvedUserId = user ? user.id : requestedById;
        const transfer = await this.prisma.stockTransfer.create({
            data: {
                transferNumber,
                sourceLocationId: mainStore.id,
                destLocationId: kitchenStore.id,
                status: shared_types_1.TransferStatus.REQUESTED,
                requestedById: resolvedUserId,
                notes,
                items: {
                    create: items.map((i) => ({
                        ingredientId: i.ingredientId,
                        requestedQty: i.requestedQty,
                        unitId: i.unitId,
                    })),
                },
            },
            include: {
                items: { include: { ingredient: true, unit: true } },
                requestedBy: { select: { id: true, name: true } },
            },
        });
        this.eventsGateway.broadcastTransferUpdated(transfer);
        return transfer;
    }
    async dispatchTransfer(transferId, approvedById, dispatchedItems) {
        let approver = await this.prisma.user.findUnique({ where: { id: approvedById } });
        if (!approver) {
            approver = await this.prisma.user.findFirst({ where: { role: 'MAIN_STOREKEEPER', isActive: true } });
        }
        const resolvedApproverId = approver ? approver.id : approvedById;
        return this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({
                where: { id: transferId },
                include: { items: { include: { ingredient: true } }, sourceLocation: true },
            });
            if (!transfer || transfer.status !== shared_types_1.TransferStatus.REQUESTED) {
                throw new common_1.BadRequestException('Transfer cannot be dispatched in current state');
            }
            for (const item of transfer.items) {
                const dispatchSpec = dispatchedItems.find((d) => d.itemId === item.id);
                const qtyToDispatch = dispatchSpec ? dispatchSpec.dispatchedQty : Number(item.requestedQty);
                const balance = await tx.inventoryBalance.findUnique({
                    where: {
                        locationId_ingredientId: {
                            locationId: transfer.sourceLocationId,
                            ingredientId: item.ingredientId,
                        },
                    },
                });
                if (!balance || Number(balance.quantity) < qtyToDispatch) {
                    throw new common_1.BadRequestException(`Insufficient Main Store balance for ${item.ingredient.name}. Available: ${balance?.quantity || 0}`);
                }
                await tx.inventoryBalance.update({
                    where: { id: balance.id },
                    data: { quantity: { decrement: qtyToDispatch } },
                });
                await tx.stockTransferItem.update({
                    where: { id: item.id },
                    data: { dispatchedQty: qtyToDispatch },
                });
                const unitCost = item.ingredient.currentCostPerBaseUnit;
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: shared_types_1.InventoryTransactionType.TRANSFER_DISPATCH,
                        sourceLocationId: transfer.sourceLocationId,
                        destLocationId: transfer.destLocationId,
                        ingredientId: item.ingredientId,
                        quantity: qtyToDispatch,
                        unitCost,
                        totalCost: new client_1.Prisma.Decimal(qtyToDispatch).mul(unitCost),
                        referenceId: transfer.transferNumber,
                        reason: `Transfer to Kitchen Store: ${transfer.transferNumber}`,
                        userId: resolvedApproverId,
                    },
                });
            }
            const updated = await tx.stockTransfer.update({
                where: { id: transferId },
                data: {
                    status: shared_types_1.TransferStatus.DISPATCHED,
                    approvedById: resolvedApproverId,
                    dispatchedAt: new Date(),
                },
                include: {
                    items: { include: { ingredient: true, unit: true } },
                    approvedBy: { select: { id: true, name: true } },
                    requestedBy: { select: { id: true, name: true } },
                },
            });
            this.eventsGateway.broadcastTransferUpdated(updated);
            return updated;
        });
    }
    async receiveTransfer(transferId, receivedById, receivedItems) {
        let receiver = null;
        if (receivedById) {
            receiver = await this.prisma.user.findUnique({ where: { id: receivedById } });
        }
        if (!receiver) {
            receiver = await this.prisma.user.findFirst({
                where: {
                    role: { in: ['HEAD_CHEF', 'KITCHEN_STAFF', 'MAIN_STOREKEEPER'] },
                    isActive: true,
                },
            });
        }
        const resolvedReceiverId = receiver ? receiver.id : (receivedById || '');
        return this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({
                where: { id: transferId },
                include: { items: { include: { ingredient: true } }, destLocation: true },
            });
            if (!transfer || transfer.status !== shared_types_1.TransferStatus.DISPATCHED) {
                throw new common_1.BadRequestException('Transfer is not in dispatched state');
            }
            for (const item of transfer.items) {
                const receiveSpec = receivedItems?.find((r) => r.itemId === item.id || r.ingredientId === item.ingredientId);
                const qtyReceived = receiveSpec
                    ? Number(receiveSpec.receivedQty)
                    : Number(item.dispatchedQty || item.requestedQty);
                await tx.inventoryBalance.upsert({
                    where: {
                        locationId_ingredientId: {
                            locationId: transfer.destLocationId,
                            ingredientId: item.ingredientId,
                        },
                    },
                    update: { quantity: { increment: qtyReceived } },
                    create: {
                        locationId: transfer.destLocationId,
                        ingredientId: item.ingredientId,
                        quantity: qtyReceived,
                    },
                });
                await tx.stockTransferItem.update({
                    where: { id: item.id },
                    data: { receivedQty: qtyReceived },
                });
                const unitCost = item.ingredient.currentCostPerBaseUnit;
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: shared_types_1.InventoryTransactionType.TRANSFER_RECEIVE,
                        sourceLocationId: transfer.sourceLocationId,
                        destLocationId: transfer.destLocationId,
                        ingredientId: item.ingredientId,
                        quantity: qtyReceived,
                        unitCost,
                        totalCost: new client_1.Prisma.Decimal(qtyReceived).mul(unitCost),
                        referenceId: transfer.transferNumber,
                        reason: `Received in Kitchen Store: ${transfer.transferNumber}`,
                        userId: resolvedReceiverId,
                    },
                });
            }
            const updated = await tx.stockTransfer.update({
                where: { id: transferId },
                data: {
                    status: shared_types_1.TransferStatus.RECEIVED,
                    receivedAt: new Date(),
                },
                include: {
                    items: { include: { ingredient: true, unit: true } },
                    approvedBy: { select: { id: true, name: true } },
                    requestedBy: { select: { id: true, name: true } },
                },
            });
            this.eventsGateway.broadcastTransferUpdated(updated);
            return updated;
        });
    }
    async rejectTransfer(transferId, rejectedById, reason) {
        let rejector = null;
        if (rejectedById) {
            rejector = await this.prisma.user.findUnique({ where: { id: rejectedById } });
        }
        if (!rejector) {
            rejector = await this.prisma.user.findFirst({
                where: {
                    role: { in: ['HEAD_CHEF', 'KITCHEN_STAFF', 'OWNER', 'MANAGER'] },
                    isActive: true,
                },
            });
        }
        const resolvedRejectorId = rejector ? rejector.id : (rejectedById || '');
        return this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({
                where: { id: transferId },
                include: { items: { include: { ingredient: true } }, sourceLocation: true },
            });
            if (!transfer || (transfer.status !== shared_types_1.TransferStatus.DISPATCHED && transfer.status !== shared_types_1.TransferStatus.REQUESTED)) {
                throw new common_1.BadRequestException('Transfer cannot be rejected in current state');
            }
            if (transfer.status === shared_types_1.TransferStatus.DISPATCHED) {
                for (const item of transfer.items) {
                    const qtyToRefund = Number(item.dispatchedQty || item.requestedQty);
                    await tx.inventoryBalance.upsert({
                        where: {
                            locationId_ingredientId: {
                                locationId: transfer.sourceLocationId,
                                ingredientId: item.ingredientId,
                            },
                        },
                        update: { quantity: { increment: qtyToRefund } },
                        create: {
                            locationId: transfer.sourceLocationId,
                            ingredientId: item.ingredientId,
                            quantity: qtyToRefund,
                        },
                    });
                    const unitCost = item.ingredient.currentCostPerBaseUnit;
                    await tx.inventoryTransaction.create({
                        data: {
                            transactionType: shared_types_1.InventoryTransactionType.TRANSFER_REJECT,
                            sourceLocationId: transfer.destLocationId,
                            destLocationId: transfer.sourceLocationId,
                            ingredientId: item.ingredientId,
                            quantity: qtyToRefund,
                            unitCost,
                            totalCost: new client_1.Prisma.Decimal(qtyToRefund).mul(unitCost),
                            referenceId: transfer.transferNumber,
                            reason: `Rejected by Kitchen Head: ${reason || 'Quantity or quality mismatch'}`,
                            userId: resolvedRejectorId,
                        },
                    });
                }
            }
            const updated = await tx.stockTransfer.update({
                where: { id: transferId },
                data: {
                    status: shared_types_1.TransferStatus.REJECTED,
                    notes: reason
                        ? `${transfer.notes ? transfer.notes + ' | ' : ''}[Rejected by Kitchen: ${reason}]`
                        : transfer.notes,
                },
                include: {
                    items: { include: { ingredient: true, unit: true } },
                    approvedBy: { select: { id: true, name: true } },
                    requestedBy: { select: { id: true, name: true } },
                },
            });
            this.eventsGateway.broadcastTransferUpdated(updated);
            return updated;
        });
    }
    async dispatchDirectBatch(senderId, items, notes) {
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('No items provided for dispatch');
        }
        const mainStore = await this.prisma.inventoryLocation.findUnique({
            where: { type: shared_types_1.LocationType.MAIN_STORE },
        });
        const kitchenStore = await this.prisma.inventoryLocation.findUnique({
            where: { type: shared_types_1.LocationType.KITCHEN_STORE },
        });
        if (!mainStore || !kitchenStore) {
            throw new common_1.BadRequestException('Main or Kitchen store location missing');
        }
        let sender = await this.prisma.user.findUnique({ where: { id: senderId } });
        if (!sender) {
            sender = await this.prisma.user.findFirst({
                where: { role: { in: ['MAIN_STOREKEEPER', 'OWNER', 'MANAGER'] }, isActive: true },
            });
        }
        const resolvedSenderId = sender ? sender.id : senderId;
        return this.prisma.$transaction(async (tx) => {
            const transferCount = await tx.stockTransfer.count();
            const transferNumber = `TR-${String(transferCount + 1).padStart(5, '0')}`;
            const transfer = await tx.stockTransfer.create({
                data: {
                    transferNumber,
                    sourceLocationId: mainStore.id,
                    destLocationId: kitchenStore.id,
                    status: shared_types_1.TransferStatus.DISPATCHED,
                    requestedById: resolvedSenderId,
                    approvedById: resolvedSenderId,
                    dispatchedAt: new Date(),
                    notes: notes || 'Direct Batch Delivery from Main Store',
                },
            });
            for (const item of items) {
                if (!item.quantity || item.quantity <= 0)
                    continue;
                const ingredient = await tx.ingredient.findUnique({
                    where: { id: item.ingredientId },
                    include: { baseUnit: true },
                });
                if (!ingredient) {
                    throw new common_1.NotFoundException(`Ingredient with ID ${item.ingredientId} not found`);
                }
                const balance = await tx.inventoryBalance.findUnique({
                    where: {
                        locationId_ingredientId: {
                            locationId: mainStore.id,
                            ingredientId: item.ingredientId,
                        },
                    },
                });
                if (!balance || Number(balance.quantity) < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient Main Store balance for "${ingredient.name}". Requested: ${item.quantity}, Available: ${balance?.quantity || 0} ${ingredient.baseUnit.symbol}`);
                }
                await tx.inventoryBalance.update({
                    where: { id: balance.id },
                    data: { quantity: { decrement: item.quantity } },
                });
                await tx.stockTransferItem.create({
                    data: {
                        transferId: transfer.id,
                        ingredientId: item.ingredientId,
                        requestedQty: item.quantity,
                        dispatchedQty: item.quantity,
                        unitId: ingredient.baseUnitId,
                    },
                });
                const unitCost = ingredient.currentCostPerBaseUnit;
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: shared_types_1.InventoryTransactionType.TRANSFER_DISPATCH,
                        sourceLocationId: mainStore.id,
                        destLocationId: kitchenStore.id,
                        ingredientId: item.ingredientId,
                        quantity: item.quantity,
                        unitCost,
                        totalCost: new client_1.Prisma.Decimal(item.quantity).mul(unitCost),
                        referenceId: transferNumber,
                        reason: `Batch Transfer to Kitchen Store: ${transferNumber}`,
                        userId: resolvedSenderId,
                    },
                });
            }
            const completeTransfer = await tx.stockTransfer.findUnique({
                where: { id: transfer.id },
                include: {
                    items: { include: { ingredient: { include: { baseUnit: true } }, unit: true } },
                    approvedBy: { select: { id: true, name: true } },
                    requestedBy: { select: { id: true, name: true } },
                    sourceLocation: true,
                    destLocation: true,
                },
            });
            this.eventsGateway.broadcastTransferUpdated(completeTransfer);
            return completeTransfer;
        });
    }
    async updateIngredientThresholds(ingredientId, thresholds) {
        const ingredient = await this.prisma.ingredient.findUnique({
            where: { id: ingredientId },
        });
        if (!ingredient)
            throw new common_1.NotFoundException('Ingredient not found');
        const updated = await this.prisma.ingredient.update({
            where: { id: ingredientId },
            data: {
                ...(thresholds.reorderThresholdMain !== undefined
                    ? { reorderThresholdMain: thresholds.reorderThresholdMain }
                    : {}),
                ...(thresholds.reorderThresholdKitchen !== undefined
                    ? { reorderThresholdKitchen: thresholds.reorderThresholdKitchen }
                    : {}),
            },
            include: { baseUnit: true },
        });
        return updated;
    }
    async recordWastage(userId, ingredientId, quantity, reason) {
        const kitchenStore = await this.prisma.inventoryLocation.findUnique({
            where: { type: shared_types_1.LocationType.KITCHEN_STORE },
        });
        if (!kitchenStore)
            throw new common_1.BadRequestException('Kitchen store not found');
        const ingredient = await this.prisma.ingredient.findUnique({
            where: { id: ingredientId },
            include: { baseUnit: true },
        });
        if (!ingredient)
            throw new common_1.NotFoundException('Ingredient not found');
        let user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await this.prisma.user.findFirst({ where: { role: 'KITCHEN_STOREKEEPER', isActive: true } });
        }
        const resolvedUserId = user ? user.id : userId;
        return this.prisma.$transaction(async (tx) => {
            const balance = await tx.inventoryBalance.findUnique({
                where: {
                    locationId_ingredientId: {
                        locationId: kitchenStore.id,
                        ingredientId,
                    },
                },
            });
            if (!balance || Number(balance.quantity) < quantity) {
                throw new common_1.BadRequestException(`Cannot waste more than current kitchen stock (${balance?.quantity || 0})`);
            }
            await tx.inventoryBalance.update({
                where: { id: balance.id },
                data: { quantity: { decrement: quantity } },
            });
            const unitCost = ingredient.currentCostPerBaseUnit;
            const totalCost = new client_1.Prisma.Decimal(quantity).mul(unitCost);
            const txn = await tx.inventoryTransaction.create({
                data: {
                    transactionType: shared_types_1.InventoryTransactionType.WASTAGE,
                    sourceLocationId: kitchenStore.id,
                    ingredientId,
                    quantity,
                    unitCost,
                    totalCost,
                    reason,
                    userId: resolvedUserId,
                },
            });
            return txn;
        });
    }
    async getTransfers() {
        return this.prisma.stockTransfer.findMany({
            include: {
                items: { include: { ingredient: { include: { baseUnit: true } }, unit: true } },
                requestedBy: { select: { id: true, name: true, role: true } },
                approvedBy: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getLedger(limit = 50) {
        return this.prisma.inventoryTransaction.findMany({
            take: limit,
            include: {
                ingredient: { include: { baseUnit: true } },
                sourceLocation: true,
                destLocation: true,
                user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSuppliers() {
        return this.prisma.supplier.findMany({
            include: { _count: { select: { purchases: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async createSupplier(data) {
        return this.prisma.supplier.create({ data });
    }
    async recordPurchaseReceipt(data) {
        const mainStore = await this.prisma.inventoryLocation.findUnique({
            where: { type: shared_types_1.LocationType.MAIN_STORE },
        });
        if (!mainStore)
            throw new common_1.BadRequestException('Main Store not found');
        let buyer = await this.prisma.user.findUnique({ where: { id: data.createdById } });
        if (!buyer) {
            buyer = await this.prisma.user.findFirst({ where: { role: 'MAIN_STOREKEEPER', isActive: true } });
        }
        const buyerId = buyer ? buyer.id : data.createdById;
        const poCount = await this.prisma.purchaseOrder.count();
        const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, '0')}`;
        const totalOrderCost = data.items.reduce((s, i) => s + i.totalCost, 0);
        return this.prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.create({
                data: {
                    poNumber,
                    invoiceNumber: data.invoiceNumber,
                    supplierId: data.supplierId,
                    locationId: mainStore.id,
                    totalAmount: totalOrderCost,
                    status: 'RECEIVED',
                    notes: data.notes,
                    createdById: buyerId,
                    items: {
                        create: data.items.map((i) => ({
                            ingredientId: i.ingredientId,
                            quantity: i.quantity,
                            unitCost: i.quantity > 0 ? i.totalCost / i.quantity : 0,
                            totalCost: i.totalCost,
                            unitId: i.unitId,
                        })),
                    },
                },
                include: { items: { include: { ingredient: true } }, supplier: true },
            });
            for (const item of data.items) {
                const unitCostPerGram = item.quantity > 0 ? item.totalCost / item.quantity : 0;
                const currentBalance = await tx.inventoryBalance.findUnique({
                    where: {
                        locationId_ingredientId: {
                            locationId: mainStore.id,
                            ingredientId: item.ingredientId,
                        },
                    },
                    include: { ingredient: true },
                });
                if (currentBalance) {
                    const oldQty = Number(currentBalance.quantity);
                    const oldValuation = oldQty * Number(currentBalance.ingredient.currentCostPerBaseUnit);
                    const newQty = oldQty + item.quantity;
                    const newValuation = oldValuation + item.totalCost;
                    const weightedCostPerBaseUnit = newQty > 0 ? newValuation / newQty : unitCostPerGram;
                    await tx.ingredient.update({
                        where: { id: item.ingredientId },
                        data: { currentCostPerBaseUnit: weightedCostPerBaseUnit },
                    });
                    await tx.inventoryBalance.update({
                        where: { id: currentBalance.id },
                        data: { quantity: { increment: item.quantity } },
                    });
                }
                else {
                    await tx.ingredient.update({
                        where: { id: item.ingredientId },
                        data: { currentCostPerBaseUnit: unitCostPerGram },
                    });
                    await tx.inventoryBalance.create({
                        data: {
                            locationId: mainStore.id,
                            ingredientId: item.ingredientId,
                            quantity: item.quantity,
                        },
                    });
                }
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: shared_types_1.InventoryTransactionType.PURCHASE_RECEIPT,
                        destLocationId: mainStore.id,
                        ingredientId: item.ingredientId,
                        quantity: item.quantity,
                        unitCost: unitCostPerGram,
                        totalCost: item.totalCost,
                        referenceId: po.poNumber,
                        reason: `Goods receipt from supplier: ${po.poNumber}`,
                        userId: buyerId,
                    },
                });
            }
            return po;
        });
    }
    async updateRecipe(menuItemId, yieldPortions, ingredientsList) {
        return this.prisma.$transaction(async (tx) => {
            let recipe = await tx.recipe.findUnique({ where: { menuItemId } });
            if (!recipe) {
                recipe = await tx.recipe.create({
                    data: {
                        menuItemId,
                        yieldPortions,
                        prepInstructions: 'Chef standard preparation',
                    },
                });
            }
            else {
                await tx.recipe.update({
                    where: { id: recipe.id },
                    data: { yieldPortions, version: { increment: 1 } },
                });
                await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
            }
            for (const ing of ingredientsList) {
                await tx.recipeIngredient.create({
                    data: {
                        recipeId: recipe.id,
                        ingredientId: ing.ingredientId,
                        quantity: ing.quantity,
                        unitId: ing.unitId,
                    },
                });
            }
            return tx.recipe.findUnique({
                where: { id: recipe.id },
                include: {
                    ingredients: { include: { ingredient: { include: { baseUnit: true } }, unit: true } },
                    menuItem: true,
                },
            });
        });
    }
    async adjustStock(userId, locationType, ingredientId, deltaQuantity, reason) {
        let user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await this.prisma.user.findFirst({
                where: locationType === shared_types_1.LocationType.MAIN_STORE ? { role: 'MAIN_STOREKEEPER' } : { role: 'HEAD_CHEF' },
            });
        }
        const resolvedUserId = user ? user.id : userId;
        return this.prisma.$transaction(async (tx) => {
            const location = await tx.inventoryLocation.findFirst({ where: { type: locationType } });
            if (!location)
                throw new common_1.BadRequestException(`Location ${locationType} not found`);
            const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId }, include: { baseUnit: true } });
            if (!ingredient)
                throw new common_1.BadRequestException(`Ingredient not found`);
            const balance = await tx.inventoryBalance.findUnique({
                where: {
                    locationId_ingredientId: {
                        locationId: location.id,
                        ingredientId,
                    },
                },
            });
            const currentQty = balance ? Number(balance.quantity) : 0;
            const newQty = currentQty + deltaQuantity;
            if (newQty < 0) {
                throw new common_1.BadRequestException(`Cannot remove ${Math.abs(deltaQuantity)} ${ingredient.baseUnit.symbol}. Current available balance is only ${currentQty} ${ingredient.baseUnit.symbol}.`);
            }
            const updatedBalance = await tx.inventoryBalance.upsert({
                where: {
                    locationId_ingredientId: {
                        locationId: location.id,
                        ingredientId,
                    },
                },
                update: { quantity: newQty },
                create: {
                    locationId: location.id,
                    ingredientId,
                    quantity: newQty,
                },
            });
            const unitCost = ingredient.currentCostPerBaseUnit;
            const absQty = Math.abs(deltaQuantity);
            const totalCost = new client_1.Prisma.Decimal(absQty).mul(unitCost);
            const txn = await tx.inventoryTransaction.create({
                data: {
                    transactionType: shared_types_1.InventoryTransactionType.ADJUSTMENT,
                    sourceLocationId: location.id,
                    ingredientId,
                    quantity: deltaQuantity,
                    unitCost,
                    totalCost,
                    reason: reason || (deltaQuantity > 0 ? `Manual stock addition (${locationType})` : `Manual stock deduction (${locationType})`),
                    userId: resolvedUserId,
                },
            });
            return { balance: updatedBalance, transaction: txn };
        });
    }
    async directDispatchTransfer(sentById, items, notes) {
        let sender = null;
        if (sentById) {
            sender = await this.prisma.user.findUnique({ where: { id: sentById } });
        }
        if (!sender) {
            sender = await this.prisma.user.findFirst({ where: { role: 'MAIN_STOREKEEPER', isActive: true } });
        }
        const resolvedSenderId = sender ? sender.id : sentById;
        return this.prisma.$transaction(async (tx) => {
            const mainStore = await tx.inventoryLocation.findFirst({ where: { type: shared_types_1.LocationType.MAIN_STORE } });
            const kitchenStore = await tx.inventoryLocation.findFirst({ where: { type: shared_types_1.LocationType.KITCHEN_STORE } });
            if (!mainStore || !kitchenStore)
                throw new common_1.BadRequestException('Stores not initialized');
            for (const item of items) {
                const balance = await tx.inventoryBalance.findUnique({
                    where: {
                        locationId_ingredientId: {
                            locationId: mainStore.id,
                            ingredientId: item.ingredientId,
                        },
                    },
                    include: { ingredient: { include: { baseUnit: true } } },
                });
                if (!balance || Number(balance.quantity) < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient Main Store balance for ${balance?.ingredient.name || 'ingredient'}. Available: ${balance?.quantity || 0}`);
                }
                await tx.inventoryBalance.update({
                    where: { id: balance.id },
                    data: { quantity: { decrement: item.quantity } },
                });
            }
            const count = await tx.stockTransfer.count();
            const transferNumber = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
            const transfer = await tx.stockTransfer.create({
                data: {
                    transferNumber,
                    sourceLocationId: mainStore.id,
                    destLocationId: kitchenStore.id,
                    status: shared_types_1.TransferStatus.DISPATCHED,
                    requestedById: resolvedSenderId,
                    approvedById: resolvedSenderId,
                    dispatchedAt: new Date(),
                    notes: notes || 'Direct Stock Dispatch from Main Storekeeper to Kitchen',
                },
            });
            for (const item of items) {
                const ing = await tx.ingredient.findUnique({ where: { id: item.ingredientId } });
                if (!ing)
                    continue;
                await tx.stockTransferItem.create({
                    data: {
                        transferId: transfer.id,
                        ingredientId: item.ingredientId,
                        requestedQty: item.quantity,
                        dispatchedQty: item.quantity,
                        unitId: ing.baseUnitId,
                    },
                });
                const unitCost = ing.currentCostPerBaseUnit;
                await tx.inventoryTransaction.create({
                    data: {
                        transactionType: shared_types_1.InventoryTransactionType.TRANSFER_DISPATCH,
                        sourceLocationId: mainStore.id,
                        destLocationId: kitchenStore.id,
                        ingredientId: item.ingredientId,
                        quantity: item.quantity,
                        unitCost,
                        totalCost: new client_1.Prisma.Decimal(item.quantity).mul(unitCost),
                        referenceId: transferNumber,
                        reason: `Dispatched to Kitchen: ${transferNumber}`,
                        userId: resolvedSenderId,
                    },
                });
            }
            const fullTransfer = await tx.stockTransfer.findUnique({
                where: { id: transfer.id },
                include: {
                    items: { include: { ingredient: { include: { baseUnit: true } }, unit: true } },
                    approvedBy: { select: { id: true, name: true, role: true } },
                    requestedBy: { select: { id: true, name: true, role: true } },
                },
            });
            this.eventsGateway.broadcastTransferUpdated(fullTransfer);
            return fullTransfer;
        });
    }
    async getIngredients() {
        return this.prisma.ingredient.findMany({
            where: { isActive: true },
            include: {
                baseUnit: true,
                balances: {
                    include: { location: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }
    async getUnits() {
        return this.prisma.unit.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async createIngredient(data) {
        let sku = data.sku?.trim();
        if (!sku) {
            const sanitized = data.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
            sku = `ING-${sanitized}-${Math.floor(100 + Math.random() * 900)}`;
        }
        return this.prisma.$transaction(async (tx) => {
            const mainStore = await tx.inventoryLocation.findUnique({
                where: { type: shared_types_1.LocationType.MAIN_STORE },
            });
            const kitchenStore = await tx.inventoryLocation.findUnique({
                where: { type: shared_types_1.LocationType.KITCHEN_STORE },
            });
            const ingredient = await tx.ingredient.create({
                data: {
                    name: data.name.trim(),
                    sku,
                    category: data.category?.trim() || 'General',
                    baseUnitId: data.baseUnitId,
                    currentCostPerBaseUnit: new client_1.Prisma.Decimal(data.currentCostPerBaseUnit),
                    reorderThresholdMain: new client_1.Prisma.Decimal(data.reorderThresholdMain ?? 1000),
                    reorderThresholdKitchen: new client_1.Prisma.Decimal(data.reorderThresholdKitchen ?? 200),
                    isActive: true,
                },
                include: { baseUnit: true },
            });
            if (mainStore) {
                const mainQty = data.initialMainStock && data.initialMainStock > 0 ? Number(data.initialMainStock) : 0;
                await tx.inventoryBalance.create({
                    data: {
                        locationId: mainStore.id,
                        ingredientId: ingredient.id,
                        quantity: new client_1.Prisma.Decimal(mainQty),
                        reservedQuantity: new client_1.Prisma.Decimal(0),
                    },
                });
            }
            if (kitchenStore) {
                const kitchenQty = data.initialKitchenStock && data.initialKitchenStock > 0 ? Number(data.initialKitchenStock) : 0;
                await tx.inventoryBalance.create({
                    data: {
                        locationId: kitchenStore.id,
                        ingredientId: ingredient.id,
                        quantity: new client_1.Prisma.Decimal(kitchenQty),
                        reservedQuantity: new client_1.Prisma.Decimal(0),
                    },
                });
            }
            this.eventsGateway.broadcastInventoryUpdated();
            return ingredient;
        });
    }
    async updateIngredient(id, data) {
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name.trim();
        if (data.sku !== undefined)
            updateData.sku = data.sku.trim();
        if (data.category !== undefined)
            updateData.category = data.category.trim();
        if (data.baseUnitId !== undefined)
            updateData.baseUnitId = data.baseUnitId;
        if (data.currentCostPerBaseUnit !== undefined) {
            updateData.currentCostPerBaseUnit = new client_1.Prisma.Decimal(data.currentCostPerBaseUnit);
        }
        if (data.reorderThresholdMain !== undefined) {
            updateData.reorderThresholdMain = new client_1.Prisma.Decimal(data.reorderThresholdMain);
        }
        if (data.reorderThresholdKitchen !== undefined) {
            updateData.reorderThresholdKitchen = new client_1.Prisma.Decimal(data.reorderThresholdKitchen);
        }
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        const updated = await this.prisma.ingredient.update({
            where: { id },
            data: updateData,
            include: {
                baseUnit: true,
                balances: { include: { location: true } },
            },
        });
        this.eventsGateway.broadcastInventoryUpdated();
        return updated;
    }
    async deleteIngredient(id) {
        const recipesCount = await this.prisma.recipeIngredient.count({ where: { ingredientId: id } });
        const directMenuItemsCount = await this.prisma.menuItem.count({ where: { directIngredientId: id } });
        if (recipesCount > 0 || directMenuItemsCount > 0) {
            const softDeleted = await this.prisma.ingredient.update({
                where: { id },
                data: { isActive: false },
            });
            this.eventsGateway.broadcastInventoryUpdated();
            return { success: true, message: 'Stock item archived (linked to recipes)', item: softDeleted };
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.inventoryTransaction.deleteMany({ where: { ingredientId: id } });
            await tx.inventoryBalance.deleteMany({ where: { ingredientId: id } });
            await tx.stockTransferItem.deleteMany({ where: { ingredientId: id } });
            await tx.purchaseOrderItem.deleteMany({ where: { ingredientId: id } });
            const deleted = await tx.ingredient.delete({ where: { id } });
            this.eventsGateway.broadcastInventoryUpdated();
            return { success: true, message: 'Stock item deleted permanently', item: deleted };
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map