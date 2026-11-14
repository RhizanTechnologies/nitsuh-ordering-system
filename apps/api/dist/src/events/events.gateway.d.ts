import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    broadcastWaiterNote(orderNote: any): void;
    broadcastOrderConfirmed(order: any): void;
    broadcastOrderStatus(order: any): void;
    broadcastStockAlert(alert: any): void;
    broadcastTransferUpdated(transfer: any): void;
    broadcastInventoryUpdated(): void;
    broadcastTablesUpdated(tables: any): void;
    broadcastOrderUpdated(order: any): void;
    handlePing(client: Socket, data: any): {
        event: string;
        data: any;
    };
}
