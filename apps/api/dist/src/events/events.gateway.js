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
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const shared_types_1 = require("@cafe/shared-types");
let EventsGateway = class EventsGateway {
    handleConnection(client) {
        console.log(`🔌 Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`🔌 Client disconnected: ${client.id}`);
    }
    broadcastWaiterNote(orderNote) {
        this.server?.emit(shared_types_1.SocketEvents.WAITER_NEW_ORDER_NOTE, orderNote);
    }
    broadcastOrderConfirmed(order) {
        this.server?.emit(shared_types_1.SocketEvents.ORDER_CONFIRMED, order);
    }
    broadcastOrderStatus(order) {
        this.server?.emit(shared_types_1.SocketEvents.KITCHEN_ORDER_STATUS, order);
        this.server?.emit('order:updated', order);
        this.server?.emit('order:status_changed', order);
        if (order.status === 'READY') {
            this.server?.emit(shared_types_1.SocketEvents.KITCHEN_ORDER_READY, order);
        }
    }
    broadcastStockAlert(alert) {
        this.server?.emit(shared_types_1.SocketEvents.STOCK_LOW_ALERT, alert);
    }
    broadcastTransferUpdated(transfer) {
        this.server?.emit(shared_types_1.SocketEvents.STOCK_TRANSFER_UPDATED, transfer);
    }
    broadcastInventoryUpdated() {
        this.server?.emit('inventory:updated');
    }
    broadcastTablesUpdated(tables) {
        this.server?.emit('tables:updated', tables);
    }
    broadcastOrderUpdated(order) {
        this.server?.emit('order:updated', order);
    }
    handlePing(client, data) {
        return { event: 'pong', data };
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handlePing", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map