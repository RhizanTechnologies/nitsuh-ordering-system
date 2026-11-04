import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  LocationType,
  TransferStatus,
  InventoryTransactionType,
} from '@cafe/shared-types';
import { EventsGateway } from '../events/events.gateway';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  // 1. Get Balances for both locations (Main Store & Kitchen Store)
  async getStockBalances(locationType?: LocationType) {
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

  // 2. Get low-stock alerts
  async getLowStockAlerts(locationType?: LocationType) {
    const balances = await this.prisma.inventoryBalance.findMany({
      where: locationType ? { location: { type: locationType } } : {},
      include: {
        location: true,
        ingredient: { include: { baseUnit: true } },
      },
    });

    return balances.filter((b) => {
      const currentQty = Number(b.quantity);
      if (b.location.type === LocationType.MAIN_STORE) {
        return currentQty <= Number(b.ingredient.reorderThresholdMain);
      } else {
        return currentQty <= Number(b.ingredient.reorderThresholdKitchen);
      }
    });
  }

  // 3. Create Stock Transfer Request (Kitchen Store -> Main Store)
  async requestTransfer(
    requestedById: string,
    items: { ingredientId: string; requestedQty: number; unitId: string }[],
    notes?: string,
  ) {
    const mainStore = await this.prisma.inventoryLocation.findUnique({
      where: { type: LocationType.MAIN_STORE },
    });
    const kitchenStore = await this.prisma.inventoryLocation.findUnique({
      where: { type: LocationType.KITCHEN_STORE },
    });

    if (!mainStore || !kitchenStore) {
      throw new BadRequestException('Store locations not configured');
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
        status: TransferStatus.REQUESTED,
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

  // 4. Dispatch Stock Transfer (Main Storekeeper sends stock - stock leaves Main Store, enters in-transit)
  async dispatchTransfer(transferId: string, approvedById: string, dispatchedItems: { itemId: string; dispatchedQty: number }[]) {
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

      if (!transfer || transfer.status !== TransferStatus.REQUESTED) {
        throw new BadRequestException('Transfer cannot be dispatched in current state');
      }

      for (const item of transfer.items) {
        const dispatchSpec = dispatchedItems.find((d) => d.itemId === item.id);
        const qtyToDispatch = dispatchSpec ? dispatchSpec.dispatchedQty : Number(item.requestedQty);

        // Check Main Store Balance
        const balance = await tx.inventoryBalance.findUnique({
          where: {
            locationId_ingredientId: {
              locationId: transfer.sourceLocationId,
              ingredientId: item.ingredientId,
            },
          },
        });

        if (!balance || Number(balance.quantity) < qtyToDispatch) {
          throw new BadRequestException(
            `Insufficient Main Store balance for ${item.ingredient.name}. Available: ${balance?.quantity || 0}`,
          );
        }

        // Deduct from Main Store
        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: { quantity: { decrement: qtyToDispatch } },
        });

        // Update transfer item dispatched quantity
        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: { dispatchedQty: qtyToDispatch },
        });

        // Record Transaction Ledger (TRANSFER_DISPATCH)
        const unitCost = item.ingredient.currentCostPerBaseUnit;
        await tx.inventoryTransaction.create({
          data: {
            transactionType: InventoryTransactionType.TRANSFER_DISPATCH,
            sourceLocationId: transfer.sourceLocationId,
            destLocationId: transfer.destLocationId,
            ingredientId: item.ingredientId,
            quantity: qtyToDispatch,
            unitCost,
            totalCost: new Prisma.Decimal(qtyToDispatch).mul(unitCost),
            referenceId: transfer.transferNumber,
            reason: `Transfer to Kitchen Store: ${transfer.transferNumber}`,
            userId: resolvedApproverId,
          },
        });
      }

      const updated = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.DISPATCHED,
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

  // 5. Receive Stock Transfer (Kitchen Storekeeper confirms received items into Kitchen Store)
  async receiveTransfer(
    transferId: string,
    receivedById?: string,
    receivedItems?: { itemId?: string; ingredientId?: string; receivedQty: number }[],
  ) {
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

      if (!transfer || transfer.status !== TransferStatus.DISPATCHED) {
        throw new BadRequestException('Transfer is not in dispatched state');
      }

      for (const item of transfer.items) {
        const receiveSpec = receivedItems?.find(
          (r) => r.itemId === item.id || r.ingredientId === item.ingredientId,
        );
        const qtyReceived = receiveSpec
          ? Number(receiveSpec.receivedQty)
          : Number(item.dispatchedQty || item.requestedQty);

        // Add to Kitchen Store Balance
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

        // Record Transaction Ledger (TRANSFER_RECEIVE)
        const unitCost = item.ingredient.currentCostPerBaseUnit;
        await tx.inventoryTransaction.create({
          data: {
            transactionType: InventoryTransactionType.TRANSFER_RECEIVE,
            sourceLocationId: transfer.sourceLocationId,
            destLocationId: transfer.destLocationId,
            ingredientId: item.ingredientId,
            quantity: qtyReceived,
            unitCost,
            totalCost: new Prisma.Decimal(qtyReceived).mul(unitCost),
            referenceId: transfer.transferNumber,
            reason: `Received in Kitchen Store: ${transfer.transferNumber}`,
            userId: resolvedReceiverId,
          },
        });
      }

      const updated = await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.RECEIVED,
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

  // 5.5. Reject Stock Transfer (Head Chef rejects incoming transfer)
  async rejectTransfer(transferId: string, rejectedById?: string, reason?: string) {
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

      if (!transfer || (transfer.status !== TransferStatus.DISPATCHED && transfer.status !== TransferStatus.REQUESTED)) {
        throw new BadRequestException('Transfer cannot be rejected in current state');
      }

      // If already dispatched, items had been deducted from Main Store, so return them back!
      if (transfer.status === TransferStatus.DISPATCHED) {
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

          // Record rejection refund ledger
          const unitCost = item.ingredient.currentCostPerBaseUnit;
          await tx.inventoryTransaction.create({
            data: {
              transactionType: InventoryTransactionType.TRANSFER_REJECT,
              sourceLocationId: transfer.destLocationId,
              destLocationId: transfer.sourceLocationId,
              ingredientId: item.ingredientId,
              quantity: qtyToRefund,
              unitCost,
              totalCost: new Prisma.Decimal(qtyToRefund).mul(unitCost),
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
          status: TransferStatus.REJECTED,
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

  // 5.6. Direct Batch Dispatch to Kitchen (Main Storekeeper sends multiple items in 1 batch)
  async dispatchDirectBatch(
    senderId: string,
    items: { ingredientId: string; quantity: number }[],
    notes?: string,
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('No items provided for dispatch');
    }

    const mainStore = await this.prisma.inventoryLocation.findUnique({
      where: { type: LocationType.MAIN_STORE },
    });
    const kitchenStore = await this.prisma.inventoryLocation.findUnique({
      where: { type: LocationType.KITCHEN_STORE },
    });

    if (!mainStore || !kitchenStore) {
      throw new BadRequestException('Main or Kitchen store location missing');
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

      // Create transfer record first
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          sourceLocationId: mainStore.id,
          destLocationId: kitchenStore.id,
          status: TransferStatus.DISPATCHED,
          requestedById: resolvedSenderId,
          approvedById: resolvedSenderId,
          dispatchedAt: new Date(),
          notes: notes || 'Direct Batch Delivery from Main Store',
        },
      });

      for (const item of items) {
        if (!item.quantity || item.quantity <= 0) continue;

        const ingredient = await tx.ingredient.findUnique({
          where: { id: item.ingredientId },
          include: { baseUnit: true },
        });

        if (!ingredient) {
          throw new NotFoundException(`Ingredient with ID ${item.ingredientId} not found`);
        }

        // Check and deduct Main Store balance
        const balance = await tx.inventoryBalance.findUnique({
          where: {
            locationId_ingredientId: {
              locationId: mainStore.id,
              ingredientId: item.ingredientId,
            },
          },
        });

        if (!balance || Number(balance.quantity) < item.quantity) {
          throw new BadRequestException(
            `Insufficient Main Store balance for "${ingredient.name}". Requested: ${item.quantity}, Available: ${balance?.quantity || 0} ${ingredient.baseUnit.symbol}`,
          );
        }

        // Deduct from Main Store
        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Add item to transfer
        await tx.stockTransferItem.create({
          data: {
            transferId: transfer.id,
            ingredientId: item.ingredientId,
            requestedQty: item.quantity,
            dispatchedQty: item.quantity,
            unitId: ingredient.baseUnitId,
          },
        });

        // Record Transaction Ledger
        const unitCost = ingredient.currentCostPerBaseUnit;
        await tx.inventoryTransaction.create({
          data: {
            transactionType: InventoryTransactionType.TRANSFER_DISPATCH,
            sourceLocationId: mainStore.id,
            destLocationId: kitchenStore.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unitCost,
            totalCost: new Prisma.Decimal(item.quantity).mul(unitCost),
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

  // Update low-stock alert thresholds for an ingredient (Main Store & Kitchen Store)
  async updateIngredientThresholds(
    ingredientId: string,
    thresholds: { reorderThresholdMain?: number; reorderThresholdKitchen?: number },
  ) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

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

  // 6. Record Kitchen Wastage / Spoilage
  async recordWastage(
    userId: string,
    ingredientId: string,
    quantity: number,
    reason: string,
  ) {
    const kitchenStore = await this.prisma.inventoryLocation.findUnique({
      where: { type: LocationType.KITCHEN_STORE },
    });
    if (!kitchenStore) throw new BadRequestException('Kitchen store not found');

    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { baseUnit: true },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

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
        throw new BadRequestException(`Cannot waste more than current kitchen stock (${balance?.quantity || 0})`);
      }

      await tx.inventoryBalance.update({
        where: { id: balance.id },
        data: { quantity: { decrement: quantity } },
      });

      const unitCost = ingredient.currentCostPerBaseUnit;
      const totalCost = new Prisma.Decimal(quantity).mul(unitCost);

      const txn = await tx.inventoryTransaction.create({
        data: {
          transactionType: InventoryTransactionType.WASTAGE,
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

  // 7. Get All Transfers
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

  // 8. Get Immutable Transaction Ledger
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

  // 9. Suppliers Management
  async getSuppliers() {
    return this.prisma.supplier.findMany({
      include: { _count: { select: { purchases: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(data: { name: string; contactPerson?: string; phone?: string; email?: string; address?: string }) {
    return this.prisma.supplier.create({ data });
  }

  // 10. Purchase Order / Goods Receipt (Supplier -> Main Store Bulk Restock)
  async recordPurchaseReceipt(data: {
    supplierId: string;
    invoiceNumber?: string;
    createdById: string;
    notes?: string;
    items: {
      ingredientId: string;
      quantity: number; // in base units (grams/ml/pcs)
      totalCost: number; // total monetary value paid for this line
      unitId: string;
    }[];
  }) {
    const mainStore = await this.prisma.inventoryLocation.findUnique({
      where: { type: LocationType.MAIN_STORE },
    });
    if (!mainStore) throw new BadRequestException('Main Store not found');

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

      // Update Main Store stock balance and Weighted Average Cost for each ingredient
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

        // Recalculate Weighted Average Cost (WAC)
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
        } else {
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

        // Write immutable ledger entry
        await tx.inventoryTransaction.create({
          data: {
            transactionType: InventoryTransactionType.PURCHASE_RECEIPT,
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

  // 11. Recipe Builder / Update Recipe Ingredients
  async updateRecipe(menuItemId: string, yieldPortions: number, ingredientsList: { ingredientId: string; quantity: number; unitId: string }[]) {
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
      } else {
        await tx.recipe.update({
          where: { id: recipe.id },
          data: { yieldPortions, version: { increment: 1 } },
        });
        // Clear previous ingredients
        await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
      }

      // Add new ingredient requirements
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

  // 12. Direct Stock Adjustment (Add or Remove stock for Main Store or Kitchen Store)
  async adjustStock(
    userId: string,
    locationType: LocationType,
    ingredientId: string,
    deltaQuantity: number,
    reason: string,
  ) {
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: locationType === LocationType.MAIN_STORE ? { role: 'MAIN_STOREKEEPER' } : { role: 'HEAD_CHEF' },
      });
    }
    const resolvedUserId = user ? user.id : userId;

    return this.prisma.$transaction(async (tx) => {
      const location = await tx.inventoryLocation.findFirst({ where: { type: locationType } });
      if (!location) throw new BadRequestException(`Location ${locationType} not found`);

      const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId }, include: { baseUnit: true } });
      if (!ingredient) throw new BadRequestException(`Ingredient not found`);

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
        throw new BadRequestException(
          `Cannot remove ${Math.abs(deltaQuantity)} ${ingredient.baseUnit.symbol}. Current available balance is only ${currentQty} ${ingredient.baseUnit.symbol}.`,
        );
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
      const totalCost = new Prisma.Decimal(absQty).mul(unitCost);

      const txn = await tx.inventoryTransaction.create({
        data: {
          transactionType: InventoryTransactionType.ADJUSTMENT,
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

  // 13. Direct Transfer Dispatch (Main Storekeeper sends directly to Kitchen Store)
  async directDispatchTransfer(
    sentById: string,
    items: { ingredientId: string; quantity: number }[],
    notes?: string,
  ) {
    let sender = null;
    if (sentById) {
      sender = await this.prisma.user.findUnique({ where: { id: sentById } });
    }
    if (!sender) {
      sender = await this.prisma.user.findFirst({ where: { role: 'MAIN_STOREKEEPER', isActive: true } });
    }
    const resolvedSenderId = sender ? sender.id : sentById;

    return this.prisma.$transaction(async (tx) => {
      const mainStore = await tx.inventoryLocation.findFirst({ where: { type: LocationType.MAIN_STORE } });
      const kitchenStore = await tx.inventoryLocation.findFirst({ where: { type: LocationType.KITCHEN_STORE } });

      if (!mainStore || !kitchenStore) throw new BadRequestException('Stores not initialized');

      // Verify balances in Main Store
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
          throw new BadRequestException(
            `Insufficient Main Store balance for ${balance?.ingredient.name || 'ingredient'}. Available: ${balance?.quantity || 0}`,
          );
        }

        // Deduct from Main Store immediately
        await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Generate Transfer Number
      const count = await tx.stockTransfer.count();
      const transferNumber = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      // Create Stock Transfer directly as DISPATCHED
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          sourceLocationId: mainStore.id,
          destLocationId: kitchenStore.id,
          status: TransferStatus.DISPATCHED,
          requestedById: resolvedSenderId,
          approvedById: resolvedSenderId,
          dispatchedAt: new Date(),
          notes: notes || 'Direct Stock Dispatch from Main Storekeeper to Kitchen',
        },
      });

      // Create Transfer Items & Ledger transactions
      for (const item of items) {
        const ing = await tx.ingredient.findUnique({ where: { id: item.ingredientId } });
        if (!ing) continue;

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
            transactionType: InventoryTransactionType.TRANSFER_DISPATCH,
            sourceLocationId: mainStore.id,
            destLocationId: kitchenStore.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unitCost,
            totalCost: new Prisma.Decimal(item.quantity).mul(unitCost),
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
}
