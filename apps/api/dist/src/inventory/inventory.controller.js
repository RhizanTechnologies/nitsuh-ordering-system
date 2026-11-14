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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const shared_types_1 = require("@cafe/shared-types");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async getBalances(location, role) {
        if (role === 'HEAD_CHEF' || role === 'KITCHEN_STOREKEEPER' || role === 'KITCHEN_STAFF') {
            return this.inventoryService.getStockBalances(shared_types_1.LocationType.KITCHEN_STORE);
        }
        return this.inventoryService.getStockBalances(location);
    }
    async getAlerts(role) {
        const loc = (role === 'HEAD_CHEF' || role === 'KITCHEN_STOREKEEPER' || role === 'KITCHEN_STAFF')
            ? shared_types_1.LocationType.KITCHEN_STORE
            : undefined;
        return this.inventoryService.getLowStockAlerts(loc);
    }
    async getTransfers() {
        return this.inventoryService.getTransfers();
    }
    async requestTransfer(body) {
        return this.inventoryService.requestTransfer(body.requestedById, body.items, body.notes);
    }
    async dispatchTransfer(id, body) {
        return this.inventoryService.dispatchTransfer(id, body.approvedById, body.dispatchedItems);
    }
    async dispatchDirectBatch(body) {
        const sender = body.senderId || body.userId || '';
        return this.inventoryService.dispatchDirectBatch(sender, body.items, body.notes);
    }
    async rejectTransfer(id, body) {
        const rejector = body.rejectedById || body.userId || '';
        return this.inventoryService.rejectTransfer(id, rejector, body.reason);
    }
    async updateIngredientThresholds(id, body) {
        return this.inventoryService.updateIngredientThresholds(id, body);
    }
    async receiveTransfer(id, body) {
        const receiverId = body.receivedById || body.userId || '';
        const items = body.receivedItems || body.items || [];
        return this.inventoryService.receiveTransfer(id, receiverId, items);
    }
    async recordWastage(body) {
        return this.inventoryService.recordWastage(body.userId, body.ingredientId, body.quantity, body.reason);
    }
    async getLedger(limit) {
        return this.inventoryService.getLedger(limit ? parseInt(limit, 10) : 50);
    }
    async getSuppliers() {
        return this.inventoryService.getSuppliers();
    }
    async createSupplier(body) {
        return this.inventoryService.createSupplier(body);
    }
    async recordPurchaseReceipt(body) {
        return this.inventoryService.recordPurchaseReceipt(body);
    }
    async updateRecipe(body) {
        return this.inventoryService.updateRecipe(body.menuItemId, body.yieldPortions, body.ingredientsList);
    }
    async adjustStock(body) {
        return this.inventoryService.adjustStock(body.userId, body.locationType, body.ingredientId, body.deltaQuantity, body.reason);
    }
    async directDispatch(body) {
        const senderId = body.sentById || body.userId || '';
        const items = body.items || (body.ingredientId && body.quantity ? [{ ingredientId: body.ingredientId, quantity: Number(body.quantity) }] : []);
        return this.inventoryService.directDispatchTransfer(senderId, items, body.notes);
    }
    async getIngredients() {
        return this.inventoryService.getIngredients();
    }
    async getUnits() {
        return this.inventoryService.getUnits();
    }
    async createIngredient(body) {
        return this.inventoryService.createIngredient(body);
    }
    async updateIngredient(id, body) {
        return this.inventoryService.updateIngredient(id, body);
    }
    async deleteIngredient(id) {
        return this.inventoryService.deleteIngredient(id);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('balances'),
    __param(0, (0, common_1.Query)('location')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getBalances", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('transfers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getTransfers", null);
__decorate([
    (0, common_1.Post)('transfers/request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "requestTransfer", null);
__decorate([
    (0, common_1.Post)('transfers/:id/dispatch'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "dispatchTransfer", null);
__decorate([
    (0, common_1.Post)('transfers/dispatch-batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "dispatchDirectBatch", null);
__decorate([
    (0, common_1.Post)('transfers/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "rejectTransfer", null);
__decorate([
    (0, common_1.Patch)('ingredients/:id/thresholds'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateIngredientThresholds", null);
__decorate([
    (0, common_1.Post)('transfers/:id/receive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "receiveTransfer", null);
__decorate([
    (0, common_1.Post)('wastage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "recordWastage", null);
__decorate([
    (0, common_1.Get)('ledger'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLedger", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getSuppliers", null);
__decorate([
    (0, common_1.Post)('suppliers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Post)('purchases'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "recordPurchaseReceipt", null);
__decorate([
    (0, common_1.Post)('recipes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateRecipe", null);
__decorate([
    (0, common_1.Post)('adjust'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Post)('transfers/direct-dispatch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "directDispatch", null);
__decorate([
    (0, common_1.Get)('ingredients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getIngredients", null);
__decorate([
    (0, common_1.Get)('units'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getUnits", null);
__decorate([
    (0, common_1.Post)('ingredients'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createIngredient", null);
__decorate([
    (0, common_1.Patch)('ingredients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateIngredient", null);
__decorate([
    (0, common_1.Delete)('ingredients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteIngredient", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map