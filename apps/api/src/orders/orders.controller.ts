import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStatus, OrderType, PaymentMethod } from '@cafe/shared-types';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  async getOrders(
    @Query('statuses') statuses?: string,
    @Query('tableId') tableId?: string,
    @Query('waiterId') waiterId?: string,
  ) {
    const statusArray = statuses ? (statuses.split(',') as OrderStatus[]) : undefined;
    return this.ordersService.getOrders({ statuses: statusArray, tableId, waiterId });
  }

  @Get('waiter-slips')
  async getWaiterSlips() {
    return this.ordersService.getWaiterDraftSlips();
  }

  @Post('waiter-note')
  async createWaiterDraftNote(
    @Body()
    body: {
      tableId?: string;
      customerName?: string;
      waiterId: string;
      orderType?: OrderType;
      items: { menuItemId: string; quantity: number; specialInstructions?: string }[];
    },
  ) {
    return this.ordersService.createWaiterDraftNote(body);
  }

  @Post('pos')
  async createPosOrder(
    @Body()
    body: {
      cashierId: string;
      tableId?: string;
      customerName?: string;
      waiterId?: string;
      orderType: OrderType;
      items: { menuItemId: string; quantity: number; specialInstructions?: string }[];
    },
  ) {
    return this.ordersService.createPosOrder(body);
  }

  @Post(':id/confirm')
  async confirmOrder(
    @Param('id') id: string,
    @Body() body: { cashierId: string },
  ) {
    return this.ordersService.confirmOrder(id, body.cashierId);
  }

  @Post(':id/append-items')
  async appendItems(
    @Param('id') id: string,
    @Body()
    body: {
      cashierId?: string;
      items: { menuItemId: string; quantity: number; specialInstructions?: string }[];
    },
  ) {
    return this.ordersService.appendItemsToOrder(id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; actorUserId?: string },
  ) {
    return this.ordersService.updateOrderStatus(id, body.status, body.actorUserId);
  }

  @Post(':id/payment')
  async recordPayment(
    @Param('id') id: string,
    @Body() body: { amount: number; paymentMethod: PaymentMethod; transactionRef?: string },
  ) {
    return this.ordersService.recordPayment(id, body);
  }
}
