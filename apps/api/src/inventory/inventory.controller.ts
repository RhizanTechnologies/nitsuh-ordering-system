import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { LocationType } from '@cafe/shared-types';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('balances')
  async getBalances(@Query('location') location?: LocationType, @Query('role') role?: string) {
    if (role === 'HEAD_CHEF' || role === 'KITCHEN_STOREKEEPER' || role === 'KITCHEN_STAFF') {
      return this.inventoryService.getStockBalances(LocationType.KITCHEN_STORE);
    }
    return this.inventoryService.getStockBalances(location);
  }

  @Get('alerts')
  async getAlerts(@Query('role') role?: string) {
    const loc = (role === 'HEAD_CHEF' || role === 'KITCHEN_STOREKEEPER' || role === 'KITCHEN_STAFF')
      ? LocationType.KITCHEN_STORE
      : undefined;
    return this.inventoryService.getLowStockAlerts(loc);
  }

  @Get('transfers')
  async getTransfers() {
    return this.inventoryService.getTransfers();
  }

  @Post('transfers/request')
  async requestTransfer(
    @Body()
    body: {
      requestedById: string;
      items: { ingredientId: string; requestedQty: number; unitId: string }[];
      notes?: string;
    },
  ) {
    return this.inventoryService.requestTransfer(body.requestedById, body.items, body.notes);
  }

  @Post('transfers/:id/dispatch')
  async dispatchTransfer(
    @Param('id') id: string,
    @Body()
    body: {
      approvedById: string;
      dispatchedItems: { itemId: string; dispatchedQty: number }[];
    },
  ) {
    return this.inventoryService.dispatchTransfer(id, body.approvedById, body.dispatchedItems);
  }

  @Post('transfers/dispatch-batch')
  async dispatchDirectBatch(
    @Body()
    body: {
      senderId?: string;
      userId?: string;
      items: { ingredientId: string; quantity: number }[];
      notes?: string;
    },
  ) {
    const sender = body.senderId || body.userId || '';
    return this.inventoryService.dispatchDirectBatch(sender, body.items, body.notes);
  }

  @Post('transfers/:id/reject')
  async rejectTransfer(
    @Param('id') id: string,
    @Body()
    body: {
      rejectedById?: string;
      userId?: string;
      reason?: string;
    },
  ) {
    const rejector = body.rejectedById || body.userId || '';
    return this.inventoryService.rejectTransfer(id, rejector, body.reason);
  }

  @Patch('ingredients/:id/thresholds')
  async updateIngredientThresholds(
    @Param('id') id: string,
    @Body()
    body: {
      reorderThresholdMain?: number;
      reorderThresholdKitchen?: number;
    },
  ) {
    return this.inventoryService.updateIngredientThresholds(id, body);
  }

  @Post('transfers/:id/receive')
  async receiveTransfer(
    @Param('id') id: string,
    @Body()
    body: {
      receivedById?: string;
      userId?: string;
      receivedItems?: { itemId?: string; ingredientId?: string; receivedQty: number }[];
      items?: { itemId?: string; ingredientId?: string; receivedQty: number }[];
    },
  ) {
    const receiverId = body.receivedById || body.userId || '';
    const items = body.receivedItems || body.items || [];
    return this.inventoryService.receiveTransfer(id, receiverId, items);
  }

  @Post('wastage')
  async recordWastage(
    @Body()
    body: {
      userId: string;
      ingredientId: string;
      quantity: number;
      reason: string;
    },
  ) {
    return this.inventoryService.recordWastage(body.userId, body.ingredientId, body.quantity, body.reason);
  }

  @Get('ledger')
  async getLedger(@Query('limit') limit?: string) {
    return this.inventoryService.getLedger(limit ? parseInt(limit, 10) : 50);
  }

  @Get('suppliers')
  async getSuppliers() {
    return this.inventoryService.getSuppliers();
  }

  @Post('suppliers')
  async createSupplier(@Body() body: { name: string; contactPerson?: string; phone?: string; email?: string; address?: string }) {
    return this.inventoryService.createSupplier(body);
  }

  @Post('purchases')
  async recordPurchaseReceipt(
    @Body()
    body: {
      supplierId: string;
      invoiceNumber?: string;
      createdById: string;
      notes?: string;
      items: { ingredientId: string; quantity: number; totalCost: number; unitId: string }[];
    },
  ) {
    return this.inventoryService.recordPurchaseReceipt(body);
  }

  @Post('recipes')
  async updateRecipe(
    @Body()
    body: {
      menuItemId: string;
      yieldPortions: number;
      ingredientsList: { ingredientId: string; quantity: number; unitId: string }[];
    },
  ) {
    return this.inventoryService.updateRecipe(body.menuItemId, body.yieldPortions, body.ingredientsList);
  }

  @Post('adjust')
  async adjustStock(
    @Body()
    body: {
      userId: string;
      locationType: LocationType;
      ingredientId: string;
      deltaQuantity: number;
      reason: string;
    },
  ) {
    return this.inventoryService.adjustStock(
      body.userId,
      body.locationType,
      body.ingredientId,
      body.deltaQuantity,
      body.reason,
    );
  }

  @Post('transfers/direct-dispatch')
  async directDispatch(
    @Body()
    body: {
      sentById?: string;
      userId?: string;
      items?: { ingredientId: string; quantity: number }[];
      ingredientId?: string;
      quantity?: number;
      notes?: string;
    },
  ) {
    const senderId = body.sentById || body.userId || '';
    const items = body.items || (body.ingredientId && body.quantity ? [{ ingredientId: body.ingredientId, quantity: Number(body.quantity) }] : []);
    return this.inventoryService.directDispatchTransfer(senderId, items, body.notes);
  }
}
