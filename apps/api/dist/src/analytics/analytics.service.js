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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const shared_types_1 = require("@cafe/shared-types");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getExecutiveDashboard(timeframe = 'day') {
        const startDate = new Date();
        if (timeframe === 'day') {
            startDate.setHours(0, 0, 0, 0);
        }
        else if (timeframe === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        }
        else if (timeframe === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }
        else if (timeframe === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }
        const completedOrders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                paymentStatus: shared_types_1.PaymentStatus.PAID,
            },
            include: {
                items: { include: { menuItem: true } },
                payments: true,
                waiter: { select: { id: true, name: true, avatarUrl: true } },
                cashier: { select: { id: true, name: true } },
                table: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        let totalCogs = 0;
        for (const order of completedOrders) {
            for (const item of order.items) {
                totalCogs += Number(item.costAtSale || 0) * item.quantity;
            }
        }
        const wastage = await this.prisma.inventoryTransaction.findMany({
            where: {
                transactionType: 'WASTAGE',
                createdAt: { gte: startDate },
            },
        });
        const totalWastageCost = wastage.reduce((sum, w) => sum + Number(w.totalCost), 0);
        const expenses = await this.prisma.expense.findMany({
            where: { date: { gte: startDate } },
        });
        let totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        if (timeframe === 'day' && totalExpenses > 0) {
            totalExpenses = totalExpenses / 30;
        }
        const grossProfit = totalRevenue - totalCogs;
        const netProfit = grossProfit - totalWastageCost - totalExpenses;
        const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const pendingOrdersCount = await this.prisma.order.count({
            where: { status: { in: [shared_types_1.OrderStatus.DRAFT_NOTE, shared_types_1.OrderStatus.CONFIRMED] } },
        });
        const inProgressCount = await this.prisma.order.count({
            where: { status: shared_types_1.OrderStatus.IN_PREPARATION },
        });
        const readyOrdersCount = await this.prisma.order.count({
            where: { status: shared_types_1.OrderStatus.READY },
        });
        const totalTables = await this.prisma.diningTable.count();
        const activeTables = await this.prisma.diningTable.count({
            where: {
                orders: {
                    some: {
                        status: { in: [shared_types_1.OrderStatus.CONFIRMED, shared_types_1.OrderStatus.IN_PREPARATION, shared_types_1.OrderStatus.READY] },
                    },
                },
            },
        });
        const allOrderItems = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: startDate },
                    paymentStatus: shared_types_1.PaymentStatus.PAID,
                },
            },
            include: { menuItem: true },
        });
        const itemSalesMap = new Map();
        for (const itm of allOrderItems) {
            const existing = itemSalesMap.get(itm.menuItemId) || {
                name: itm.menuItem.name,
                count: 0,
                revenue: 0,
                imageUrl: itm.menuItem.imageUrl || '',
            };
            existing.count += itm.quantity;
            existing.revenue += Number(itm.subtotal);
            itemSalesMap.set(itm.menuItemId, existing);
        }
        const topDishes = Array.from(itemSalesMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const balances = await this.prisma.inventoryBalance.findMany({
            include: {
                location: true,
                ingredient: true,
            },
        });
        let mainStoreValuation = 0;
        let kitchenStoreValuation = 0;
        for (const b of balances) {
            const val = Number(b.quantity) * Number(b.ingredient.currentCostPerBaseUnit);
            if (b.location.type === 'MAIN_STORE') {
                mainStoreValuation += val;
            }
            else {
                kitchenStoreValuation += val;
            }
        }
        const settings = await this.prisma.businessSettings.findUnique({
            where: { id: 'default' },
        });
        const recentTransactions = completedOrders.slice(0, 8).map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName || 'Walk-in Guest',
            tableNumber: o.table?.tableNumber || 'Takeaway',
            waiterName: o.waiter?.name || 'Cashier',
            waiterAvatar: o.waiter?.avatarUrl,
            itemsSummary: o.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', '),
            totalAmount: Number(o.totalAmount),
            paymentMethod: o.payments[0]?.paymentMethod || 'CASH',
            createdAt: o.createdAt,
        }));
        const weeklyTrend = [
            { day: 'Sun', coffee: 450, food: 320, tea: 180, total: 950 },
            { day: 'Mon', coffee: 580, food: 410, tea: 210, total: 1200 },
            { day: 'Tue', coffee: 620, food: 490, tea: 230, total: 1340 },
            { day: 'Wed', coffee: 710, food: 530, tea: 280, total: 1520 },
            { day: 'Thu', coffee: 890, food: 680, tea: 340, total: 1910 },
            { day: 'Fri', coffee: 1145, food: 890, tea: 410, total: 2445 },
            { day: 'Sat', coffee: 1280, food: 1040, tea: 460, total: 2780 },
        ];
        return {
            kpis: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalOrdersToday: completedOrders.length,
                averageOrderValue: completedOrders.length > 0
                    ? Number((totalRevenue / completedOrders.length).toFixed(2))
                    : 0,
                cogs: Number(totalCogs.toFixed(2)),
                wastageCost: Number(totalWastageCost.toFixed(2)),
                expenses: Number(totalExpenses.toFixed(2)),
                grossProfit: Number(grossProfit.toFixed(2)),
                netProfit: Number(netProfit.toFixed(2)),
                netMarginPercent: Number(netMarginPercent.toFixed(1)),
                pendingOrders: pendingOrdersCount,
                ordersInProgress: inProgressCount,
                readyOrders: readyOrdersCount,
                availableTables: `${totalTables - activeTables}/${totalTables}`,
                customerSatisfactionScore: 98,
            },
            stockValuation: {
                mainStoreValuation: Number(mainStoreValuation.toFixed(2)),
                kitchenStoreValuation: Number(kitchenStoreValuation.toFixed(2)),
                totalCombined: Number((mainStoreValuation + kitchenStoreValuation).toFixed(2)),
            },
            topDishes,
            weeklyTrend,
            recentTransactions,
            settings,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map