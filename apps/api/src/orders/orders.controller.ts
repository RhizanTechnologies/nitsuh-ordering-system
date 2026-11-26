import { Controller, Get, Post, Put, Body, Param, Query, Patch, BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { OrderStatus, OrderType, PaymentMethod } from '@cafe/shared-types';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  async getOrders(
    @Query('statuses') statuses?: string,
    @Query('tableId') tableId?: string,
    @Query('waiterId') waiterId?: string,
    @Query('limit') limit?: string,
  ) {
    const statusArray = statuses ? (statuses.split(',') as OrderStatus[]) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.ordersService.getOrders({ statuses: statusArray, tableId, waiterId, limit: parsedLimit });
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
      notes?: string;
      discount?: number;
      discountPercent?: number;
      items: { menuItemId: string; quantity: number; specialInstructions?: string; selectedAddonIds?: string[]; selectedAddons?: any[] }[];
    },
  ) {
    try {
      return await this.ordersService.createWaiterDraftNote(body);
    } catch (err: any) {
      console.error('ERROR in createWaiterDraftNote:', err);
      throw new BadRequestException(err?.message || 'Failed to create waiter draft note');
    }
  }

  @Put(':id/draft-note')
  async updateWaiterDraftNotePut(
    @Param('id') id: string,
    @Body()
    body: {
      waiterId?: string;
      tableId?: string;
      customerName?: string;
      notes?: string;
      items: {
        menuItemId: string;
        quantity: number;
        specialInstructions?: string;
        selectedAddonIds?: string[];
        selectedAddons?: any[];
      }[];
    },
  ) {
    try {
      return await this.ordersService.updateWaiterDraftNote(id, body);
    } catch (err: any) {
      console.error('ERROR in updateWaiterDraftNotePut:', err);
      throw new BadRequestException(err?.message || 'Failed to update waiter draft note');
    }
  }

  @Patch(':id/draft-note')
  async updateWaiterDraftNotePatch(
    @Param('id') id: string,
    @Body()
    body: {
      waiterId?: string;
      tableId?: string;
      customerName?: string;
      notes?: string;
      items: {
        menuItemId: string;
        quantity: number;
        specialInstructions?: string;
        selectedAddonIds?: string[];
        selectedAddons?: any[];
      }[];
    },
  ) {
    try {
      return await this.ordersService.updateWaiterDraftNote(id, body);
    } catch (err: any) {
      console.error('ERROR in updateWaiterDraftNotePatch:', err);
      throw new BadRequestException(err?.message || 'Failed to update waiter draft note');
    }
  }

  @Post('pos')
  async createPosOrder(
    @Body()
    body: {
      cashierId: string;
      confirm?: boolean;
      tableId?: string;
      customerName?: string;
      waiterId?: string;
      orderType: OrderType;
      discount?: number;
      discountPercent?: number;
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

  @Put(':id/update-and-confirm')
  async updateAndConfirmOrderPut(
    @Param('id') id: string,
    @Body()
    body: {
      cashierId: string;
      confirm?: boolean;
      tableId?: string;
      customerName?: string;
      orderType?: OrderType;
      discount?: number;
      discountPercent?: number;
      items: {
        menuItemId: string;
        quantity: number;
        tip?: number;
        specialInstructions?: string;
        selectedAddonIds?: string[];
        selectedAddons?: any[];
      }[];
    },
  ) {
    try {
      return await this.ordersService.updateAndConfirmDraftNote(id, body);
    } catch (err: any) {
      console.error('ERROR in updateAndConfirmOrderPut:', err);
      throw new BadRequestException(err?.message || 'Failed to update and confirm order');
    }
  }

  @Post(':id/update-and-confirm')
  async updateAndConfirmOrderPost(
    @Param('id') id: string,
    @Body()
    body: {
      cashierId: string;
      confirm?: boolean;
      tableId?: string;
      customerName?: string;
      orderType?: OrderType;
      discount?: number;
      discountPercent?: number;
      items: {
        menuItemId: string;
        quantity: number;
        tip?: number;
        specialInstructions?: string;
        selectedAddonIds?: string[];
        selectedAddons?: any[];
      }[];
    },
  ) {
    try {
      return await this.ordersService.updateAndConfirmDraftNote(id, body);
    } catch (err: any) {
      console.error('ERROR in updateAndConfirmOrderPost:', err);
      throw new BadRequestException(err?.message || 'Failed to update and confirm order');
    }
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
