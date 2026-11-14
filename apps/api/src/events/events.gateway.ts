import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketEvents } from '@cafe/shared-types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
  }

  // Broadcast waiter draft note to cashiers
  broadcastWaiterNote(orderNote: any) {
    this.server?.emit(SocketEvents.WAITER_NEW_ORDER_NOTE, orderNote);
  }

  // Broadcast confirmed order to Kitchen Display System (KDS) & Waiter
  broadcastOrderConfirmed(order: any) {
    this.server?.emit(SocketEvents.ORDER_CONFIRMED, order);
  }

  // Broadcast status change (e.g. READY, SERVED, CANCELLED)
  broadcastOrderStatus(order: any) {
    this.server?.emit(SocketEvents.KITCHEN_ORDER_STATUS, order);
    this.server?.emit('order:updated', order);
    this.server?.emit('order:status_changed', order);
    if (order.status === 'READY') {
      this.server?.emit(SocketEvents.KITCHEN_ORDER_READY, order);
    }
  }

  // Broadcast inventory alert
  broadcastStockAlert(alert: any) {
    this.server?.emit(SocketEvents.STOCK_LOW_ALERT, alert);
  }

  // Broadcast stock transfer event
  broadcastTransferUpdated(transfer: any) {
    this.server?.emit(SocketEvents.STOCK_TRANSFER_UPDATED, transfer);
  }

  // Broadcast inventory and ingredient catalog update
  broadcastInventoryUpdated() {
    this.server?.emit('inventory:updated');
  }

  // Broadcast tables update to POS and Waiter Pads
  broadcastTablesUpdated(tables: any) {
    this.server?.emit('tables:updated', tables);
  }

  // Broadcast any order change (paid, appended, etc.)
  broadcastOrderUpdated(order: any) {
    this.server?.emit('order:updated', order);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any) {
    return { event: 'pong', data };
  }
}
